# LSAT Forge — State Architecture

## State Management Approach

**No Redux. No Zustand.** Keep it simple:
- Supabase Auth: handled by `@supabase/auth-helpers-react`
- Server state: React Query (TanStack Query) for all Supabase data fetching
- UI/session state: React Context + useState for active quiz sessions
- URL state: React Router for navigation

---

## Context Providers

### AuthContext
Wraps entire app. Provides:
```typescript
interface AuthContext {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isPro: boolean
  questionsRemaining: number // 20 - questions_used, clamped to 0
  refreshProfile: () => Promise<void>
}
```

Implementation:
```typescript
// src/context/AuthContext.tsx
export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const supabase = useSupabaseClient()
  const user = useUser() // from @supabase/auth-helpers-react

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  }

  const isPro = profile?.tier === 'pro' && 
    profile?.subscription_status === 'active'

  const questionsRemaining = Math.max(0, 20 - (profile?.questions_used ?? 0))

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isPro, questionsRemaining, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### SessionContext
Active quiz session state. Only mounted when a session is in progress.
```typescript
interface SessionContext {
  sessionId: string
  mode: SessionMode
  questions: Question[]
  currentIndex: number
  responses: Record<number, Response>
  flagged: Set<number>
  isComplete: boolean
  timeRemaining: number // seconds, simulation only
  currentSection: 'lr1' | 'lr2' | 'rc' | null // simulation only

  // Actions
  answerQuestion: (index: number, timeSpent: number) => void
  flagQuestion: (index: number) => void
  nextQuestion: () => void
  jumpToQuestion: (index: number) => void
  completeSession: () => Promise<void>
  completeSection: () => void // simulation only
}
```

---

## React Query Keys

Consistent query key patterns for cache invalidation:
```typescript
export const queryKeys = {
  profile: (userId: string) => ['profile', userId],
  sessions: (userId: string) => ['sessions', userId],
  session: (sessionId: string) => ['session', sessionId],
  typeStats: (userId: string) => ['typeStats', userId],
  simulationResults: (userId: string) => ['simulationResults', userId],
  analytics: (userId: string) => ['analytics', userId],
}
```

---

## Data Fetching Patterns

### Profile (cached, auto-refresh)
```typescript
export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.profile(user?.id),
    queryFn: () => supabase.from('profiles').select('*').eq('id', user.id).single(),
    enabled: !!user,
    staleTime: 30_000 // 30s — profile doesn't change often
  })
}
```

### Generate Questions (mutation)
```typescript
export function useGenerateQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: GenerateParams) => {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: params
      })
      if (error) throw error
      if (data.error === 'FREE_LIMIT_REACHED') throw new FreeLimitError()
      if (data.error === 'PRO_REQUIRED') throw new ProRequiredError()
      return data
    },
    onSuccess: () => {
      // Invalidate profile to get updated questions_used
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
    }
  })
}
```

### Complete Session (mutation)
```typescript
export function useCompleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params) => supabase.functions.invoke('complete-session', { body: params }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.typeStats(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
    }
  })
}
```

---

## Session State Machine

Quiz sessions follow a strict state machine to prevent invalid transitions.

```
States:
IDLE → LOADING → ACTIVE → REVIEWING (practice only) → COMPLETE

IDLE: No session. Show setup screen.
LOADING: API call in progress. Show loading screen.
ACTIVE: Question displayed, awaiting answer.
REVIEWING: Answer given, explanation shown (practice mode only).
COMPLETE: All questions done. Redirect to /results/:sessionId.

Simulation has sub-states:
ACTIVE_SECTION_LR1 → BREAK → ACTIVE_SECTION_LR2 → BREAK → ACTIVE_SECTION_RC → COMPLETE
```

```typescript
type SessionState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'active'; question: Question; questionIndex: number }
  | { status: 'reviewing'; question: Question; chosenIndex: number }
  | { status: 'complete'; sessionId: string }

// Reducer handles transitions
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_LOADING': return { status: 'loading' }
    case 'QUESTIONS_LOADED': return { status: 'active', question: action.questions[0], questionIndex: 0 }
    case 'ANSWER_GIVEN':
      if (state.status !== 'active') return state
      return state.mode === 'practice'
        ? { ...state, status: 'reviewing', chosenIndex: action.index }
        : nextQuestionOrComplete(state)
    case 'NEXT_QUESTION': return nextQuestionOrComplete(state)
    case 'SESSION_COMPLETE': return { status: 'complete', sessionId: action.sessionId }
    default: return state
  }
}
```

---

## Route Protection

```typescript
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children, requirePro = false }) {
  const { user, isPro, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" />
  if (requirePro && !isPro) return <Navigate to="/upgrade" />

  return children
}

// Usage in router
<Route path="/simulation" element={
  <ProtectedRoute requirePro>
    <SimulationPage />
  </ProtectedRoute>
} />
```

---

## Error Handling

### Global error boundary
Wraps app. Catches React render errors. Shows friendly error screen.

### API error handling pattern
```typescript
// All edge function calls go through this wrapper
async function invokeFunction(name: string, body: object) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    if (error.message.includes('FREE_LIMIT_REACHED')) {
      throw new FreeLimitError('You have used all 20 free questions.')
    }
    if (error.message.includes('PRO_REQUIRED')) {
      throw new ProRequiredError('This feature requires a Pro subscription.')
    }
    throw new AppError('Something went wrong. Please try again.')
  }

  return data
}
```

### FreeLimitError handling
When thrown, show UpgradeModal automatically:
```typescript
// In useGenerateQuestions onError
if (error instanceof FreeLimitError) {
  setShowUpgradeModal(true)
}
```

---

## Local Storage

Minimal use. Only persist:
```typescript
// Quiz progress backup (in case of accidental refresh during active session)
// Key: 'lsat_session_backup'
// Value: { sessionId, questions, responses, currentIndex }
// Clear on session complete
```

Do NOT persist auth state in localStorage — Supabase handles this via its own secure storage.

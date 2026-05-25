import {
  createContext, useContext, useReducer, useCallback,
  useRef, useEffect, type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../hooks/useProfile'
import type { Question, ResponseRecord } from '../types'

export type { Question, ResponseRecord }

type SessionMode = 'practice' | 'drill' | 'simulation' | 'weakspot'

type SessionStatus =
  | 'idle'
  | 'loading'
  | 'active'
  | 'reviewing'   // practice/drill/weakspot: show explanation after answer
  | 'complete'

interface SessionState {
  status: SessionStatus
  sessionId: string | null
  mode: SessionMode | null
  questions: Question[]
  currentIndex: number
  responses: ResponseRecord[]
  flagged: Set<number>
  timeRemaining: number   // seconds, simulation only
  answerTimestamp: number // when current question was shown (ms)
}

type Action =
  | { type: 'START_LOADING' }
  | { type: 'QUESTIONS_LOADED'; questions: Question[]; sessionId: string; mode: SessionMode }
  | { type: 'ANSWER'; chosenIndex: number; timeSpent: number }
  | { type: 'NEXT' }
  | { type: 'FLAG'; index: number }
  | { type: 'TICK' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }
  | { type: 'RECORD_TRAP'; selectedTrapType: string; correctDiagnosis: boolean }

const INITIAL: SessionState = {
  status: 'idle', sessionId: null, mode: null,
  questions: [], currentIndex: 0, responses: [],
  flagged: new Set(), timeRemaining: 35 * 60, answerTimestamp: 0,
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...INITIAL, status: 'loading' }

    case 'QUESTIONS_LOADED':
      return {
        ...state, status: 'active',
        sessionId: action.sessionId,
        mode: action.mode,
        questions: action.questions,
        currentIndex: 0, responses: [],
        flagged: new Set(),
        timeRemaining: 35 * 60,
        answerTimestamp: Date.now(),
      }

    case 'ANSWER': {
      const q = state.questions[state.currentIndex]
      const record: ResponseRecord = {
        questionType: q.type,
        difficulty: q.difficulty,
        chosenIndex: action.chosenIndex,
        correctIndex: q.correctIndex,
        isCorrect: action.chosenIndex === q.correctIndex,
        timeSpentSeconds: action.timeSpent,
      }
      const responses = [...state.responses, record]
      // Simulation / drill: no review step — go straight to next
      if (state.mode === 'simulation') {
        const nextIndex = state.currentIndex + 1
        if (nextIndex >= state.questions.length) {
          return { ...state, responses, status: 'complete' }
        }
        return { ...state, responses, currentIndex: nextIndex, answerTimestamp: Date.now() }
      }
      // Practice / drill / weakspot: show explanation
      return { ...state, responses, status: 'reviewing' }
    }

    case 'NEXT': {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'complete' }
      }
      return { ...state, status: 'active', currentIndex: nextIndex, answerTimestamp: Date.now() }
    }

    case 'FLAG': {
      const flagged = new Set(state.flagged)
      flagged.has(action.index) ? flagged.delete(action.index) : flagged.add(action.index)
      return { ...state, flagged }
    }

    case 'TICK':
      if (state.timeRemaining <= 0) return { ...state, status: 'complete' }
      return { ...state, timeRemaining: state.timeRemaining - 1 }

    case 'COMPLETE':
      return { ...state, status: 'complete' }

    case 'RECORD_TRAP': {
      const responses = [...state.responses]
      if (responses.length === 0) return state
      responses[responses.length - 1] = {
        ...responses[responses.length - 1],
        selectedTrapType: action.selectedTrapType,
        correctDiagnosis: action.correctDiagnosis,
      }
      return { ...state, responses }
    }

    case 'RESET':
      return INITIAL

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState
  currentQuestion: Question | null
  startSession: (params: {
    mode: SessionMode
    questionTypes: string[]
    difficulty: string
    count: number
    section?: string
  }) => Promise<void>
  answerQuestion: (chosenIndex: number) => void
  nextQuestion: () => void
  flagQuestion: (index: number) => void
  skipQuestion: () => void
  recordTrapDiagnosis: (selectedTrapType: string, correctDiagnosis: boolean) => void
  finishSession: () => Promise<void>
  completeSession: () => void
  reset: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

// ── Provider ──────────────────────────────────────────────────────────────────

const BACKUP_KEY = 'lsat_session_backup'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentQuestion = state.questions[state.currentIndex] ?? null

  // Simulation countdown timer
  useEffect(() => {
    if (state.mode === 'simulation' && state.status === 'active') {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state.mode, state.status])

  // Save to localStorage on every answer
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'complete') {
      localStorage.removeItem(BACKUP_KEY)
    } else if (state.sessionId) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({
        sessionId: state.sessionId,
        currentIndex: state.currentIndex,
        responses: state.responses,
        mode: state.mode,
      }))
    }
  }, [state.responses.length, state.status])

  const startSession = useCallback(async (params: {
    mode: SessionMode
    questionTypes: string[]
    difficulty: string
    count: number
    section?: string
  }) => {
    dispatch({ type: 'START_LOADING' })
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', { body: params })
      if (error || data?.error) throw new Error(data?.error ?? error?.message)
      dispatch({
        type: 'QUESTIONS_LOADED',
        questions: data.questions,
        sessionId: data.sessionId,
        mode: params.mode,
      })
    } catch (err) {
      dispatch({ type: 'RESET' })
      throw err
    }
  }, [])

  const answerQuestion = useCallback((chosenIndex: number) => {
    const timeSpent = Math.round((Date.now() - state.answerTimestamp) / 1000)
    dispatch({ type: 'ANSWER', chosenIndex, timeSpent })
  }, [state.answerTimestamp])

  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const flagQuestion = useCallback((index: number) => dispatch({ type: 'FLAG', index }), [])
  const recordTrapDiagnosis = useCallback((selectedTrapType: string, correctDiagnosis: boolean) => {
    dispatch({ type: 'RECORD_TRAP', selectedTrapType, correctDiagnosis })
  }, [])

  const skipQuestion = useCallback(() => {
    const q = state.questions[state.currentIndex]
    if (!q) return
    const timeSpent = Math.round((Date.now() - state.answerTimestamp) / 1000)
    const fakeWrong = q.correctIndex === 0 ? 1 : 0
    dispatch({ type: 'ANSWER', chosenIndex: fakeWrong, timeSpent })
    // immediately advance past review in practice mode
    if (state.mode !== 'simulation') dispatch({ type: 'NEXT' })
  }, [state.currentIndex, state.questions, state.answerTimestamp, state.mode])

  const finishSession = useCallback(async () => {
    if (!state.sessionId || !user) return
    const totalTime = state.responses.reduce((s, r) => s + r.timeSpentSeconds, 0)
    try {
      await supabase.functions.invoke('complete-session', {
        body: {
          sessionId: state.sessionId,
          responses: state.responses,
          totalTimeSeconds: totalTime,
        },
      })
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.typeStats(user.id) })
      }
      await refreshProfile()
      localStorage.removeItem(BACKUP_KEY)
      navigate(`/results/${state.sessionId}`)
    } catch (err) {
      console.error('Failed to complete session', err)
    }
  }, [state.sessionId, state.responses, user, navigate, queryClient, refreshProfile])

  // Auto-finish when state machine reaches complete
  useEffect(() => {
    if (state.status === 'complete' && state.sessionId) {
      finishSession()
    }
  }, [state.status])

  const completeSession = useCallback(() => dispatch({ type: 'COMPLETE' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return (
    <SessionContext.Provider value={{
      state, currentQuestion,
      startSession, answerQuestion, nextQuestion,
      flagQuestion, skipQuestion, recordTrapDiagnosis,
      finishSession, completeSession, reset,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

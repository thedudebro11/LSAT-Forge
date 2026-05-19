export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  tier: 'free' | 'monthly' | 'annual'
  questions_used: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  subscription_period_end?: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  mode: 'practice' | 'drill' | 'simulation' | 'weakspot'
  question_types: string[]
  difficulty: string
  total_questions: number
  correct_count: number
  score_pct: number
  status: 'active' | 'completed'
  time_taken_seconds: number
  started_at: string
  completed_at?: string
}

export interface Response {
  id: string
  session_id: string
  user_id: string
  question_type: string
  difficulty: string
  chosen_index: number
  correct_index: number
  is_correct: boolean
  time_spent_seconds: number
  created_at: string
}

export interface TypeStat {
  id: string
  user_id: string
  question_type: string
  total_answered: number
  correct_count: number
  updated_at: string
}

export interface SimulationResult {
  id: string
  user_id: string
  session_id: string
  total_correct: number
  total_questions: number
  estimated_score_low: number
  estimated_score_high: number
  created_at: string
}

export interface Question {
  id: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  stimulus: string
  stem: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface ResponseRecord {
  questionType: string
  difficulty: string
  chosenIndex: number
  correctIndex: number
  isCorrect: boolean
  timeSpentSeconds: number
}

export interface GenerateParams {
  mode: 'practice' | 'drill' | 'simulation' | 'weakspot'
  questionTypes: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  count: number
}

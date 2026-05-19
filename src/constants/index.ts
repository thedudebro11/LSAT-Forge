export const QUESTION_TYPES = [
  { value: 'necessary-assumption', label: 'Necessary Assumption' },
  { value: 'sufficient-assumption', label: 'Sufficient Assumption' },
  { value: 'strengthen', label: 'Strengthen' },
  { value: 'weaken', label: 'Weaken' },
  { value: 'flaw', label: 'Flaw' },
  { value: 'principle-identify', label: 'Identify a Principle' },
  { value: 'principle-apply', label: 'Apply a Principle' },
  { value: 'inference', label: 'Inference / Must Be True' },
  { value: 'most-strongly-supported', label: 'Most Strongly Supported' },
  { value: 'main-point', label: 'Main Point' },
  { value: 'method-of-reasoning', label: 'Method of Reasoning' },
  { value: 'paradox', label: 'Resolve the Paradox' },
  { value: 'parallel-reasoning', label: 'Parallel Reasoning' },
  { value: 'parallel-flaw', label: 'Parallel Flaw' },
  { value: 'rc', label: 'Reading Comprehension' },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
] as const

export const SCORE_ESTIMATION: {
  minAccuracy: number
  maxAccuracy: number
  minScore: number
  maxScore: number
}[] = [
  { minAccuracy: 0,  maxAccuracy: 30,  minScore: 120, maxScore: 139 },
  { minAccuracy: 31, maxAccuracy: 45,  minScore: 140, maxScore: 149 },
  { minAccuracy: 46, maxAccuracy: 55,  minScore: 150, maxScore: 154 },
  { minAccuracy: 56, maxAccuracy: 65,  minScore: 155, maxScore: 159 },
  { minAccuracy: 66, maxAccuracy: 74,  minScore: 160, maxScore: 164 },
  { minAccuracy: 75, maxAccuracy: 82,  minScore: 165, maxScore: 169 },
  { minAccuracy: 83, maxAccuracy: 89,  minScore: 170, maxScore: 174 },
  { minAccuracy: 90, maxAccuracy: 100, minScore: 175, maxScore: 180 },
]

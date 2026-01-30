'use client'

import { motion } from 'framer-motion'

interface ReadinessScoreProps {
  score: {
    score: number
    sleepScore?: number
    fatigueScore?: number
    strainScore?: number
    date: string
  } | null
}

export function ReadinessScore({ score }: ReadinessScoreProps) {
  const readinessScore = score?.score ?? 0
  const color = readinessScore >= 80 ? 'green' : readinessScore >= 60 ? 'yellow' : 'red'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Readiness Score</h3>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={`text-${color}-500`}
              strokeDasharray={`${2 * Math.PI * 56}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - readinessScore / 100) }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{readinessScore}</span>
          </div>
        </div>
      </div>

      {score && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Sleep</span>
            <span className="font-medium">{score.sleepScore?.toFixed(0) ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fatigue</span>
            <span className="font-medium">{score.fatigueScore?.toFixed(0) ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Strain</span>
            <span className="font-medium">{score.strainScore?.toFixed(0) ?? 'N/A'}</span>
          </div>
        </div>
      )}

      {!score && (
        <p className="text-sm text-gray-500 text-center">
          No readiness data yet. Log your recovery metrics to get started.
        </p>
      )}
    </div>
  )
}

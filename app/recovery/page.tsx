'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { RecoveryForm } from '@/components/recovery/RecoveryForm'
import { ReadinessScore } from '@/components/dashboard/ReadinessScore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function RecoveryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [readinessScores, setReadinessScores] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchReadinessScores()
    }
  }, [user])

  const fetchReadinessScores = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/recovery/readiness?days=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setReadinessScores(data.scores || [])
    } catch (error) {
      console.error('Failed to fetch readiness scores:', error)
    }
  }

  const handleRecoverySubmit = () => {
    fetchReadinessScores()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Recovery & Readiness</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <RecoveryForm onSubmit={handleRecoverySubmit} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Readiness Scores</h2>
            <div className="space-y-4">
              {readinessScores.length === 0 ? (
                <p className="text-gray-500">No readiness scores yet. Log your recovery data to get started.</p>
              ) : (
                readinessScores.map((score) => (
                  <ReadinessScore key={score.id} score={score} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

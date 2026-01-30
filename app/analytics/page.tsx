'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ProgressChart } from '@/components/analytics/ProgressChart'
import { MuscleGroupHeatmap } from '@/components/analytics/MuscleGroupHeatmap'
import { WorkoutFrequency } from '@/components/analytics/WorkoutFrequency'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchProgress()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/analytics/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/analytics/progress?days=30`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Workout Frequency</h2>
            <WorkoutFrequency data={stats?.workoutFrequency} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Muscle Group Distribution</h2>
            <MuscleGroupHeatmap data={stats?.muscleGroups} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Over Time</h2>
          <ProgressChart data={progress?.progress} />
        </div>
      </main>
    </div>
  )
}

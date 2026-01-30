'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReadinessScore } from '@/components/dashboard/ReadinessScore'
import { RecentWorkouts } from '@/components/dashboard/RecentWorkouts'
import { QuickStats } from '@/components/dashboard/QuickStats'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [readinessScore, setReadinessScore] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchReadinessScore()
      fetchStats()
    }
  }, [user])

  const fetchReadinessScore = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/recovery/readiness?days=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.scores && data.scores.length > 0) {
        setReadinessScore(data.scores[0])
      }
    } catch (error) {
      console.error('Failed to fetch readiness score:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Pulsely AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/workout"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Workout
              </Link>
              <Link
                href="/analytics"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Analytics
              </Link>
              <Link
                href="/recovery"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Recovery
              </Link>
              <Link
                href="/coach"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                AI Coach
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  router.push('/login')
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.email}!
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Score */}
          <div className="lg:col-span-1">
            <ReadinessScore score={readinessScore} />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <QuickStats stats={stats} />
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="mt-8">
          <RecentWorkouts />
        </div>
      </main>
    </div>
  )
}

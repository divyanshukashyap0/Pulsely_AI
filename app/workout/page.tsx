'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PoseTracker } from '@/components/workout/PoseTracker'
import { WorkoutForm } from '@/components/workout/WorkoutForm'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export default function WorkoutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeWorkout, setActiveWorkout] = useState<any>(null)
  const [exerciseType, setExerciseType] = useState<string>('squat')
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const startWorkout = async (name: string, type: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, type }),
      })

      const data = await response.json()
      if (data.workout) {
        setActiveWorkout(data.workout)
      }
    } catch (error) {
      console.error('Failed to start workout:', error)
    }
  }

  const completeWorkout = async () => {
    if (!activeWorkout) return

    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/workouts/${activeWorkout.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      setActiveWorkout(null)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete workout:', error)
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
        {!activeWorkout ? (
          <WorkoutForm onStart={startWorkout} />
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {activeWorkout.name}
              </h2>
              
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setShowCamera(!showCamera)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {showCamera ? 'Hide' : 'Show'} Camera
                </button>
                <button
                  onClick={completeWorkout}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Workout
                </button>
              </div>

              {showCamera && (
                <div className="mt-6">
                  <PoseTracker
                    exerciseType={exerciseType}
                    onExerciseTypeChange={setExerciseType}
                    workoutId={activeWorkout.id}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

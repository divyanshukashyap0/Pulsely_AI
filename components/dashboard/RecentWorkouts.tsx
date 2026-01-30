'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function RecentWorkouts() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/workouts?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setWorkouts(data.workouts || [])
    } catch (error) {
      console.error('Failed to fetch workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading workouts...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Workouts</h3>
        <Link href="/workout" className="text-primary hover:underline text-sm">
          View All
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No workouts yet. Start your first workout!
        </p>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{workout.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(workout.startedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  {workout.duration && (
                    <p className="text-sm text-gray-500 mt-1">
                      Duration: {workout.duration} minutes
                    </p>
                  )}
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {workout.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

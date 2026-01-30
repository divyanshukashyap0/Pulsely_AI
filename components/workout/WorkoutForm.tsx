'use client'

import { useState } from 'react'

interface WorkoutFormProps {
  onStart: (name: string, type: string) => void
}

export function WorkoutForm({ onStart }: WorkoutFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('strength')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onStart(name, type)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Workout</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Workout Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Upper Body, Leg Day"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Workout Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="flexibility">Flexibility</option>
            <option value="hiit">HIIT</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workout
        </button>
      </form>
    </div>
  )
}

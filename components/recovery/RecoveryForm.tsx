'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RecoveryFormProps {
  onSubmit: () => void
}

export function RecoveryForm({ onSubmit }: RecoveryFormProps) {
  const [sleepHours, setSleepHours] = useState<number | ''>('')
  const [sleepQuality, setSleepQuality] = useState<number | ''>('')
  const [fatigueLevel, setFatigueLevel] = useState<number | ''>('')
  const [stressLevel, setStressLevel] = useState<number | ''>('')
  const [soreness, setSoreness] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/recovery/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sleepHours: sleepHours ? Number(sleepHours) : undefined,
          sleepQuality: sleepQuality ? Number(sleepQuality) : undefined,
          fatigueLevel: fatigueLevel ? Number(fatigueLevel) : undefined,
          stressLevel: stressLevel ? Number(stressLevel) : undefined,
          soreness: soreness ? Number(soreness) : undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save recovery data')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSubmit()
        // Reset form
        setSleepHours('')
        setSleepQuality('')
        setFatigueLevel('')
        setStressLevel('')
        setSoreness('')
        setNotes('')
      }, 2000)
    } catch (error) {
      console.error('Failed to save recovery data:', error)
      alert('Failed to save recovery data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Log Recovery Data</h2>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Recovery data saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sleepHours" className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Hours
          </label>
          <input
            id="sleepHours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="sleepQuality" className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Quality (1-10)
          </label>
          <input
            id="sleepQuality"
            type="number"
            min="1"
            max="10"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="fatigueLevel" className="block text-sm font-medium text-gray-700 mb-2">
            Fatigue Level (1-10)
          </label>
          <input
            id="fatigueLevel"
            type="number"
            min="1"
            max="10"
            value={fatigueLevel}
            onChange={(e) => setFatigueLevel(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="stressLevel" className="block text-sm font-medium text-gray-700 mb-2">
            Stress Level (1-10)
          </label>
          <input
            id="stressLevel"
            type="number"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="soreness" className="block text-sm font-medium text-gray-700 mb-2">
            Muscle Soreness (1-10)
          </label>
          <input
            id="soreness"
            type="number"
            min="1"
            max="10"
            value={soreness}
            onChange={(e) => setSoreness(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Recovery Data'}
        </button>
      </form>
    </div>
  )
}

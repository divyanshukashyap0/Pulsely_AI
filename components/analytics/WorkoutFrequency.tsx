'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface WorkoutFrequencyProps {
  data: Array<{ date: string; count: number }> | undefined
}

export function WorkoutFrequency({ data }: WorkoutFrequencyProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No workout frequency data available
      </div>
    )
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    count: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProgressChartProps {
  data: Array<{
    date: string
    volume: number
    maxWeight: number
    totalReps: number
  }> | undefined
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No progress data available
      </div>
    )
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: Math.round(item.volume),
    maxWeight: item.maxWeight,
    totalReps: item.totalReps,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="volume"
          stroke="#3b82f6"
          name="Volume (kg)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="maxWeight"
          stroke="#10b981"
          name="Max Weight (kg)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

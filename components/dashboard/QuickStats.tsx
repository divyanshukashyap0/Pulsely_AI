'use client'

interface QuickStatsProps {
  stats: {
    totalWorkouts?: number
    totalVolume?: number
    workoutFrequency?: Array<{ date: string; count: number }>
  } | null
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Workouts</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalWorkouts ?? 0}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Volume (kg)</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.totalVolume ? Math.round(stats.totalVolume) : 0}
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

interface MuscleGroupHeatmapProps {
  data: Record<string, number> | undefined
}

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Abs'
]

export function MuscleGroupHeatmap({ data }: MuscleGroupHeatmapProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No muscle group data available
      </div>
    )
  }

  // Normalize values for color intensity
  const maxValue = Math.max(...Object.values(data))
  const normalizedData = Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = (value / maxValue) * 100
    return acc
  }, {} as Record<string, number>)

  const getColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-blue-600'
    if (intensity >= 60) return 'bg-blue-500'
    if (intensity >= 40) return 'bg-blue-400'
    if (intensity >= 20) return 'bg-blue-300'
    return 'bg-blue-200'
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {muscleGroups.map((group) => {
        const intensity = normalizedData[group] || 0
        const count = data[group] || 0
        return (
          <div
            key={group}
            className={`${getColor(intensity)} rounded-lg p-4 text-white text-center transition-transform hover:scale-105`}
          >
            <p className="font-medium">{group}</p>
            <p className="text-sm opacity-90">{count} workouts</p>
          </div>
        )
      })}
    </div>
  )
}

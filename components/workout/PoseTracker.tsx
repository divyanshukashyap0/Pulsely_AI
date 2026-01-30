'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface PoseTrackerProps {
  exerciseType: string
  onExerciseTypeChange: (type: string) => void
  workoutId: string
}

export function PoseTracker({ exerciseType, onExerciseTypeChange, workoutId }: PoseTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [poseScore, setPoseScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
    }
  }

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8)

    try {
      // Send to AI service for pose analysis
      const response = await fetch(`${AI_SERVICE_URL}/analyze-pose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          exercise_type: exerciseType,
        }),
      })

      const data = await response.json()

      if (data.rep_count !== undefined) {
        setRepCount(data.rep_count)
      }
      if (data.pose_score !== undefined) {
        setPoseScore(data.pose_score)
      }
      if (data.feedback) {
        setFeedback(data.feedback)
      }
    } catch (error) {
      console.error('Error analyzing pose:', error)
    }
  }, [exerciseType])

  const startTracking = () => {
    setIsRecording(true)
    // Capture frame every 500ms
    frameIntervalRef.current = setInterval(captureFrame, 500)
  }

  const stopTracking = () => {
    setIsRecording(false)
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
  }

  const saveSet = async () => {
    if (repCount === 0) return

    try {
      const token = localStorage.getItem('token')
      // First, we need to get or create a workout exercise
      // For simplicity, we'll create a placeholder exercise
      // In production, you'd select an exercise from a list

      // Save the set with rep count and pose score
      await fetch(`${API_URL}/api/workouts/sets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutExerciseId: workoutId, // This should be the workout exercise ID
          setNumber: 1,
          reps: repCount,
          poseScore: poseScore || undefined,
          repCount: repCount,
        }),
      })

      // Reset counter
      setRepCount(0)
      setPoseScore(null)
      setFeedback('')
    } catch (error) {
      console.error('Failed to save set:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Exercise Type:</label>
        <select
          value={exerciseType}
          onChange={(e) => onExerciseTypeChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="squat">Squat</option>
          <option value="pushup">Push-up</option>
          <option value="bicep_curl">Bicep Curl</option>
        </select>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={isRecording ? stopTracking : startTracking}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isRecording ? 'Stop Tracking' : 'Start Tracking'}
        </button>

        <button
          onClick={saveSet}
          disabled={repCount === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Set ({repCount} reps)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Reps</p>
          <p className="text-3xl font-bold text-gray-900">{repCount}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Pose Score</p>
          <p className="text-3xl font-bold text-gray-900">
            {poseScore !== null ? Math.round(poseScore) : '--'}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Feedback</p>
          <p className="text-sm font-medium text-gray-900">{feedback || 'No feedback yet'}</p>
        </div>
      </div>
    </div>
  )
}

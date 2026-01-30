"""
AI Service for Pulsely AI - Pose Detection and Exercise Tracking
Uses MediaPipe Pose for real-time exercise detection and rep counting
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, List, Dict
import json
import base64
from io import BytesIO
from PIL import Image

app = FastAPI(title="Pulsely AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    model_complexity=1
)

# Exercise detection state
class ExerciseDetector:
    """Detects exercises and counts reps using pose landmarks"""
    
    def __init__(self):
        self.rep_count = 0
        self.is_down = False
        self.previous_angle = None
        self.exercise_type = None
        
    def detect_squat(self, landmarks):
        """Detect squat movement using hip, knee, and ankle angles"""
        # Get key points
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
        left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
        left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
        
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
        right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE]
        right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE]
        
        # Calculate knee angles
        left_angle = self._calculate_angle(left_hip, left_knee, left_ankle)
        right_angle = self._calculate_angle(right_hip, right_knee, right_ankle)
        avg_angle = (left_angle + right_angle) / 2
        
        # Squat: angle decreases when going down, increases when going up
        if self.previous_angle is not None:
            if avg_angle < 120 and not self.is_down:  # Going down
                self.is_down = True
            elif avg_angle > 160 and self.is_down:  # Coming up
                self.rep_count += 1
                self.is_down = False
        
        self.previous_angle = avg_angle
        return avg_angle, "squat"
    
    def detect_pushup(self, landmarks):
        """Detect push-up movement using shoulder, elbow, and wrist positions"""
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
        left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
        left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
        
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]
        right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
        
        # Calculate elbow angles
        left_angle = self._calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_angle = self._calculate_angle(right_shoulder, right_elbow, right_wrist)
        avg_angle = (left_angle + right_angle) / 2
        
        # Push-up: angle increases when going down, decreases when going up
        if self.previous_angle is not None:
            if avg_angle > 160 and not self.is_down:  # Going down
                self.is_down = True
            elif avg_angle < 90 and self.is_down:  # Coming up
                self.rep_count += 1
                self.is_down = False
        
        self.previous_angle = avg_angle
        return avg_angle, "pushup"
    
    def detect_bicep_curl(self, landmarks):
        """Detect bicep curl using elbow and wrist positions"""
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
        left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
        left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
        
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]
        right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
        
        # Calculate elbow angles
        left_angle = self._calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_angle = self._calculate_angle(right_shoulder, right_elbow, right_wrist)
        avg_angle = (left_angle + right_angle) / 2
        
        # Bicep curl: angle decreases when curling up, increases when extending
        if self.previous_angle is not None:
            if avg_angle < 60 and not self.is_down:  # Curling up
                self.is_down = True
            elif avg_angle > 160 and self.is_down:  # Extending down
                self.rep_count += 1
                self.is_down = False
        
        self.previous_angle = avg_angle
        return avg_angle, "bicep_curl"
    
    def _calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points"""
        a = np.array([point1.x, point1.y])
        b = np.array([point2.x, point2.y])
        c = np.array([point3.x, point3.y])
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
        
        return angle
    
    def reset(self):
        """Reset detector state"""
        self.rep_count = 0
        self.is_down = False
        self.previous_angle = None

detector = ExerciseDetector()

# Request/Response models
class PoseAnalysisRequest(BaseModel):
    image: str  # Base64 encoded image
    exercise_type: Optional[str] = None  # squat, pushup, bicep_curl, etc.

class PoseAnalysisResponse(BaseModel):
    rep_count: int
    pose_score: float  # 0-100, posture quality score
    landmarks: Optional[List[Dict]] = None
    feedback: Optional[str] = None
    exercise_detected: Optional[str] = None

class PostureFeedback(BaseModel):
    score: float
    feedback: str
    issues: List[str]

def analyze_posture(landmarks) -> PostureFeedback:
    """
    Analyze posture quality and provide feedback
    Returns score 0-100 and feedback messages
    """
    issues = []
    score = 100.0
    
    # Check spine alignment (shoulders and hips should be level)
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
    
    shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
    hip_diff = abs(left_hip.y - right_hip.y)
    
    if shoulder_diff > 0.05:
        issues.append("Shoulders are not level")
        score -= 15
    if hip_diff > 0.05:
        issues.append("Hips are not level")
        score -= 15
    
    # Check if person is visible
    visibility_threshold = 0.5
    key_points = [
        mp_pose.PoseLandmark.LEFT_SHOULDER,
        mp_pose.PoseLandmark.RIGHT_SHOULDER,
        mp_pose.PoseLandmark.LEFT_HIP,
        mp_pose.PoseLandmark.RIGHT_HIP,
    ]
    
    avg_visibility = sum(landmarks[i].visibility for i in key_points) / len(key_points)
    if avg_visibility < visibility_threshold:
        issues.append("Body not fully visible in frame")
        score -= 30
    
    score = max(0, min(100, score))
    
    feedback = "Good form!" if score >= 80 else "Focus on form" if score >= 60 else "Adjust your posture"
    
    return PostureFeedback(score=score, feedback=feedback, issues=issues)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "pose-detection"}

@app.post("/analyze-pose", response_model=PoseAnalysisResponse)
async def analyze_pose(request: PoseAnalysisRequest):
    """
    Analyze pose from image and detect exercise/rep count
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image.split(',')[1] if ',' in request.image else request.image)
        image = Image.open(BytesIO(image_data))
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Process with MediaPipe
        results = pose.process(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))
        
        if not results.pose_landmarks:
            raise HTTPException(status_code=400, detail="No pose detected in image")
        
        # Analyze posture
        posture = analyze_posture(results.pose_landmarks.landmark)
        
        # Detect exercise and count reps
        exercise_type = request.exercise_type or "squat"  # Default to squat
        angle = 0
        detected_exercise = None
        
        if exercise_type == "squat":
            angle, detected_exercise = detector.detect_squat(results.pose_landmarks.landmark)
        elif exercise_type == "pushup":
            angle, detected_exercise = detector.detect_pushup(results.pose_landmarks.landmark)
        elif exercise_type == "bicep_curl":
            angle, detected_exercise = detector.detect_bicep_curl(results.pose_landmarks.landmark)
        
        # Convert landmarks to serializable format
        landmarks_data = [
            {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
            for lm in results.pose_landmarks.landmark
        ]
        
        return PoseAnalysisResponse(
            rep_count=detector.rep_count,
            pose_score=posture.score,
            landmarks=landmarks_data,
            feedback=posture.feedback,
            exercise_detected=detected_exercise
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/reset-detector")
async def reset_detector():
    """Reset exercise detector state"""
    detector.reset()
    return {"status": "reset", "rep_count": 0}

@app.get("/supported-exercises")
async def get_supported_exercises():
    """Get list of supported exercises for pose detection"""
    return {
        "exercises": [
            {"id": "squat", "name": "Squat", "description": "Lower body exercise"},
            {"id": "pushup", "name": "Push-up", "description": "Upper body exercise"},
            {"id": "bicep_curl", "name": "Bicep Curl", "description": "Arm exercise"},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface HandInputProps {
  onToggleState: () => void;
  onUpdateRotation: (rot: number) => void;
}

export const HandInput: React.FC<HandInputProps> = ({ onToggleState, onUpdateRotation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastPinchTime = useRef(0);
  const isPinching = useRef(false);
  const requestRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);

  const predictWebcam = useCallback(async () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    // Ensure video is ready
    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      try {
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // 1. Hand Rotation Control (Index finger tip X position)
          // landmarks[8] is Index Finger Tip
          const indexTip = landmarks[8];
          // Normalize: 0.5 is center. 
          // Map 0..1 to -2..2 rotation speed or absolute rotation
          const rot = (indexTip.x - 0.5) * 4; 
          onUpdateRotation(rot);

          // 2. Pinch Detection (Thumb Tip [4] vs Index Tip [8])
          const thumbTip = landmarks[4];
          const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
          
          // Threshold for pinch
          if (distance < 0.05) {
            if (!isPinching.current && (Date.now() - lastPinchTime.current > 1000)) {
              // Trigger toggle
              onToggleState();
              lastPinchTime.current = Date.now();
              isPinching.current = true;
            }
          } else {
            isPinching.current = false;
          }
        }
      } catch (e) {
        console.warn("Landmark detection error:", e);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [onToggleState, onUpdateRotation]);

  const startWebcam = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240,
            frameRate: { ideal: 30 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             predictWebcam();
          };
        }
      } catch (e) {
        console.error("Camera permission denied or error:", e);
        setError("Camera Access Denied");
      }
    } else {
        setError("Webcam Not Supported");
    }
  }, [predictWebcam]);

  useEffect(() => {
    let active = true;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!active) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (active) {
            startWebcam();
        }
      } catch (e) {
        console.warn("MediaPipe failed to load, falling back to mouse interaction", e);
        if (active) setError("Gesture Init Failed");
      }
    };

    initMediaPipe();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startWebcam]);

  if (error) {
    return (
        <div className="video-feed flex items-center justify-center bg-red-900/20 border-red-500/50">
            <span className="text-[10px] text-red-300 font-sans text-center px-2">{error}</span>
        </div>
    );
  }

  return (
    <video 
      ref={videoRef} 
      className="video-feed"
      autoPlay 
      playsInline 
      muted
    />
  );
};
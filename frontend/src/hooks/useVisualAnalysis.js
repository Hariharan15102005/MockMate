import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initializeFaceLandmarker,
  analyzeVideoFrame,
  VisualSessionAggregator
} from '../utils/visualAnalysisEngine';

/**
 * Custom hook for real-time camera visual analysis during the interview session.
 * 
 * Runs low-frequency (approx 1.25 FPS / 800ms) on-device frame analysis.
 * Non-blocking, smooth preview, cleans up on unmount or interview completion.
 */
export const useVisualAnalysis = ({ videoRef, isActive = true, sessionId = null }) => {
  const [currentObservation, setCurrentObservation] = useState({
    status: 'INITIALIZING',
    faceDetected: false,
    faceCount: 0,
    headOrientation: 'UNAVAILABLE',
    upperBodyVisible: false,
    framingStatus: 'UNABLE_TO_ASSESS',
    framingFeedback: 'Initializing visual analysis...',
    lightingStatus: 'UNABLE_TO_ASSESS',
    lightingLuminance: 0,
    confidence: 0,
    lastTimestamp: null
  });

  const [isModelReady, setIsModelReady] = useState(false);
  const aggregatorRef = useRef(new VisualSessionAggregator());
  const isProcessingRef = useRef(false);
  const timerRef = useRef(null);

  // Initialize model on mount
  useEffect(() => {
    let mounted = true;
    initializeFaceLandmarker()
      .then((instance) => {
        if (mounted) {
          setIsModelReady(true);
        }
      })
      .catch((err) => {
        console.warn('Visual analysis model load notice:', err);
        if (mounted) {
          setIsModelReady(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Frame analysis loop
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const processSample = async () => {
      if (isProcessingRef.current || !videoRef?.current) {
        return;
      }

      const video = videoRef.current;
      if (video.paused || video.ended || video.readyState < 2) {
        return;
      }

      isProcessingRef.current = true;
      try {
        const result = await analyzeVideoFrame(video, Date.now());
        if (result) {
          aggregatorRef.current.recordSample(result);
          setCurrentObservation({
            ...result,
            lastTimestamp: Date.now()
          });
        }
      } catch (err) {
        console.warn('Frame analysis cycle notice:', err);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Low-frequency sampling interval: every 800ms (1.25 FPS) for smooth UI & zero CPU overload
    timerRef.current = setInterval(processSample, 800);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, videoRef]);

  // Retrieve final summary for session report
  const getFinalSummary = useCallback(() => {
    return aggregatorRef.current.generateSummary();
  }, []);

  // Reset metrics if needed
  const resetAnalysis = useCallback(() => {
    aggregatorRef.current.reset();
    setCurrentObservation({
      status: 'INITIALIZING',
      faceDetected: false,
      faceCount: 0,
      headOrientation: 'UNAVAILABLE',
      upperBodyVisible: false,
      framingStatus: 'UNABLE_TO_ASSESS',
      framingFeedback: 'Initializing visual analysis...',
      lightingStatus: 'UNABLE_TO_ASSESS',
      lightingLuminance: 0,
      confidence: 0,
      lastTimestamp: null
    });
  }, []);

  return {
    currentObservation,
    isModelReady,
    getFinalSummary,
    resetAnalysis
  };
};

export default useVisualAnalysis;

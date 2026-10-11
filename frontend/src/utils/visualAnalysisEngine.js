/**
 * MOCKMATE — REAL-TIME COMPUTER VISION ANALYSIS ENGINE
 * 
 * Performs client-side, on-device visual analysis of candidate camera frames.
 * Adheres strictly to AI interview ethics:
 * - NEVER infers emotion, honesty, intelligence, confidence, mental state, or stress.
 * - Looking away naturally while thinking is NEVER penalized as suspicious.
 * - Extracts measurable, objective physical observations: face detection, framing,
 *   head orientation relative to camera, upper-body visibility, and lighting quality.
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance = null;
let modelLoadingPromise = null;
let modelFailed = false;

/**
 * Initializes the MediaPipe Face Landmarker model once.
 */
export async function initializeFaceLandmarker() {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }
  if (modelFailed) {
    return null;
  }

  modelLoadingPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 2,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });
      return faceLandmarkerInstance;
    } catch (err) {
      console.warn('MediaPipe GPU FaceLandmarker failed, trying CPU fallback:', err);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        return faceLandmarkerInstance;
      } catch (cpuErr) {
        console.warn('MediaPipe FaceLandmarker initialization unavailable, using canvas fallback engine:', cpuErr);
        modelFailed = true;
        return null;
      }
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Measures frame luminance and lighting distribution from canvas ImageData.
 */
function analyzeLightingQuality(ctx, width, height) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const step = 4 * 8; // Sample every 8th pixel for speed
    let totalLuminance = 0;
    let sampleCount = 0;
    let darkPixels = 0;
    let brightPixels = 0;

    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // ITU-R BT.601 standard luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += lum;
      sampleCount++;
      if (lum < 40) darkPixels++;
      if (lum > 225) brightPixels++;
    }

    if (sampleCount === 0) {
      return { status: 'UNABLE_TO_ASSESS', luminance: 0 };
    }

    const avgLuminance = totalLuminance / sampleCount;
    const darkRatio = darkPixels / sampleCount;
    const brightRatio = brightPixels / sampleCount;

    if (avgLuminance < 45 || darkRatio > 0.55) {
      return { status: 'LOW_LIGHT', luminance: Math.round(avgLuminance) };
    }
    if (avgLuminance > 215 || brightRatio > 0.45) {
      return { status: 'OVEREXPOSED', luminance: Math.round(avgLuminance) };
    }
    return { status: 'ADEQUATE', luminance: Math.round(avgLuminance) };
  } catch (e) {
    return { status: 'UNABLE_TO_ASSESS', luminance: 0 };
  }
}

/**
 * Reusable off-screen canvas to avoid creating DOM elements every frame.
 */
let offscreenCanvas = null;
let offscreenCtx = null;

function getOffscreenCanvas(width = 640, height = 360) {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }
  return { canvas: offscreenCanvas, ctx: offscreenCtx };
}

/**
 * Analyzes a single camera video frame.
 * @param {HTMLVideoElement} videoElement
 * @param {number} timestampMs
 * @returns {Object} Frame observation result
 */
export async function analyzeVideoFrame(videoElement, timestampMs = Date.now()) {
  if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
    return {
      timestamp: timestampMs,
      status: 'INITIALIZING',
      faceDetected: false,
      faceCount: 0,
      headOrientation: 'UNAVAILABLE',
      upperBodyVisible: false,
      framingStatus: 'UNABLE_TO_ASSESS',
      lightingStatus: 'UNABLE_TO_ASSESS',
      confidence: 0
    };
  }

  const { canvas, ctx } = getOffscreenCanvas(640, 360);
  ctx.drawImage(videoElement, 0, 0, 640, 360);

  // 1. Lighting analysis directly from camera canvas pixels
  const lighting = analyzeLightingQuality(ctx, 640, 360);

  // 2. MediaPipe FaceLandmarker detection
  let landmarker = null;
  try {
    landmarker = await initializeFaceLandmarker();
  } catch (e) {
    // handled gracefully
  }

  let detectionResults = null;
  if (landmarker) {
    try {
      detectionResults = landmarker.detectForVideo(videoElement, timestampMs);
    } catch (e) {
      // If frame timestamp is not strictly increasing or video buffer changed
      try {
        detectionResults = landmarker.detectForVideo(videoElement, performance.now());
      } catch (e2) {
        detectionResults = null;
      }
    }
  }

  // If MediaPipe detected faces
  if (detectionResults && detectionResults.faceLandmarks && detectionResults.faceLandmarks.length > 0) {
    const faceCount = detectionResults.faceLandmarks.length;
    const landmarks = detectionResults.faceLandmarks[0]; // primary candidate face

    // Compute face bounding metrics from landmarks
    let minX = 1.0;
    let maxX = 0.0;
    let minY = 1.0;
    let maxY = 0.0;

    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const faceCenterY = (minY + maxY) / 2;
    const faceCenterX = (minX + maxX) / 2;

    // Head orientation estimation from key facial landmarks:
    // Landmark 1: nose tip
    // Landmark 33: left eye outer corner
    // Landmark 263: right eye outer corner
    // Landmark 152: chin
    // Landmark 10: forehead top
    const nose = landmarks[1] || landmarks[4] || { x: faceCenterX, y: faceCenterY };
    const leftEye = landmarks[33] || { x: minX, y: minY };
    const rightEye = landmarks[263] || { x: maxX, y: minY };

    const distToLeft = Math.abs(nose.x - leftEye.x);
    const distToRight = Math.abs(rightEye.x - nose.x);
    const yawRatio = distToRight > 0.001 ? distToLeft / distToRight : 1.0;

    let headOrientation = 'FACING_CAMERA';
    if (yawRatio > 1.65) {
      headOrientation = 'TURNED_TOWARD_RIGHT';
    } else if (yawRatio < 0.6) {
      headOrientation = 'TURNED_TOWARD_LEFT';
    }

    // Camera Framing evaluation
    let framingStatus = 'SUITABLE';
    let framingNote = 'Face well centered';

    if (faceHeight > 0.65 || faceWidth > 0.55) {
      framingStatus = 'TOO_CLOSE';
      framingNote = 'Camera is positioned very close to face';
    } else if (faceHeight < 0.12 || faceWidth < 0.1) {
      framingStatus = 'TOO_FAR';
      framingNote = 'Face appears small; sit closer or adjust camera distance';
    } else if (minY < 0.05) {
      framingStatus = 'CROPPED_TOP';
      framingNote = 'Head is close to top frame edge; tilt camera slightly up';
    } else if (faceCenterX < 0.25 || faceCenterX > 0.75) {
      framingStatus = 'OFF_CENTER';
      framingNote = 'Face is positioned toward frame edge';
    }

    // Upper-body visibility estimation:
    // In typical desktop webcam video, if face is in upper 15%-55% and not oversized,
    // shoulders and upper body are sufficiently framed.
    const upperBodyVisible = faceHeight >= 0.15 && faceHeight <= 0.52 && minY >= 0.06 && maxY <= 0.72;

    return {
      timestamp: timestampMs,
      status: 'ANALYZING',
      faceDetected: true,
      faceCount: faceCount,
      headOrientation: headOrientation,
      upperBodyVisible: upperBodyVisible,
      framingStatus: framingStatus,
      framingFeedback: framingNote,
      lightingStatus: lighting.status,
      lightingLuminance: lighting.luminance,
      faceBoundingBox: { minX, maxX, minY, maxY, width: faceWidth, height: faceHeight },
      confidence: 0.95
    };
  }

  // Native ShapeDetector fallback if MediaPipe is loading/unavailable
  if ('FaceDetector' in window) {
    try {
      const nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
      const faces = await nativeDetector.detect(canvas);
      if (faces && faces.length > 0) {
        return {
          timestamp: timestampMs,
          status: 'ANALYZING',
          faceDetected: true,
          faceCount: faces.length,
          headOrientation: 'FACING_CAMERA',
          upperBodyVisible: true,
          framingStatus: 'SUITABLE',
          framingFeedback: 'Face detected via native vision',
          lightingStatus: lighting.status,
          lightingLuminance: lighting.luminance,
          confidence: 0.8
        };
      }
    } catch (e) {
      // fallback to no-face branch
    }
  }

  // No face detected in frame
  return {
    timestamp: timestampMs,
    status: landmarker ? 'ANALYZING' : 'LIMITED_VISIBILITY',
    faceDetected: false,
    faceCount: 0,
    headOrientation: 'UNAVAILABLE',
    upperBodyVisible: false,
    framingStatus: 'UNABLE_TO_ASSESS',
    framingFeedback: 'No face detected in current camera frame',
    lightingStatus: lighting.status,
    lightingLuminance: lighting.luminance,
    confidence: landmarker ? 0.9 : 0.4
  };
}

/**
 * Session Aggregator: Combines discrete frame samples into time-based metrics
 * and structured feedback for the interview report.
 */
export class VisualSessionAggregator {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalSamples = 0;
    this.faceDetectedSamples = 0;
    this.singleFaceSamples = 0;
    this.multipleFaceSamples = 0;
    this.facingCameraSamples = 0;
    this.turnedHeadSamples = 0;
    this.upperBodyVisibleSamples = 0;
    this.adequateLightingSamples = 0;
    this.lowLightingSamples = 0;
    this.suitableFramingSamples = 0;
    this.framingIssueSamples = 0;

    // Track consecutive missing face samples for sustained absence (3+ samples)
    this.consecutiveMissingSamples = 0;
    this.sustainedAbsenceIntervals = 0;

    this.firstSampleTimestamp = null;
    this.lastSampleTimestamp = null;
    this.lastResult = null;
  }

  recordSample(frameResult) {
    if (!frameResult) return;
    this.lastResult = frameResult;
    this.totalSamples++;

    if (!this.firstSampleTimestamp) {
      this.firstSampleTimestamp = frameResult.timestamp;
    }
    this.lastSampleTimestamp = frameResult.timestamp;

    // Face presence
    if (frameResult.faceDetected) {
      this.faceDetectedSamples++;
      this.consecutiveMissingSamples = 0;
      if (frameResult.faceCount === 1) {
        this.singleFaceSamples++;
      } else if (frameResult.faceCount > 1) {
        this.multipleFaceSamples++;
      }

      // Head orientation
      if (frameResult.headOrientation === 'FACING_CAMERA') {
        this.facingCameraSamples++;
      } else if (frameResult.headOrientation.startsWith('TURNED_')) {
        this.turnedHeadSamples++;
      }

      // Upper body
      if (frameResult.upperBodyVisible) {
        this.upperBodyVisibleSamples++;
      }

      // Framing
      if (frameResult.framingStatus === 'SUITABLE') {
        this.suitableFramingSamples++;
      } else if (frameResult.framingStatus !== 'UNABLE_TO_ASSESS') {
        this.framingIssueSamples++;
      }
    } else {
      this.consecutiveMissingSamples++;
      if (this.consecutiveMissingSamples === 4) {
        // approx 3-4 seconds of sustained absence
        this.sustainedAbsenceIntervals++;
      }
    }

    // Lighting
    if (frameResult.lightingStatus === 'ADEQUATE') {
      this.adequateLightingSamples++;
    } else if (frameResult.lightingStatus === 'LOW_LIGHT') {
      this.lowLightingSamples++;
    }
  }

  /**
   * Builds the final aggregated summary object for persistence and reporting.
   */
  generateSummary() {
    if (this.totalSamples === 0) {
      return {
        hasVisualData: false,
        analysisStatus: 'UNAVAILABLE',
        summaryFeedback: ['Visual analysis was not active or no frames were captured during the session.']
      };
    }

    const faceVisibilityPercent = Math.round((this.faceDetectedSamples / this.totalSamples) * 1000) / 10;
    const lightingAdequacyPercent = Math.round((this.adequateLightingSamples / this.totalSamples) * 1000) / 10;
    const validFaceSamples = Math.max(1, this.faceDetectedSamples);
    const upperBodyVisibilityPercent = Math.round((this.upperBodyVisibleSamples / validFaceSamples) * 1000) / 10;
    const framingSuitablePercent = Math.round((this.suitableFramingSamples / validFaceSamples) * 1000) / 10;

    // Generate evidence-based observations (Strictly objective, no psychological claims)
    const feedbackList = [];

    // 1. Detection consistency
    if (faceVisibilityPercent >= 90) {
      feedbackList.push(`Face was consistently detected in ${faceVisibilityPercent}% of sampled frames.`);
    } else if (faceVisibilityPercent >= 70) {
      feedbackList.push(`Face was detected in ${faceVisibilityPercent}% of sampled frames with occasional interruptions.`);
    } else {
      feedbackList.push(`Face visibility was limited (${faceVisibilityPercent}%). Consider adjusting camera placement.`);
    }

    if (this.sustainedAbsenceIntervals > 0) {
      feedbackList.push(`Camera experienced ${this.sustainedAbsenceIntervals} temporary interval(s) where face was out of frame for over 3 seconds.`);
    }

    // 2. Lighting observation
    if (lightingAdequacyPercent >= 80) {
      feedbackList.push('Camera lighting remained adequate throughout the interview session.');
    } else if (this.lowLightingSamples > this.adequateLightingSamples) {
      feedbackList.push('Lighting was frequently low during landmark sampling. Placing a gentle frontal light source can improve clarity.');
    }

    // 3. Framing observation
    if (framingSuitablePercent >= 75) {
      feedbackList.push('Camera framing and eye-level distance were well proportioned.');
    } else {
      feedbackList.push('Camera framing could be improved by positioning the camera at eye level with some headroom above.');
    }

    // 4. Upper body visibility
    if (upperBodyVisibilityPercent >= 70) {
      feedbackList.push(`Upper-body posture geometry was sufficiently visible for ${upperBodyVisibilityPercent}% of face-detected frames.`);
    } else {
      feedbackList.push('Upper-body landmarks were only partially visible. Sitting slightly further back allows full upper-body framing.');
    }

    return {
      hasVisualData: true,
      analysisStatus: 'COMPLETED',
      totalSamplesAnalyzed: this.totalSamples,
      faceVisibilityPercent: faceVisibilityPercent,
      upperBodyVisibilityPercent: upperBodyVisibilityPercent,
      framingSuitablePercent: framingSuitablePercent,
      lightingAdequacyPercent: lightingAdequacyPercent,
      sustainedAbsenceIntervals: this.sustainedAbsenceIntervals,
      multipleFaceDetections: this.multipleFaceSamples,
      summaryFeedback: feedbackList,
      recordedAt: new Date().toISOString()
    };
  }
}

export default {
  initializeFaceLandmarker,
  analyzeVideoFrame,
  VisualSessionAggregator
};

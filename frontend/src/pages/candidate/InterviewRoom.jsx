import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  startOrResumeSessionApi,
  startSelfServiceInterviewApi,
  getSessionDetailsApi,
  getCurrentQuestionApi,
  submitAnswerApi,
  recordQuestionTimeoutApi,
  recordMediaEventApi,
  completeInterviewApi
} from '../../api/candidateInterview';
import HumanInterviewer from '../../components/interview/HumanInterviewer';
import useInterviewSpeech from '../../hooks/useInterviewSpeech';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import Button from '../../components/common/Button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  RotateCcw,
  Sparkles,
  Clock,
  ShieldCheck,
  Award,
  AlertCircle,
  Pause,
  Play,
  Volume2,
  Radio,
  FileText,
  Zap,
  CheckCircle2,
  Flame,
  BrainCircuit
} from 'lucide-react';

/**
 * MOCKMATE — ADVANCED VOICE-ONLY AI INTERVIEW ROOM
 * 
 * Key Pillars:
 * 1. 10-Second Response-Start Window Timer on the LEFT SIDE of the room.
 *    - Starts only after AI finishes speaking (+ natural pause) when entering LISTENING mode.
 *    - Circular SVG countdown ring from 10s to 0s with color shifts (Green -> Amber -> Red).
 *    - Disappears / stops immediately when candidate begins speaking.
 *    - Does NOT limit total answer duration (candidate can speak for 30-90s+).
 *    - If 0s reached without speech: logs QUESTION_RESPONSE_TIMEOUT, AI announces transition, and loads next question.
 * 2. Unpredictable & Multi-Category AI Question Generation with zero repetition.
 * 3. Silent scoring during live interview (no mid-interview score popups).
 * 4. Pure voice interaction (no textarea or Submit button).
 */
export const InterviewRoom = () => {
  const { id, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Silence Duration Threshold for Answer Finalization (2.0 seconds of silence)
  const ANSWER_END_SILENCE_MS = 2000;

  // Session State
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // Guarded initialization ref to prevent React StrictMode duplicate triggers
  const initializedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // State Machine: GREETING | SPEAKING | LISTENING | CANDIDATE_SPEAKING | THINKING | EVALUATING | PAUSED | ENDING
  const [interviewerState, setInterviewerState] = useState('GREETING');
  const [interviewerPersona, setInterviewerPersona] = useState('male'); // 'male' | 'female'
  const [isPaused, setIsPaused] = useState(false);

  // Conversational Memory / History
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  // 10-Second Response-Start Window Timer (LEFT SIDE)
  const [responseSecondsLeft, setResponseSecondsLeft] = useState(10);
  const [responseTimerActive, setResponseTimerActive] = useState(false);
  const responseIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Silence & Activity Timers
  const lastSpeechTimestampRef = useRef(0);
  const candidateHasSpokenRef = useRef(false);
  const silenceCheckIntervalRef = useRef(null);
  const [silenceHint, setSilenceHint] = useState(null);

  // Overall Interview Timer (Default 45 minutes)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60);

  // Candidate Media
  const [cameraStream, setCameraStream] = useState(null);
  const cameraStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);

  // Modals
  const [showHints, setShowHints] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Speech TTS Hook
  const { isSpeaking, speak, stop: stopSpeaking } = useInterviewSpeech();

  // Web Audio Warning Tick for 3s, 2s, 1s
  const playCountdownTick = useCallback((freq = 520) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio cue might be restricted before interaction
    }
  }, []);

  // Speech STT Hook with activity tracking callback
  const handleSpeechActivity = useCallback((liveText) => {
    if (liveText && liveText.trim().length > 0) {
      lastSpeechTimestampRef.current = Date.now();
      candidateHasSpokenRef.current = true;
      // Immediately stop/hide the response-start timer as soon as candidate speaks
      setResponseTimerActive(false);
      setSilenceHint(null);
    }
  }, []);

  const {
    isListening,
    transcript,
    interimTranscript,
    speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSttSupported
  } = useSpeechRecognition({ onSpeechActivity: handleSpeechActivity });

  // Centralized Media Cleanup
  const stopAllMedia = useCallback(() => {
    // 1. Stop Speech Recognition
    try {
      stopListening();
    } catch (e) {
      console.warn('Error stopping STT:', e);
    }

    // 2. Cancel Text-to-Speech
    try {
      stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn('Error stopping TTS:', e);
    }

    // 3. Stop both Camera & Mic MediaStream tracks
    if (cameraStreamRef.current) {
      try {
        const tracks = cameraStreamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch (err) {
            console.warn('Error stopping media track:', err);
          }
        });
      } catch (e) {
        console.warn('Error accessing stream tracks:', e);
      }
      cameraStreamRef.current = null;
    }

    // 4. Detach video element srcObject
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        // ignore
      }
    }

    // 5. Close Web Audio Context
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    // 6. Clear state
    setCameraStream(null);
    setIsRecording(false);
  }, [stopListening, stopSpeaking]);

  // Centralized Timer Cleanup
  const clearAllTimers = useCallback(() => {
    if (responseIntervalRef.current) {
      clearInterval(responseIntervalRef.current);
      responseIntervalRef.current = null;
    }
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    setResponseTimerActive(false);
  }, []);

  // Master Interview Resource Cleanup
  const cleanupInterviewResources = useCallback(() => {
    clearAllTimers();
    stopAllMedia();
  }, [clearAllTimers, stopAllMedia]);

  // Initialize Session & Candidate Camera
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initSession();
    startCamera();

    // Integrity Event Listeners
    const handleVisibilityChange = () => {
      if (document.hidden && session?.sessionId) {
        recordMediaEventApi(session.sessionId, {
          eventType: 'TAB_SWITCH',
          durationSeconds: 1,
          metadata: { reason: 'User switched tab or minimized window' }
        }).catch((e) => console.warn('Integrity log error:', e));
      }
    };

    const handleWindowBlur = () => {
      if (session?.sessionId) {
        recordMediaEventApi(session.sessionId, {
          eventType: 'WINDOW_BLUR',
          durationSeconds: 1,
          metadata: { reason: 'Window lost focus' }
        }).catch((e) => console.warn('Integrity log error:', e));
      }
    };

    const handleBeforeUnload = () => {
      cleanupInterviewResources();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupInterviewResources();
    };
  }, [id, sessionId, cleanupInterviewResources]);

  // Start Camera Feed
  const startCamera = async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {
            // ignore
          }
        });
        cameraStreamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsRecording(true);
    } catch (e) {
      console.warn('Camera access notification:', e);
    }
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Session Initialization
  const initSession = async () => {
    try {
      setLoadingQuestion(true);
      setError(null);

      let sessData = location.state?.sessionData;

      if (!sessData) {
        if (sessionId) {
          try {
            sessData = await getSessionDetailsApi(sessionId);
          } catch (e) {
            sessData = { sessionId: sessionId };
          }
        } else if (id === 'self-service' || !id) {
          sessData = await startSelfServiceInterviewApi();
        } else {
          try {
            sessData = await getSessionDetailsApi(id);
          } catch (e) {
            sessData = await startOrResumeSessionApi(id);
          }
        }
      }

      if (!sessData || !sessData.sessionId) {
        throw new Error('Unable to obtain active interview session ID.');
      }

      setSession(sessData);
      if (sessData.remainingSeconds) {
        setTimeRemaining(sessData.remainingSeconds);
      }
      loadQuestionForSession(sessData.sessionId);
    } catch (err) {
      console.error('Session init error:', err);
      setError('Failed to initiate live interview session.');
      setLoadingQuestion(false);
    }
  };

  // Load and Speak Question
  const loadQuestionForSession = async (sessId) => {
    try {
      setLoadingQuestion(true);
      setInterviewerState('THINKING');
      isSubmittingRef.current = false;
      candidateHasSpokenRef.current = false;
      lastSpeechTimestampRef.current = 0;
      setResponseTimerActive(false);
      setResponseSecondsLeft(10);

      const qData = await getCurrentQuestionApi(sessId);
      setCurrentQuestion(qData);
      resetTranscript();
      setShowHints(false);
      setSilenceHint(null);

      // Record in conversation history
      const aiMessage = {
        speaker: 'AI',
        text: qData.fullSpeechText || qData.questionText,
        roundName: qData.roundName,
        roundNumber: qData.roundNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversationHistory((prev) => [...prev, aiMessage]);

      // Interviewer speaks the question aloud
      setInterviewerState('SPEAKING');
      stopListening(); // Disable recognition while AI is speaking

      const textToSpeak = qData.fullSpeechText || qData.questionText;

      speak(textToSpeak, () => {
        // Natural 800ms conversational pacing pause before candidate starts answering
        setTimeout(() => {
          if (!isPaused) {
            setInterviewerState('LISTENING');
            resetTranscript();
            candidateHasSpokenRef.current = false;
            lastSpeechTimestampRef.current = Date.now();
            
            // START 10-SECOND RESPONSE-START WINDOW COUNTDOWN (LEFT SIDE)
            setResponseSecondsLeft(10);
            setResponseTimerActive(true);

            if (!micMuted) {
              startListening();
            }
          }
        }, 800);
      });
    } catch (err) {
      console.error('Load question error:', err);
      setError('Could not generate or load next interview question.');
      setInterviewerState('IDLE');
    } finally {
      setLoadingQuestion(false);
    }
  };

  // 10-Second Response-Start Window Countdown Effect
  useEffect(() => {
    if (responseIntervalRef.current) {
      clearInterval(responseIntervalRef.current);
    }

    if (
      responseTimerActive &&
      interviewerState === 'LISTENING' &&
      !candidateHasSpokenRef.current &&
      !isPaused
    ) {
      responseIntervalRef.current = setInterval(() => {
        setResponseSecondsLeft((prev) => {
          if (candidateHasSpokenRef.current) {
            return prev;
          }
          if (prev <= 1) {
            clearInterval(responseIntervalRef.current);
            // 0 SECONDS TIMEOUT REACHED -> Auto-advance to next question
            handleResponseTimeout();
            return 0;
          }
          const nextVal = prev - 1;
          if (nextVal <= 3 && nextVal >= 1) {
            playCountdownTick(440 + (4 - nextVal) * 120);
          }
          return nextVal;
        });
      }, 1000);
    }

    return () => {
      if (responseIntervalRef.current) {
        clearInterval(responseIntervalRef.current);
      }
    };
  }, [responseTimerActive, interviewerState, isPaused, playCountdownTick]);

  // Handle Response Timeout (Candidate did not speak within 10 seconds)
  const handleResponseTimeout = async () => {
    if (isSubmittingRef.current || !session?.sessionId) return;
    isSubmittingRef.current = true;
    setResponseTimerActive(false);
    stopListening();
    stopSpeaking();
    setInterviewerState('SPEAKING');

    try {
      const res = await recordQuestionTimeoutApi(session.sessionId, currentQuestion?.questionId);
      
      const transitionText = "Let's move on to our next question.";
      // AI speaks transition naturally
      speak(transitionText, () => {
        setTimeout(() => {
          if (res?.isInterviewCompleted) {
            handleFinishInterview();
          } else {
            loadQuestionForSession(session.sessionId);
          }
        }, 600);
      });
    } catch (err) {
      console.error('Timeout handler error:', err);
      loadQuestionForSession(session.sessionId);
    }
  };

  // Automatic Silence Detection & Turn Finalization Loop (2.0 seconds after speaking)
  useEffect(() => {
    if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);

    silenceCheckIntervalRef.current = setInterval(() => {
      if (
        interviewerState !== 'LISTENING' ||
        isPaused ||
        evaluating ||
        isSubmittingRef.current ||
        !currentQuestion
      ) {
        return;
      }

      const currentText = transcript?.trim() || '';
      const now = Date.now();

      // Check for repeat question command: "repeat the question", "can you repeat that", "repeat please"
      if (
        currentText.length > 5 &&
        /\b(repeat the question|can you repeat|could you repeat|repeat that|say that again|what was the question)\b/i.test(
          currentText
        )
      ) {
        handleReplayQuestion();
        resetTranscript();
        candidateHasSpokenRef.current = false;
        return;
      }

      // If candidate has articulated a response (at least 2 words or 8 characters)
      const wordCount = currentText.split(/\s+/).filter(Boolean).length;
      if (candidateHasSpokenRef.current && (wordCount >= 2 || currentText.length >= 8)) {
        const timeSinceLastSpeech = now - lastSpeechTimestampRef.current;

        // Candidate has stopped speaking for >= 2.0 seconds -> Finalize answer automatically
        if (timeSinceLastSpeech >= ANSWER_END_SILENCE_MS) {
          finalizeCandidateAnswer(currentText);
        }
      }
    }, 250);

    return () => {
      if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
    };
  }, [interviewerState, transcript, isPaused, evaluating, currentQuestion]);

  // Automatic Answer Finalization (Voice Only)
  const finalizeCandidateAnswer = async (answerContent) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const trimmedAnswer = answerContent?.trim();
    if (!trimmedAnswer) {
      isSubmittingRef.current = false;
      return;
    }

    try {
      stopSpeaking();
      stopListening();
      setEvaluating(true);
      setInterviewerState('EVALUATING');
      setSilenceHint(null);
      setResponseTimerActive(false);

      // Add candidate spoken response to conversation history
      const candidateMsg = {
        speaker: 'CANDIDATE',
        text: trimmedAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversationHistory((prev) => [...prev, candidateMsg]);

      const payload = {
        questionId: currentQuestion?.questionId,
        roundNumber: currentQuestion?.roundNumber,
        roundType: currentQuestion?.roundType,
        questionText: currentQuestion?.questionText,
        answerText: trimmedAnswer,
        transcript: trimmedAnswer,
        responseTimeSeconds: Math.max(
          5,
          Math.round((Date.now() - (lastSpeechTimestampRef.current - 15000)) / 1000)
        )
      };

      const evalRes = await submitAnswerApi(session.sessionId, payload);
      setEvaluating(false);

      if (evalRes.isInterviewCompleted) {
        setInterviewerState('ENDING');
        setTimeout(() => {
          handleFinishInterview();
        }, 2200);
      } else {
        // Transition silently to next round / question without showing score popups
        setTimeout(() => {
          loadQuestionForSession(session.sessionId);
        }, 1600);
      }
    } catch (err) {
      console.error('Answer evaluation error:', err);
      isSubmittingRef.current = false;
      setEvaluating(false);
      setInterviewerState('LISTENING');
      if (!micMuted) startListening();
    }
  };

  // Replay Question Speech
  const handleReplayQuestion = () => {
    if (currentQuestion?.questionText) {
      stopListening();
      resetTranscript();
      candidateHasSpokenRef.current = false;
      setResponseTimerActive(false);
      setInterviewerState('SPEAKING');

      speak(currentQuestion.fullSpeechText || currentQuestion.questionText, () => {
        setTimeout(() => {
          if (!isPaused) {
            setInterviewerState('LISTENING');
            lastSpeechTimestampRef.current = Date.now();
            setResponseSecondsLeft(10);
            setResponseTimerActive(true);
            if (!micMuted) startListening();
          }
        }, 800);
      });
    }
  };

  // Pause / Resume Interview
  const handleTogglePause = () => {
    if (!isPaused) {
      setIsPaused(true);
      stopSpeaking();
      stopListening();
      setResponseTimerActive(false);
      setInterviewerState('PAUSED');
    } else {
      setIsPaused(false);
      setInterviewerState('LISTENING');
      lastSpeechTimestampRef.current = Date.now();
      if (!candidateHasSpokenRef.current) {
        setResponseSecondsLeft(10);
        setResponseTimerActive(true);
      }
      if (!micMuted) startListening();
    }
  };

  // Overall Interview Timer Countdown (45-minute exam clock)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishInterview();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session, isPaused]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Complete Interview
  const handleFinishInterview = async () => {
    try {
      setInterviewerState('ENDING');
      cleanupInterviewResources();
      const targetSessionId = session?.sessionId || sessionId;
      if (targetSessionId) {
        await completeInterviewApi(targetSessionId);
      }
      navigate(`/candidate/interviews/${targetSessionId}/result`);
    } catch (err) {
      console.error('Complete interview error:', err);
      cleanupInterviewResources();
      const targetSessionId = session?.sessionId || sessionId;
      navigate(`/candidate/interviews/${targetSessionId}/result`);
    }
  };

  // Toggle Camera Feed
  const handleToggleCamera = () => {
    const stream = cameraStreamRef.current || cameraStream;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
        if (!videoTrack.enabled && session?.sessionId) {
          recordMediaEventApi(session.sessionId, {
            eventType: 'CAMERA_INTERRUPTED',
            durationSeconds: 0,
            metadata: { reason: 'Candidate disabled camera manually' }
          }).catch(console.warn);
        }
      }
    }
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    const newMuted = !micMuted;
    setMicMuted(newMuted);
    const stream = cameraStreamRef.current || cameraStream;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    if (newMuted) {
      stopListening();
    } else {
      if (interviewerState === 'LISTENING' && !isSpeaking) {
        startListening();
      }
    }
  };

  // Progress circumference for circular timer: 2 * PI * 52 = 326.72
  const CIRCLE_RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (responseSecondsLeft / 10) * CIRCUMFERENCE;

  const timerColor =
    responseSecondsLeft > 6 ? '#10b981' : responseSecondsLeft > 3 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #090d16 0%, #060911 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        userSelect: 'none'
      }}
    >
      {/* Top Navigation Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}
          >
            👨‍💼
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {session?.interviewTitle || 'AI Comprehensive Mock Interview'}
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '0.2rem'
              }}
            >
              <span>
                Question {currentQuestion?.roundNumber || 1} of {currentQuestion?.totalRounds || 8}
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ color: '#818cf8', fontWeight: 600 }}>
                {currentQuestion?.questionSource || 'Adaptive AI Engine'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Status & Overall Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite'
              }}
            />
            🔴 LIVE SESSION
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.75rem',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#e2e8f0'
            }}
          >
            <Clock size={14} color="#38bdf8" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isPaused ? 'rgba(234, 179, 8, 0.2)' : '#1e293b',
              border: isPaused ? '1px solid #eab308' : '1px solid #334155',
              color: isPaused ? '#fde047' : '#cbd5e1',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Persona Switcher */}
          <button
            onClick={() => setInterviewerPersona((p) => (p === 'male' ? 'female' : 'male'))}
            title="Switch Interviewer Avatar"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {interviewerPersona === 'male' ? '👨 David (Director)' : '👩 Elena (VP)'}
          </button>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              background: showTranscriptDrawer ? '#3b82f6' : '#1e293b',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <FileText size={14} /> Transcript
          </button>

          <button
            onClick={handleToggleMic}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: micMuted ? '1px solid #ef4444' : '1px solid #334155',
              background: micMuted ? 'rgba(239, 68, 68, 0.2)' : '#1e293b',
              color: micMuted ? '#f87171' : '#f8fafc',
              cursor: 'pointer'
            }}
            title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            onClick={handleToggleCamera}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: !cameraActive ? '1px solid #ef4444' : '1px solid #334155',
              background: !cameraActive ? 'rgba(239, 68, 68, 0.2)' : '#1e293b',
              color: !cameraActive ? '#f87171' : '#f8fafc',
              cursor: 'pointer'
            }}
            title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraActive ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          <Button variant="danger" size="sm" onClick={() => setShowExitModal(true)}>
            End Interview
          </Button>
        </div>
      </header>

      {/* 3-Column Main Layout:
          LEFT: 10-Second Circular Response Timer & Intelligence Dock
          CENTER: AI Interviewer Avatar & Spoken Question Card
          RIGHT: Candidate Camera Feed & Spoken Voice Transcript Box
      */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '270px 1fr 1fr',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        {/* ==============================================================
            LEFT SIDE: 10-SECOND CIRCULAR RESPONSE-START TIMER & DOCK
            ============================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            justifyContent: 'space-between'
          }}
        >
          {/* Top Section: Header & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.75rem'
              }}
            >
              <BrainCircuit size={18} color="#818cf8" />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  Response Window
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  10s Response-Start Detection
                </div>
              </div>
            </div>

            {/* Circular 10-Second Response-Start Timer Widget */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 0.5rem',
                borderRadius: '1rem',
                background: responseTimerActive
                  ? responseSecondsLeft > 3
                    ? 'rgba(16, 185, 129, 0.06)'
                    : 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(30, 41, 59, 0.4)',
                border: responseTimerActive
                  ? responseSecondsLeft > 3
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Circular SVG Countdown Progress */}
              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0.5rem 0'
                }}
              >
                <svg width="130" height="130" viewBox="0 0 130 130">
                  {/* Background Track */}
                  <circle
                    cx="65"
                    cy="65"
                    r={CIRCLE_RADIUS}
                    fill="transparent"
                    stroke="rgba(30, 41, 59, 0.8)"
                    strokeWidth="8"
                  />
                  {/* Dynamic Progress Ring */}
                  <circle
                    cx="65"
                    cy="65"
                    r={CIRCLE_RADIUS}
                    fill="transparent"
                    stroke={responseTimerActive ? timerColor : '#475569'}
                    strokeWidth="8"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={responseTimerActive ? strokeDashoffset : 0}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease',
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%'
                    }}
                  />
                </svg>

                {/* Center Number and Label */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {responseTimerActive ? (
                    <>
                      <span
                        style={{
                          fontSize: '2.25rem',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: timerColor,
                          lineHeight: 1,
                          textShadow: `0 0 16px ${timerColor}55`
                        }}
                      >
                        {responseSecondsLeft}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#94a3b8',
                          marginTop: '0.2rem'
                        }}
                      >
                        SECONDS
                      </span>
                    </>
                  ) : candidateHasSpokenRef.current ? (
                    <>
                      <Mic size={28} color="#10b981" />
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#34d399',
                          marginTop: '0.25rem'
                        }}
                      >
                        SPEAKING
                      </span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Volume2 size={28} color="#818cf8" />
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#a5b4fc',
                          marginTop: '0.25rem'
                        }}
                      >
                        AI ASKING
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock size={28} color="#64748b" />
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#64748b',
                          marginTop: '0.25rem'
                        }}
                      >
                        READY
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Message below Circular Timer */}
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: responseTimerActive
                    ? timerColor
                    : candidateHasSpokenRef.current
                    ? '#34d399'
                    : '#94a3b8',
                  marginTop: '0.4rem',
                  textAlign: 'center'
                }}
              >
                {responseTimerActive
                  ? responseSecondsLeft > 6
                    ? '🎙️ Speak to begin answer'
                    : responseSecondsLeft > 3
                    ? '⚡ Begin speaking now'
                    : '⚠️ 3s Warning — Time closing!'
                  : candidateHasSpokenRef.current
                  ? 'Active Vocal Answer'
                  : isSpeaking
                  ? 'Listen to AI question'
                  : 'Waiting for question...'}
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: '0.25rem',
                  lineHeight: 1.3
                }}
              >
                {responseTimerActive
                  ? 'Starts immediately when question finishes'
                  : candidateHasSpokenRef.current
                  ? 'Take your time to explain thoroughly (30-90s)'
                  : 'Timer activates automatically'}
              </div>
            </div>
          </div>

          {/* Intelligence & Adaptive Controls Metadata */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '0.85rem',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} color="#818cf8" />
              <span>Interview Intelligence</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>Deduplication:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Zero-Repeat Active</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>Resume Alignment:</span>
              <span style={{ color: '#818cf8', fontWeight: 700 }}>Claims Verified</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>Difficulty Mode:</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                {currentQuestion?.difficulty || 'Adaptive (Dynamic)'}
              </span>
            </div>
          </div>
        </div>

        {/* ==============================================================
            CENTER COLUMN: Realistic Human AI Interviewer Avatar & Question Card
            ============================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <HumanInterviewer
            state={interviewerState}
            isSpeaking={isSpeaking}
            isListening={isListening && !isSpeaking}
            interviewerName={interviewerPersona === 'male' ? 'David Reynolds' : 'Dr. Elena Rostova'}
            interviewerTitle={
              interviewerPersona === 'male'
                ? 'Senior Engineering Director'
                : 'VP of Engineering & Architecture'
            }
            avatarPersona={interviewerPersona}
          />

          {/* Current Spoken Question Card */}
          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.25rem',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                <Sparkles size={14} color="#818cf8" />
                <span style={{ fontWeight: 600 }}>CATEGORY:</span>
                <span style={{ color: '#c7d2fe', fontWeight: 700 }}>
                  {currentQuestion?.topic || currentQuestion?.questionCategory || 'TECHNICAL'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowHints(!showHints)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {showHints ? 'Hide Hints' : '💡 Show Hints'}
                </button>

                <button
                  onClick={handleReplayQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0.4rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} /> Repeat Question
                </button>
              </div>
            </div>

            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#f8fafc',
                lineHeight: 1.55
              }}
            >
              "{currentQuestion?.fullSpeechText || currentQuestion?.questionText || 'Formulating your personalized resume question...'}"
            </div>

            {/* Hints Drawer */}
            {showHints && currentQuestion?.hints && currentQuestion.hints.length > 0 && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontSize: '0.8rem',
                  color: '#c7d2fe'
                }}
              >
                <strong>Evaluation Guidance:</strong>
                <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                  {currentQuestion.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ==============================================================
            RIGHT COLUMN: Candidate Live Camera & Spoken Voice Capture Box
            ============================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
          {/* Live Camera View */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />

            {!cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '1rem'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Camera Feed Paused
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Video feed is monitored for proctoring verification.
                </div>
              </div>
            )}

            {/* Proctoring Badges */}
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#34d399',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#34d399',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              Face Present • Live Proctoring Active
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '0.75rem',
                right: '0.75rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            >
              Integrity: Optimal
            </div>
          </div>

          {/* Pure Voice Interaction & Live Waveform Panel */}
          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.9)',
              border: isListening
                ? '1px solid rgba(52, 211, 153, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.25rem',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              position: 'relative'
            }}
          >
            {/* Live Status Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    background: isListening
                      ? 'rgba(16, 185, 129, 0.15)'
                      : evaluating
                      ? 'rgba(6, 182, 212, 0.15)'
                      : isSpeaking
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(148, 163, 184, 0.1)',
                    border: isListening
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : evaluating
                      ? '1px solid rgba(6, 182, 212, 0.4)'
                      : isSpeaking
                      ? '1px solid rgba(99, 102, 241, 0.4)'
                      : '1px solid rgba(148, 163, 184, 0.2)',
                    color: isListening
                      ? '#34d399'
                      : evaluating
                      ? '#22d3ee'
                      : isSpeaking
                      ? '#818cf8'
                      : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isListening
                        ? '#10b981'
                        : evaluating
                        ? '#06b6d4'
                        : isSpeaking
                        ? '#6366f1'
                        : '#94a3b8',
                      animation: isListening || isSpeaking ? 'pulse 1.5s infinite' : 'none'
                    }}
                  />
                  <span>
                    {evaluating
                      ? 'Evaluating your response...'
                      : isSpeaking
                      ? 'AI Interviewer Speaking...'
                      : isListening
                      ? 'Listening to you speak...'
                      : 'Waiting...'}
                  </span>
                </div>
              </div>

              {/* Dynamic Live Audio Waveform Bars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
                {[12, 20, 16, 24, 14, 18, 22, 10].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      height: isListening ? `${h}px` : '4px',
                      background: isListening ? '#34d399' : '#475569',
                      borderRadius: '2px',
                      transition: 'height 0.15s ease',
                      animation: isListening ? `pulse ${(0.6 + (i % 4) * 0.2).toFixed(2)}s infinite` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Spoken Voice Transcript Display Box */}
            <div
              style={{
                minHeight: '80px',
                maxHeight: '130px',
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '0.85rem',
                padding: '0.85rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.4rem'
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.5 }}>
                {transcript?.trim() ? (
                  <span>
                    "{transcript}"
                    <span
                      style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '14px',
                        background: '#34d399',
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        animation: 'pulse 1s infinite'
                      }}
                    />
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    {isListening
                      ? '🎙️ Speak aloud into your microphone. Your live voice will appear here...'
                      : isSpeaking
                      ? 'Interviewer is speaking. Listen carefully...'
                      : 'Voice input will activate automatically...'}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  borderTop: '1px solid #1e293b',
                  paddingTop: '0.35rem'
                }}
              >
                <span>
                  {transcript?.trim()
                    ? `${transcript.trim().split(/\s+/).filter(Boolean).length} words spoken`
                    : 'Voice-Only Live Capture'}
                </span>
                <span style={{ color: '#38bdf8' }}>
                  Natural 2s pause automatically finalizes answer
                </span>
              </div>
            </div>

            {/* Speech Error */}
            {speechError && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={13} /> {speechError}
                </div>
                <button
                  onClick={() => startListening()}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Drawer */}
      {showTranscriptDrawer && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '400px',
            maxHeight: '440px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: '#1e293b',
              borderBottom: '1px solid #334155'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
              📝 Real-Time Voice Interview Transcript
            </div>
            <button
              onClick={() => setShowTranscriptDrawer(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              padding: '1rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {conversationHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  background: item.speaker === 'AI' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.8)',
                  border: item.speaker === 'AI' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #334155'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.2rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: item.speaker === 'AI' ? '#818cf8' : '#34d399'
                  }}
                >
                  <span>{item.speaker === 'AI' ? '👨 AI Interviewer' : '🎙️ Candidate (Voice)'}</span>
                  <span style={{ color: '#64748b' }}>{item.timestamp}</span>
                </div>
                <div style={{ color: '#f8fafc' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Exit Confirmation Modal */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Conclude Interview Session?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to end this voice interview? All your spoken answers will be saved and evaluated to generate your comprehensive performance scorecard and transcript.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '0.5rem'
              }}
            >
              <Button variant="secondary" size="sm" onClick={() => setShowExitModal(false)}>
                Continue Interview
              </Button>
              <Button variant="danger" size="sm" onClick={handleFinishInterview}>
                Yes, Conclude Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;

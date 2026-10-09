import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for Speech-to-Text using Web Speech Recognition API
 * Provides real-time interim & final transcripts, silence detection timestamps,
 * and robust connection recovery.
 */
export function useSpeechRecognition({ onSpeechActivity } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const isMountedRef = useRef(true);
  const onSpeechActivityRef = useRef(onSpeechActivity);
  onSpeechActivityRef.current = onSpeechActivity;

  useEffect(() => {
    isMountedRef.current = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      if (!isMountedRef.current || !shouldListenRef.current) return;
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = (final + interim).trim();
      if (isMountedRef.current) {
        setInterimTranscript(interim.trim());
        if (final.trim()) {
          setFinalTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
        }
        setTranscript(combined);
      }

      if (onSpeechActivityRef.current && combined.length > 0) {
        onSpeechActivityRef.current(combined);
      }
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechError('Microphone access was denied. Please allow microphone permissions.');
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error === 'network') {
        setSpeechError('Speech recognition network error. Please check your connection.');
      } else if (event.error !== 'no-speech') {
        setSpeechError(`Speech recognition notice: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      // Auto-restart only if active and listening requested
      if (shouldListenRef.current && !speechError) {
        try {
          recognition.start();
        } catch (e) {
          if (isMountedRef.current) setIsListening(false);
        }
      } else {
        if (isMountedRef.current) setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isMountedRef.current = false;
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onstart = null;
          if (typeof recognitionRef.current.abort === 'function') {
            recognitionRef.current.abort();
          } else if (typeof recognitionRef.current.stop === 'function') {
            recognitionRef.current.stop();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || !isMountedRef.current) return;
    shouldListenRef.current = true;
    setSpeechError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.warn('Recognition start error:', e);
      }
      if (isMountedRef.current) setIsListening(true);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (isMountedRef.current) {
      setIsListening(false);
    }
    if (recognitionRef.current) {
      try {
        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    if (isMountedRef.current) {
      setTranscript('');
      setInterimTranscript('');
      setFinalTranscript('');
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    setTranscript,
    isSupported,
    speechError,
    startListening,
    stopListening,
    resetTranscript
  };
}

export default useSpeechRecognition;


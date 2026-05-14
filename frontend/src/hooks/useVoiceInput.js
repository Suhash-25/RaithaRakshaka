import { useState, useRef, useCallback, useEffect } from 'react';

export default function useVoiceInput(language = 'en', onResult) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const shouldListenRef = useRef(false);

  // Keep the latest callback
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const SpeechRecognition = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const canUseVoice = Boolean(SpeechRecognition);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    try {
      const recognition = new SpeechRecognition();
      
      const langMap = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN' };
      recognition.lang = langMap[language] || 'en-IN';
      
      // Real-time and continuous
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'network') {
          shouldListenRef.current = false;
          setVoiceError('Voice input requires an internet connection.');
          setIsListening(false);
          return;
        }
        if (event.error === 'no-speech') {
          // Ignore timeouts, onend will auto-restart
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenRef.current = false;
          setVoiceError(`Could not capture voice (${event.error}). Check permissions.`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          // Restart after a brief delay to avoid tight loops
          setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                startRecognition();
              } catch (e) {
                shouldListenRef.current = false;
                setIsListening(false);
              }
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };
      
      recognition.onresult = (event) => {
        let newFinal = '';
        let currentInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (onResultRef.current) {
          onResultRef.current(newFinal, currentInterim);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      shouldListenRef.current = false;
      setIsListening(false);
    }
  }, [language, SpeechRecognition]);

  const toggleListening = useCallback(() => {
    setVoiceError('');

    if (!canUseVoice) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    if (shouldListenRef.current) {
      // User requested stop
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      
      // Clear interim text on stop
      if (onResultRef.current) {
        onResultRef.current('', '');
      }
      return;
    }

    // User requested start
    shouldListenRef.current = true;
    startRecognition();
    setIsListening(true);
  }, [canUseVoice, startRecognition]);

  return {
    isListening,
    voiceError,
    canUseVoice,
    toggleListening
  };
}

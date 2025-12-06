import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleTTS, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/hooks/useGoogleTTS";

interface UseWebSpeechReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: (language?: string) => void;
  stopListening: () => void;
  speak: (text: string, language?: string, gender?: "female" | "male", onComplete?: () => void) => void;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
  voicesLoaded: boolean;
}

// Export supported languages for use in other components
export { SUPPORTED_LANGUAGES, type SupportedLanguage };

export const useWebSpeech = (): UseWebSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [userInteracted, setUserInteracted] = useState(false);
  const { toast } = useToast();
  
  // Use Google TTS for high-quality Indian voices
  const googleTTS = useGoogleTTS();

  // Check if Web Speech API is supported (for speech recognition)
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  // Speech Recognition
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recognition, setRecognition] = useState<any>(null);

  // Track user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        console.log("✅ User interaction detected - audio enabled");
        setUserInteracted(true);
      }
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [userInteracted]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    // Request microphone with noise cancellation
    const requestMicrophoneAccess = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
        });
      } catch (error) {
        console.error("Failed to request microphone with noise cancellation:", error);
      }
    };
    
    requestMicrophoneAccess();

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event: any) => {
      let combinedTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        combinedTranscript += event.results[i][0].transcript + ' ';
      }
      combinedTranscript = combinedTranscript.trim();
      if (combinedTranscript) {
        console.log("📝 Speech recognition transcript (lang: " + recog.lang + "):", combinedTranscript);
        setTranscript(combinedTranscript);
      }
    };

    recog.onerror = (event: any) => {
      console.log("Speech recognition error (silent):", event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);
  }, [isSupported]);

  const startListening = useCallback((language = 'en-IN') => {
    if (!recognition) {
      console.log("Speech recognition not available");
      return;
    }

    if (isListening) {
      console.log("Already listening, skipping restart");
      return;
    }

    // Always stop any ongoing speech before starting to listen
    if (googleTTS.isSpeaking) {
      console.log("Stopping Google TTS before starting to listen");
      googleTTS.stopSpeaking();
      setTimeout(() => {
        startRecognition(language);
      }, 300);
    } else {
      startRecognition(language);
    }
  }, [recognition, googleTTS.isSpeaking, isListening]);

  const startRecognition = (language: string) => {
    if (!recognition) return;
    
    if (isListening) {
      console.log("Recognition already active, skipping start");
      return;
    }
    
    try {
      recognition.abort();
    } catch {
      // Ignore errors when aborting
    }
    
    setTimeout(() => {
      if (isListening) {
        console.log("Already listening after delay, skipping start");
        return;
      }
      
      try {
        setTranscript("");
        
        const languageMap: Record<string, string> = {
          'english': 'en-IN',
          'hindi': 'hi-IN',
          'kannada': 'kn-IN',
          'tamil': 'ta-IN',
          'telugu': 'te-IN',
          'malayalam': 'ml-IN',
          'bengali': 'bn-IN',
          'marathi': 'mr-IN',
          'gujarati': 'gu-IN',
          'punjabi': 'pa-IN',
        };
        
        const langCode = languageMap[language.toLowerCase()] || language;
        recognition.lang = langCode;
        recognition.start();
        setIsListening(true);
        console.log("🎤 Started speech recognition with language:", langCode);
      } catch (error: any) {
        if (error?.message?.includes("already started")) {
          console.log("Recognition already started, setting isListening to true");
          setIsListening(true);
        } else {
          console.log("Speech recognition error:", error);
          setIsListening(false);
        }
      }
    }, 300);
  };

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore errors when stopping
      }
      setIsListening(false);
    }
  }, [recognition]);

  // Use Google TTS for speaking with Indian regional language support
  const speak = useCallback((
    text: string, 
    language = 'en-IN', 
    gender?: "female" | "male", 
    onComplete?: () => void
  ) => {
    console.log("📢 speak() called with Google TTS:", { textLength: text.length, language, gender });
    
    // Map language names to codes if needed
    const languageMap: Record<string, SupportedLanguage> = {
      'english': 'en-IN',
      'hindi': 'hi-IN',
      'kannada': 'kn-IN',
      'tamil': 'ta-IN',
      'telugu': 'te-IN',
      'malayalam': 'ml-IN',
      'bengali': 'bn-IN',
      'marathi': 'mr-IN',
      'gujarati': 'gu-IN',
      'punjabi': 'pa-IN',
    };
    
    const langCode = (languageMap[language.toLowerCase()] || language) as SupportedLanguage;
    
    // Use Google TTS
    googleTTS.speak(text, langCode, gender || "female", onComplete);
  }, [googleTTS]);

  const stopSpeaking = useCallback(() => {
    googleTTS.stopSpeaking();
  }, [googleTTS]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    isSpeaking: googleTTS.isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    isSupported,
    voicesLoaded: true, // Google TTS is always ready (no voice loading needed)
  };
};

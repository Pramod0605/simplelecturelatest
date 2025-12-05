import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
}

export const useWebSpeech = (): UseWebSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceFallbackShown, setVoiceFallbackShown] = useState(false);
  const { toast } = useToast();

  // Check if Web Speech API is supported
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  // Speech Recognition
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recognition, setRecognition] = useState<any>(null);

  // Load voices with voiceschanged event
  useEffect(() => {
    if (!speechSynthesisSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log("Loaded voices:", availableVoices.length, "voices");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechSynthesisSupported]);

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
      // Silent error handling - don't show popups for common errors including permission denied
      // Common error types: 'network', 'aborted', 'no-speech', 'not-allowed', 'audio-capture'
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);
  }, [isSupported, toast]);

  const startListening = useCallback((language = 'en-IN') => {
    if (!recognition) {
      console.log("Speech recognition not available");
      return;
    }

    // If already listening, don't restart
    if (isListening) {
      console.log("Already listening, skipping restart");
      return;
    }

    // Always stop any ongoing speech before starting to listen
    if (speechSynthesisSupported && window.speechSynthesis.speaking) {
      console.log("Stopping speech before starting to listen (interrupt)");
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      // Increased delay so browsers fully stop TTS before mic starts (500ms)
      setTimeout(() => {
        startRecognition(language);
      }, 500);
    } else {
      startRecognition(language);
    }
  }, [recognition, speechSynthesisSupported, isListening]);

  const startRecognition = (language: string) => {
    if (!recognition) return;
    
    // CRITICAL: Check if already listening to prevent "already started" error
    if (isListening) {
      console.log("Recognition already active, skipping start");
      return;
    }
    
    // CRITICAL: Stop any existing recognition first to avoid "already started" error
    try {
      recognition.abort();
    } catch {
      // Ignore errors when aborting
    }
    
    // Increased delay after abort to ensure clean state (300ms for stability)
    setTimeout(() => {
      // Triple-check we're not already listening before starting
      if (isListening) {
        console.log("Already listening after delay, skipping start");
        return;
      }
      
      try {
        setTranscript("");
        
        // Map common language names to codes if needed
        const languageMap: Record<string, string> = {
          'english': 'en-IN',
          'hindi': 'hi-IN',
          'kannada': 'kn-IN',
          'tamil': 'ta-IN',
          'telugu': 'te-IN',
          'malayalam': 'ml-IN'
        };
        
        const langCode = languageMap[language.toLowerCase()] || language;
        recognition.lang = langCode;
        recognition.start();
        setIsListening(true);
        console.log("🎤 Started speech recognition with language:", langCode);
      } catch (error: any) {
        // Handle "already started" error gracefully
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

  const speak = useCallback((text: string, language = 'en-IN', gender?: "female" | "male", onComplete?: () => void) => {
    if (!speechSynthesisSupported) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text: remove language tags, markdown, asterisks, quotes, and special characters
    let cleanText = text
      .replace(/\[LANG:\w{2}-IN\]\s*/g, '') // Remove language tags FIRST
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove asterisks
      .replace(/["""''`]/g, '') // Remove fancy quotes and backticks
      .replace(/[_~]/g, '') // Remove other markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/\n+/g, '. ') // Convert newlines to pauses
      .trim();

    // Don't speak if text is empty after cleaning
    if (!cleanText) {
      console.log("No text to speak after cleaning");
      return;
    }

    // Make speech more natural with pauses and rhythm
    cleanText = cleanText
      .replace(/\.\s+/g, '... ') // Add longer pause after periods
      .replace(/,\s+/g, ', ') // Add shorter pause after commas
      .replace(/([.!?])\s*([A-Z])/g, '$1... $2'); // Add pause between sentences

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Map common language names to codes if needed
    const languageMap: Record<string, string> = {
      'english': 'en-IN',
      'hindi': 'hi-IN',
      'kannada': 'kn-IN',
      'tamil': 'ta-IN',
      'telugu': 'te-IN',
      'malayalam': 'ml-IN'
    };
    
    const langCode = languageMap[language.toLowerCase()] || language;
    utterance.lang = langCode;
    
    // Add slight variation to rate for more natural sound (0.82-0.88)
    const rateVariation = 0.82 + (Math.random() * 0.06);
    utterance.rate = rateVariation;
    utterance.pitch = 1.1; // Slightly higher for younger sound
    utterance.volume = 1.0;

    // Preferred voice names for better quality
    const PREFERRED_FEMALE_VOICES = ['Aditi', 'Heera', 'Raveena', 'Priya', 'Female', 'Google', 'woman'];
    const PREFERRED_MALE_VOICES = ['Hemant', 'Ravi', 'Ajit', 'Male', 'Google', 'man'];

    // Find the best matching voice for the language and gender
    let matchingVoice: SpeechSynthesisVoice | null = null;
    let isFallback = false;
    const primaryLang = langCode.split('-')[0];
    
    // Step 1: Try exact locale match with gender preference
    if (gender) {
      const preferredNames = gender === "female" ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.replace('_', '-').toLowerCase();
        const voiceName = voice.name.toLowerCase();
        return voiceLang === langCode.toLowerCase() && 
               preferredNames.some(name => voiceName.includes(name.toLowerCase()));
      }) || null;
    }
    
    // Step 2: Try exact locale match without gender
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.replace('_', '-').toLowerCase() === langCode.toLowerCase()
      ) || null;
    }
    
    // Step 3: Try Indian variant of same language with gender preference
    if (!matchingVoice && gender) {
      const preferredNames = gender === "female" ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.toLowerCase();
        const voiceName = voice.name.toLowerCase();
        return voiceLang.startsWith(primaryLang) && voiceLang.includes('in') &&
               preferredNames.some(name => voiceName.includes(name.toLowerCase()));
      }) || null;
    }
    
    // Step 4: Try Indian variant of same language
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(primaryLang) && voice.lang.toLowerCase().includes('in')
      ) || null;
    }
    
    // Step 5: Try any voice of same language with gender
    if (!matchingVoice && gender) {
      const preferredNames = gender === "female" ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.toLowerCase();
        const voiceName = voice.name.toLowerCase();
        return voiceLang.startsWith(primaryLang) &&
               preferredNames.some(name => voiceName.includes(name.toLowerCase()));
      }) || null;
      if (matchingVoice) isFallback = true;
    }
    
    // Step 6: Try any voice of same language
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(primaryLang)
      ) || null;
      if (matchingVoice) isFallback = true;
    }
    
    // Step 7: Fallback to Hindi with gender
    if (!matchingVoice && gender) {
      const preferredNames = gender === "female" ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.toLowerCase();
        const voiceName = voice.name.toLowerCase();
        return voiceLang.startsWith('hi') && voiceLang.includes('in') &&
               preferredNames.some(name => voiceName.includes(name.toLowerCase()));
      }) || null;
      if (matchingVoice) isFallback = true;
    }
    
    // Step 8: Fallback to Hindi (most common Indian language voice)
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith('hi') && voice.lang.toLowerCase().includes('in')
      ) || null;
      if (matchingVoice) isFallback = true;
    }
    
    // Step 9: Fallback to Indian English
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.toLowerCase();
        return voiceLang === 'en-in' || voiceLang === 'en_in';
      }) || null;
      if (matchingVoice) isFallback = true;
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      console.log(`Using voice: ${matchingVoice.name} (${matchingVoice.lang}) for ${langCode}${isFallback ? ' [FALLBACK]' : ''}`);
      
      // Show fallback notification once
      if (isFallback && !voiceFallbackShown) {
        setVoiceFallbackShown(true);
        toast({
          title: "Voice Fallback",
          description: `Native ${langCode} voice unavailable. Using ${matchingVoice.lang} voice.`,
          duration: 3000,
        });
      }
    } else {
      console.warn("No voice available for:", langCode, "Using default voice");
      if (!voiceFallbackShown) {
        setVoiceFallbackShown(true);
        toast({
          title: "Voice Unavailable",
          description: "Using default browser voice.",
          duration: 3000,
        });
      }
    }

    utterance.onstart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
      if (onComplete) {
        onComplete();
      }
    };
    
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsSpeaking(false);
      // Don't show toast for 'interrupted' or 'canceled' errors
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        toast({
          title: "Speech Error",
          description: "Could not play audio. Please try again.",
          variant: "destructive",
        });
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error calling speechSynthesis.speak:", error);
      setIsSpeaking(false);
    }
  }, [speechSynthesisSupported, voices, voiceFallbackShown, toast]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesisSupported]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    isSupported,
  };
};

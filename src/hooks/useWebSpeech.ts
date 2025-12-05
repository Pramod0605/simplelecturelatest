import { useState, useEffect, useCallback, useRef } from "react";
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
  voicesLoaded: boolean;
}

export const useWebSpeech = (): UseWebSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [voiceFallbackShown, setVoiceFallbackShown] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const pendingSpeechRef = useRef<{ text: string; language: string; gender?: "female" | "male"; onComplete?: () => void } | null>(null);
  const { toast } = useToast();

  // Check if Web Speech API is supported
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  // Speech Recognition
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recognition, setRecognition] = useState<any>(null);

  // Track user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        console.log("✅ User interaction detected - audio enabled");
        setUserInteracted(true);
        
        // Try to "wake up" speech synthesis with a silent utterance
        if (speechSynthesisSupported) {
          const silentUtterance = new SpeechSynthesisUtterance("");
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
          window.speechSynthesis.cancel();
        }
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
  }, [userInteracted, speechSynthesisSupported]);

  // Load voices with voiceschanged event
  useEffect(() => {
    if (!speechSynthesisSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setVoicesLoaded(true);
        console.log("✅ Voices loaded:", availableVoices.length, "voices available");
        
        // Log available Indian voices
        const indianVoices = availableVoices.filter(v => 
          v.lang.toLowerCase().includes('in') || 
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('india')
        );
        console.log("🇮🇳 Indian voices:", indianVoices.map(v => `${v.name} (${v.lang})`));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Retry loading voices every 100ms for up to 5 seconds if not loaded
    let retryCount = 0;
    const maxRetries = 50;
    const retryInterval = setInterval(() => {
      if (voicesLoaded || retryCount >= maxRetries) {
        clearInterval(retryInterval);
        if (!voicesLoaded && retryCount >= maxRetries) {
          console.warn("⚠️ Voice loading timeout - using default voice");
          setVoicesLoaded(true); // Allow speaking with default voice
        }
        return;
      }
      loadVoices();
      retryCount++;
    }, 100);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(retryInterval);
    };
  }, [speechSynthesisSupported, voicesLoaded]);

  // Process pending speech when voices are loaded
  useEffect(() => {
    if (voicesLoaded && pendingSpeechRef.current && userInteracted) {
      console.log("🔊 Processing pending speech request");
      const { text, language, gender, onComplete } = pendingSpeechRef.current;
      pendingSpeechRef.current = null;
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        speakInternal(text, language, gender, onComplete);
      }, 100);
    }
  }, [voicesLoaded, userInteracted]);

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
  }, [isSupported, toast]);

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
    if (speechSynthesisSupported && window.speechSynthesis.speaking) {
      console.log("Stopping speech before starting to listen (interrupt)");
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      setTimeout(() => {
        startRecognition(language);
      }, 500);
    } else {
      startRecognition(language);
    }
  }, [recognition, speechSynthesisSupported, isListening]);

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
          'malayalam': 'ml-IN'
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

  const speakInternal = (text: string, language = 'en-IN', gender?: "female" | "male", onComplete?: () => void) => {
    if (!speechSynthesisSupported) {
      console.warn("Speech synthesis not supported");
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text
    let cleanText = text
      .replace(/\[LANG:\w{2}-IN\]\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/["""''`]/g, '')
      .replace(/[_~]/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) {
      console.log("No text to speak after cleaning");
      onComplete?.();
      return;
    }

    // Add pauses for natural speech
    cleanText = cleanText
      .replace(/\.\s+/g, '... ')
      .replace(/,\s+/g, ', ')
      .replace(/([.!?])\s*([A-Z])/g, '$1... $2');

    console.log("🔊 Speaking text:", cleanText.substring(0, 100) + "...");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
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
    
    // Fixed 80% speed as requested for clearer speech
    utterance.rate = 0.80;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    // Preferred voice names
    const PREFERRED_FEMALE_VOICES = ['Aditi', 'Heera', 'Raveena', 'Priya', 'Female', 'Google', 'woman'];
    const PREFERRED_MALE_VOICES = ['Hemant', 'Ravi', 'Ajit', 'Male', 'Google', 'man'];

    // Find matching voice
    let matchingVoice: SpeechSynthesisVoice | null = null;
    let isFallback = false;
    const primaryLang = langCode.split('-')[0];
    
    // Voice selection logic (simplified for reliability)
    if (gender) {
      const preferredNames = gender === "female" ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
      matchingVoice = voices.find(voice => {
        const voiceLang = voice.lang.replace('_', '-').toLowerCase();
        const voiceName = voice.name.toLowerCase();
        return voiceLang === langCode.toLowerCase() && 
               preferredNames.some(name => voiceName.includes(name.toLowerCase()));
      }) || null;
    }
    
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.replace('_', '-').toLowerCase() === langCode.toLowerCase()
      ) || null;
    }
    
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(primaryLang)
      ) || null;
      if (matchingVoice) isFallback = true;
    }
    
    // Fallback to any English voice
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith('en')
      ) || null;
      if (matchingVoice) isFallback = true;
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      console.log(`🗣️ Using voice: ${matchingVoice.name} (${matchingVoice.lang})${isFallback ? ' [FALLBACK]' : ''}`);
    } else {
      console.warn("⚠️ No voice found, using browser default");
    }

    utterance.onstart = () => {
      console.log("▶️ Speech started");
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log("⏹️ Speech ended");
      setIsSpeaking(false);
      onComplete?.();
    };
    
    utterance.onerror = (event) => {
      console.error("❌ Speech error:", event.error);
      setIsSpeaking(false);
      
      // Only show toast for actual errors, not interruptions
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        toast({
          title: "Voice Error",
          description: "Could not play audio. Try clicking anywhere first, then speak.",
          variant: "destructive",
        });
      }
      onComplete?.();
    };

    try {
      // Chrome fix: Resume if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      
      window.speechSynthesis.speak(utterance);
      console.log("✅ Speech synthesis speak() called");
      
      // Chrome bug workaround: speech synthesis can stop after ~15 seconds
      // Keep it alive with periodic resume calls
      const keepAliveInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAliveInterval);
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10000);
      
      utterance.onend = () => {
        clearInterval(keepAliveInterval);
        console.log("⏹️ Speech ended");
        setIsSpeaking(false);
        onComplete?.();
      };
      
    } catch (error) {
      console.error("Error calling speechSynthesis.speak:", error);
      setIsSpeaking(false);
      onComplete?.();
    }
  };

  const speak = useCallback((text: string, language = 'en-IN', gender?: "female" | "male", onComplete?: () => void) => {
    console.log("📢 speak() called:", { textLength: text.length, language, gender, voicesLoaded, userInteracted });
    
    if (!speechSynthesisSupported) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      onComplete?.();
      return;
    }

    // If voices not loaded yet, queue the speech
    if (!voicesLoaded) {
      console.log("⏳ Voices not loaded yet, queuing speech...");
      pendingSpeechRef.current = { text, language, gender, onComplete };
      return;
    }

    // If no user interaction yet, queue and show helpful message
    if (!userInteracted) {
      console.log("⚠️ No user interaction yet, queuing speech...");
      pendingSpeechRef.current = { text, language, gender, onComplete };
      toast({
        title: "Click to Enable Voice",
        description: "Click anywhere on the page to enable voice responses.",
        duration: 3000,
      });
      return;
    }

    speakInternal(text, language, gender, onComplete);
  }, [speechSynthesisSupported, voicesLoaded, userInteracted, voices, voiceFallbackShown, toast]);

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
    voicesLoaded,
  };
};

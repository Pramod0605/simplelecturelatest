import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Supported Indian languages with their display names
export const SUPPORTED_LANGUAGES = {
  'en-IN': { name: 'English (India)', flag: '🇬🇧', shortName: 'English' },
  'hi-IN': { name: 'Hindi', flag: '🇮🇳', shortName: 'हिंदी' },
  'ta-IN': { name: 'Tamil', flag: '🇮🇳', shortName: 'தமிழ்' },
  'te-IN': { name: 'Telugu', flag: '🇮🇳', shortName: 'తెలుగు' },
  'kn-IN': { name: 'Kannada', flag: '🇮🇳', shortName: 'ಕನ್ನಡ' },
  'ml-IN': { name: 'Malayalam', flag: '🇮🇳', shortName: 'മലയാളം' },
  'bn-IN': { name: 'Bengali', flag: '🇮🇳', shortName: 'বাংলা' },
  'mr-IN': { name: 'Marathi', flag: '🇮🇳', shortName: 'मराठी' },
  'gu-IN': { name: 'Gujarati', flag: '🇮🇳', shortName: 'ગુજરાતી' },
  'pa-IN': { name: 'Punjabi', flag: '🇮🇳', shortName: 'ਪੰਜਾਬੀ' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Global request queue to prevent rate limiting - serializes ALL TTS requests
let lastTTSRequestTime = 0;
const MIN_REQUEST_GAP = 10000; // 10 seconds minimum between TTS API calls (very aggressive for Sarvam rate limits)

// Global request queue - ensures only ONE request at a time across ALL components
let requestQueue: Promise<any> = Promise.resolve();
const queueTTSRequest = async <T>(fn: () => Promise<T>): Promise<T> => {
  // Chain this request to the end of the queue
  const result = requestQueue.then(async () => {
    // Enforce minimum gap
    const timeSinceLastRequest = Date.now() - lastTTSRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
      const waitTime = MIN_REQUEST_GAP - timeSinceLastRequest;
      console.log(`⏳ Queue: waiting ${waitTime}ms before TTS request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastTTSRequestTime = Date.now();
    return fn();
  });
  requestQueue = result.catch(() => {}); // Don't break queue on errors
  return result;
};

interface UseGoogleTTSReturn {
  speak: (text: string, languageCode?: SupportedLanguage, gender?: "female" | "male", onComplete?: () => void) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  // Pre-cache function for audio pre-generation
  precacheAudio: (text: string, languageCode?: SupportedLanguage, gender?: "female" | "male") => Promise<string[] | null>;
}

// Audio cache for pre-generated audio
const audioCache = new Map<string, { audioContents: string[]; mimeType: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export const useGoogleTTS = (): UseGoogleTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stoppedRef = useRef(false); // Track intentional stops
  const { toast } = useToast();

  const stopSpeaking = useCallback(() => {
    stoppedRef.current = true; // Mark as intentionally stopped
    // Stop OpenAI TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Helper function to split text into chunks under max length
  const splitTextIntoChunks = (text: string, maxLength: number = 3800): string[] => {
    if (text.length <= maxLength) return [text];
    
    const chunks: string[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      
      // Find a good break point (sentence end, comma, or space)
      let breakPoint = maxLength;
      
      // Try to find sentence end
      const sentenceEnd = remaining.lastIndexOf('. ', maxLength);
      if (sentenceEnd > maxLength * 0.5) {
        breakPoint = sentenceEnd + 1;
      } else {
        // Try comma
        const commaEnd = remaining.lastIndexOf(', ', maxLength);
        if (commaEnd > maxLength * 0.5) {
          breakPoint = commaEnd + 1;
        } else {
          // Try space
          const spaceEnd = remaining.lastIndexOf(' ', maxLength);
          if (spaceEnd > maxLength * 0.3) {
            breakPoint = spaceEnd;
          }
        }
      }
      
      chunks.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    }
    
    return chunks;
  };

  // Fallback to Web Speech API when OpenAI fails
  const speakWithWebSpeech = useCallback((text: string, onComplete?: () => void) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported');
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.65; // Much slower for student comprehension
    utterance.pitch = 1.0; // Normal pitch
    
    // Try to find an Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('en-IN')) || 
                        voices.find(v => v.lang.includes('en'));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      console.log('🔊 Web Speech: Started speaking');
      setIsSpeaking(true);
      setIsLoading(false);
    };

    utterance.onend = () => {
      console.log('⏹️ Web Speech: Finished speaking');
      setIsSpeaking(false);
      onComplete?.();
    };

    utterance.onerror = () => {
      console.error('❌ Web Speech: Error');
      setIsSpeaking(false);
      onComplete?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Clean text helper
  const cleanTextForTTS = (text: string): string => {
    return text
      .replace(/\[LANG:\w{2}-IN\]\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/["""''`]/g, '')
      .replace(/[_~]/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Generate cache key
  const getCacheKey = (text: string, lang: string, gender: string) => 
    `${lang}:${gender}:${text.substring(0, 100)}`;

  // Fetch audio from Sarvam with queue-based throttling (serializes ALL requests)
  const fetchAudioFromSarvam = async (
    chunk: string, 
    languageCode: SupportedLanguage, 
    gender: "female" | "male"
  ): Promise<{ audioContents: string[]; mimeType: string } | null> => {
    // Use global queue to serialize requests
    return queueTTSRequest(async () => {
      console.log(`🔄 Sarvam TTS request starting...`);
      try {
        const sarvamResponse = await supabase.functions.invoke('sarvam-tts', {
          body: { text: chunk, languageCode, gender },
        });

        if (!sarvamResponse.error && sarvamResponse.data?.audioContent) {
          let audioContents: string[];
          if (sarvamResponse.data.isChunked && Array.isArray(sarvamResponse.data.audioContent)) {
            audioContents = sarvamResponse.data.audioContent;
          } else {
            audioContents = [sarvamResponse.data.audioContent];
          }
          console.log(`✅ Sarvam TTS success (${audioContents.length} segments)`);
          return { audioContents, mimeType: 'audio/wav' };
        }
        console.warn('⚠️ Sarvam TTS failed:', sarvamResponse.error?.message || sarvamResponse.data?.error);
        return null;
      } catch (err) {
        console.warn('⚠️ Sarvam TTS error:', err);
        return null;
      }
    });
  };

  // Pre-cache audio for upcoming slides (background generation)
  const precacheAudio = useCallback(async (
    text: string,
    languageCode: SupportedLanguage = 'en-IN',
    gender: "female" | "male" = "male"
  ): Promise<string[] | null> => {
    const cleanText = cleanTextForTTS(text);
    if (!cleanText) return null;

    const cacheKey = getCacheKey(cleanText, languageCode, gender);
    
    // Check if already cached
    const cached = audioCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Audio already cached for: "${cleanText.substring(0, 30)}..."`);
      return cached.audioContents;
    }

    console.log(`🔄 Pre-caching audio for: "${cleanText.substring(0, 30)}..."`);
    
    const result = await fetchAudioFromSarvam(cleanText, languageCode, gender);
    if (result) {
      audioCache.set(cacheKey, {
        audioContents: result.audioContents,
        mimeType: result.mimeType,
        timestamp: Date.now()
      });
      return result.audioContents;
    }
    return null;
  }, []);

  const speak = useCallback(async (
    text: string,
    languageCode: SupportedLanguage = 'en-IN',
    gender: "female" | "male" = "female",
    onComplete?: () => void
  ) => {
    const cleanText = cleanTextForTTS(text);

    if (!cleanText) {
      console.log("No text to speak after cleaning");
      onComplete?.();
      return;
    }

    // Stop any currently playing audio
    stopSpeaking();

    // Check cache first
    const cacheKey = getCacheKey(cleanText, languageCode, gender);
    const cached = audioCache.get(cacheKey);
    
    // Split into chunks if text is too long
    const chunks = splitTextIntoChunks(cleanText, 3800);
    
    if (chunks.length > 1) {
      console.log(`🔊 TTS: Splitting text into ${chunks.length} chunks`);
    }

    setIsLoading(true);
    setError(null);
    stoppedRef.current = false; // Reset stopped flag

    try {
      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLastChunk = i === chunks.length - 1;
        
        console.log(`🔊 Sarvam TTS: Speaking chunk ${i + 1}/${chunks.length} in ${languageCode}, gender: ${gender}, length: ${chunk.length}`);

        // Check cache for this specific chunk
        const chunkCacheKey = getCacheKey(chunk, languageCode, gender);
        const cachedChunk = audioCache.get(chunkCacheKey);
        
        let audioContents: string[] = [];
        let mimeType = 'audio/wav';

        if (cachedChunk && Date.now() - cachedChunk.timestamp < CACHE_TTL) {
          console.log(`📦 Using cached audio for chunk ${i + 1}`);
          audioContents = cachedChunk.audioContents;
          mimeType = cachedChunk.mimeType;
        } else {
          // Fetch from Sarvam with throttling
          const result = await fetchAudioFromSarvam(chunk, languageCode, gender);
          if (result) {
            audioContents = result.audioContents;
            mimeType = result.mimeType;
            // Cache for future use
            audioCache.set(chunkCacheKey, { ...result, timestamp: Date.now() });
          }
        }

        // If Sarvam fails, complete silently (no OpenAI fallback per user request)
        if (audioContents.length === 0) {
          console.warn('⚠️ All TTS providers unavailable - skipping audio');
          if (!stoppedRef.current) {
            toast({
              title: "Voice Unavailable",
              description: "Voice narration is temporarily unavailable.",
              variant: "default"
            });
          }
          setIsLoading(false);
          setIsSpeaking(false);
          onComplete?.();
          return;
        }

        // Check if stopped before playing
        if (stoppedRef.current) {
          setIsLoading(false);
          setIsSpeaking(false);
          return;
        }

        // Play all audio segments sequentially
        for (let j = 0; j < audioContents.length; j++) {
          const audioContent = audioContents[j];
          
          // Create audio from base64
          const audioBlob = base64ToBlob(audioContent, mimeType);
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Check if stopped before each segment
          if (stoppedRef.current) {
            URL.revokeObjectURL(audioUrl);
            setIsLoading(false);
            setIsSpeaking(false);
            return;
          }

          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // Wait for this segment to finish playing
          await new Promise<void>((resolve, reject) => {
            audio.onplay = () => {
              console.log(`▶️ TTS: Audio segment ${j + 1}/${audioContents.length} playing`);
              setIsSpeaking(true);
              setIsLoading(false);
            };

            audio.onended = () => {
              console.log(`⏹️ TTS: Audio segment ${j + 1}/${audioContents.length} ended`);
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
              resolve();
            };

            audio.onerror = (e) => {
              console.error(`❌ TTS: Audio segment ${j + 1} error`, e);
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
              // If stopped, just resolve
              if (stoppedRef.current) {
                resolve();
              } else {
                reject(new Error('Audio playback failed'));
              }
            };

            audio.play().catch((err) => {
              if (stoppedRef.current) {
                resolve();
              } else {
                reject(err);
              }
            });
          });

          // Small pause between segments for natural flow
          if (j < audioContents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Small pause between chunks for natural flow
        if (!isLastChunk) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      // All chunks complete
      setIsSpeaking(false);
      onComplete?.();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown TTS error';
      console.error("❌ TTS error:", errorMessage);
      
      // Complete silently - Sarvam only, no fallback
      console.warn('⚠️ TTS failed - completing without audio');
      setIsLoading(false);
      setIsSpeaking(false);
      setError(null);
      
      toast({
        title: "Voice Unavailable",
        description: "Voice narration failed. Continuing in reading mode.",
        variant: "default"
      });
      
      onComplete?.();
    }
  }, [stopSpeaking, toast]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    precacheAudio,
    isLoading,
    error,
  };
};

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

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

interface UseGoogleTTSReturn {
  speak: (text: string, languageCode?: SupportedLanguage, gender?: "female" | "male", onComplete?: () => void) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useGoogleTTS = (): UseGoogleTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stopSpeaking = useCallback(() => {
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
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
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

  const speak = useCallback(async (
    text: string,
    languageCode: SupportedLanguage = 'en-IN',
    gender: "female" | "male" = "female",
    onComplete?: () => void
  ) => {
    // Clean the text
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

    // Stop any currently playing audio
    stopSpeaking();

    // Split into chunks if text is too long (OpenAI TTS limit is 4096 chars)
    const chunks = splitTextIntoChunks(cleanText, 3800);
    
    if (chunks.length > 1) {
      console.log(`🔊 OpenAI TTS: Splitting text into ${chunks.length} chunks`);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLastChunk = i === chunks.length - 1;
        
        console.log(`🔊 OpenAI TTS: Speaking chunk ${i + 1}/${chunks.length} in ${languageCode}, gender: ${gender}, length: ${chunk.length}`);

        const { data, error: functionError } = await supabase.functions.invoke('google-tts', {
          body: {
            text: chunk,
            languageCode,
            gender,
          },
        });

        // Check for quota/rate limit errors - fallback to Web Speech
        if (functionError || data?.error) {
          const errMsg = functionError?.message || data?.error || '';
          const errDetails = data?.details || '';
          const fullError = `${errMsg} ${errDetails}`.toLowerCase();
          
          // Check for quota, rate limit, or TTS synthesis failure
          if (fullError.includes('quota') || fullError.includes('429') || 
              fullError.includes('insufficient') || errMsg.includes('TTS synthesis failed')) {
            console.warn('⚠️ OpenAI TTS quota exceeded, falling back to Web Speech API');
            toast({
              title: "Using Browser Voice",
              description: "OpenAI TTS unavailable. Using browser's speech synthesis.",
            });
            setIsLoading(false);
            speakWithWebSpeech(cleanText, onComplete);
            return;
          }
          throw new Error(errMsg || 'TTS function error');
        }

        if (!data?.audioContent) {
          throw new Error('No audio content received');
        }

        // Create audio from base64
        const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Wait for this chunk to finish playing
        await new Promise<void>((resolve, reject) => {
          audio.onplay = () => {
            console.log(`▶️ OpenAI TTS: Audio chunk ${i + 1} playing`);
            setIsSpeaking(true);
            setIsLoading(false);
          };

          audio.onended = () => {
            console.log(`⏹️ OpenAI TTS: Audio chunk ${i + 1} ended`);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            resolve();
          };

          audio.onerror = (e) => {
            console.error(`❌ OpenAI TTS: Audio chunk ${i + 1} error`, e);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            reject(new Error('Audio playback failed'));
          };

          audio.play().catch(reject);
        });

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
      console.error("❌ OpenAI TTS error:", errorMessage);
      
      // Fallback to Web Speech API
      console.warn('⚠️ Falling back to Web Speech API');
      setIsLoading(false);
      setError(null);
      
      toast({
        title: "Using Browser Voice",
        description: "OpenAI TTS unavailable. Using browser's speech synthesis.",
      });
      
      speakWithWebSpeech(cleanText, onComplete);
    }
  }, [stopSpeaking, toast, speakWithWebSpeech]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
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

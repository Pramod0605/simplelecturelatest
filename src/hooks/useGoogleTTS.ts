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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
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

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔊 OpenAI TTS: Speaking in ${languageCode}, gender: ${gender}, text length: ${cleanText.length}`);

      const { data, error: functionError } = await supabase.functions.invoke('google-tts', {
        body: {
          text: cleanText,
          languageCode,
          gender,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'TTS function error');
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Create audio from base64
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        console.log("▶️ OpenAI TTS: Audio playing");
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        console.log("⏹️ OpenAI TTS: Audio ended");
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        onComplete?.();
      };

      audio.onerror = (e) => {
        console.error("❌ OpenAI TTS: Audio error", e);
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setError('Audio playback failed');
        onComplete?.();
      };

      await audio.play();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown TTS error';
      console.error("❌ OpenAI TTS error:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      setIsSpeaking(false);
      
      toast({
        title: "Voice Error",
        description: "Could not generate speech. Using fallback.",
        variant: "destructive",
      });
      
      onComplete?.();
    }
  }, [stopSpeaking, toast]);

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

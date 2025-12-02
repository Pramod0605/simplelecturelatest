import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseWebSpeechReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: (language?: string) => void;
  stopListening: () => void;
  speak: (text: string, language?: string) => void;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export const useWebSpeech = (): UseWebSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();

  // Check if Web Speech API is supported
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  // Speech Recognition
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!isSupported) return;

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
        console.log("Speech recognition transcript:", combinedTranscript);
        setTranscript(combinedTranscript);
      }
    };

    recog.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      toast({
        title: "Voice Input Error",
        description: "Could not process voice input. Please try again.",
        variant: "destructive",
      });
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);
  }, [isSupported, toast]);

  const startListening = useCallback((language = 'en-IN') => {
    if (!recognition) {
      console.error("Speech recognition not available");
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
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
      console.log("Started listening with language:", langCode);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access and try again.",
        variant: "destructive",
      });
    }
  }, [recognition, toast]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const speak = useCallback((text: string, language = 'en-IN') => {
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

    // Clean text: remove markdown, asterisks, quotes, and special characters
    let cleanText = text
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
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Priority-based voice selection for Indian accent
    const voices = window.speechSynthesis.getVoices();
    const primaryLang = langCode.split('-')[0];
    
    // Step 1: Try exact locale match (e.g., kn-IN)
    let matchingVoice = voices.find(voice => 
      voice.lang.replace('_', '-') === langCode
    );
    
    // Step 2: If no exact match, try Indian variants first
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.startsWith(primaryLang) && voice.lang.includes('IN')
      );
    }
    
    // Step 3: Fall back to any voice with the same primary language
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => 
        voice.lang.startsWith(primaryLang)
      );
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      console.log("Using voice:", matchingVoice.name, matchingVoice.lang, "for language:", langCode);
    } else {
      console.log("No matching voice found for:", langCode, "Available voices:", 
        voices.filter(v => v.lang.startsWith(primaryLang)).map(v => `${v.name} (${v.lang})`));
    }

    utterance.onstart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
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
  }, [speechSynthesisSupported, toast]);

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

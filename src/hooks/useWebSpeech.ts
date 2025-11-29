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
      recognition.lang = language;
      recognition.start();
      setIsListening(true);
      console.log("Started listening with language:", language);
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Try to find an Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(voice => 
      voice.lang.startsWith('en-IN') || 
      voice.lang === 'en_IN' ||
      voice.name.toLowerCase().includes('india')
    );

    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "Could not play audio. Please check your settings.",
        variant: "destructive",
      });
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSynthesisSupported, toast]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesisSupported]);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  };
};

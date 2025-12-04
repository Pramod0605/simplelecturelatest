import { useEffect, useRef, useState, useCallback } from "react";

interface UseVoiceActivityDetectionProps {
  enabled: boolean;
  onVoiceDetected: () => void;
  threshold?: number;
  detectionDuration?: number;
  onAudioLevel?: (level: number) => void;
}

export const useVoiceActivityDetection = ({
  enabled,
  onVoiceDetected,
  threshold = 45,
  detectionDuration = 200,
  onAudioLevel,
}: UseVoiceActivityDetectionProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const micPermissionDeniedRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    analyserRef.current = null;
    setIsDetecting(false);
    setCurrentLevel(0);
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    startVAD();

    return () => {
      cleanup();
    };
  }, [enabled, cleanup]);

  const startVAD = async () => {
    try {
      if (micPermissionDeniedRef.current) {
        console.log("VAD: Microphone permission denied, skipping");
        return;
      }

      if (micStreamRef.current && micStreamRef.current.active) {
        console.log("VAD: Reusing existing microphone stream");
        setupAudioAnalysis(micStreamRef.current);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      micStreamRef.current = stream;
      setupAudioAnalysis(stream);
    } catch (error) {
      console.log("VAD: Microphone access not available:", error);
      micPermissionDeniedRef.current = true;
      setIsDetecting(false);
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsDetecting(true);
      monitorAudioLevel();
    } catch (error) {
      console.log("VAD: Failed to setup audio analysis:", error);
      setIsDetecting(false);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Update current level for visual feedback
      setCurrentLevel(average);
      if (onAudioLevel) {
        onAudioLevel(average);
      }

      // Check if voice detected above threshold
      if (average > threshold) {
        const now = Date.now();
        // Reduced cooldown to 300ms for faster response
        if (now - lastTriggerRef.current < 300) {
          animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
          return;
        }

        if (!detectionTimerRef.current) {
          detectionTimerRef.current = setTimeout(() => {
            console.log("VAD: Voice detected! Average volume:", average);
            lastTriggerRef.current = Date.now();
            onVoiceDetected();
            detectionTimerRef.current = null;
          }, detectionDuration);
        }
      } else {
        if (detectionTimerRef.current) {
          clearTimeout(detectionTimerRef.current);
          detectionTimerRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  return {
    isDetecting,
    currentLevel,
  };
};

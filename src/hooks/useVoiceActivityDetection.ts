import { useEffect, useRef, useState } from "react";

interface UseVoiceActivityDetectionProps {
  enabled: boolean;
  onVoiceDetected: () => void;
  threshold?: number; // Volume threshold 0-255
  detectionDuration?: number; // How long to detect before triggering (ms)
}

export const useVoiceActivityDetection = ({
  enabled,
  onVoiceDetected,
  threshold = 40,
  detectionDuration = 300,
}: UseVoiceActivityDetectionProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const micPermissionDeniedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    // Start VAD monitoring
    startVAD();

    return () => {
      cleanup();
    };
  }, [enabled]);

  const startVAD = async () => {
    try {
      // Skip if microphone permission was previously denied
      if (micPermissionDeniedRef.current) {
        console.log("VAD: Microphone permission denied, skipping");
        return;
      }

      // Reuse existing stream if available
      if (micStreamRef.current && micStreamRef.current.active) {
        console.log("VAD: Reusing existing microphone stream");
        setupAudioAnalysis(micStreamRef.current);
        return;
      }

      // Request microphone access with noise cancellation
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
      // Silent error handling - don't show popup to user
      console.log("VAD: Microphone access not available:", error);
      micPermissionDeniedRef.current = true;
      setIsDetecting(false);
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {

      // Create audio context and analyzer
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsDetecting(true);
      
      // Start monitoring audio levels
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

      // Check if voice detected above threshold
      if (average > threshold) {
        // Add cooldown to prevent rapid re-triggers
        const now = Date.now();
        if (now - lastTriggerRef.current < 1000) {
          return; // Skip if triggered within last 1 second
        }

        // Start detection timer if not already running
        if (!detectionTimerRef.current) {
          detectionTimerRef.current = setTimeout(() => {
            console.log("VAD: Voice detected! Average volume:", average);
            lastTriggerRef.current = Date.now();
            onVoiceDetected();
            detectionTimerRef.current = null;
          }, detectionDuration);
        }
      } else {
        // Clear timer if volume drops below threshold
        if (detectionTimerRef.current) {
          clearTimeout(detectionTimerRef.current);
          detectionTimerRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const cleanup = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear detection timer
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    analyserRef.current = null;
    setIsDetecting(false);
  };

  return {
    isDetecting,
  };
};

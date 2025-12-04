import { useEffect, useRef, useState, useCallback } from "react";

interface UseVoiceActivityDetectionProps {
  enabled: boolean;
  onVoiceDetected: () => void;
  threshold?: number;
  detectionDuration?: number;
  onAudioLevel?: (level: number) => void;
}

// Human speech fundamental frequency range (85-255 Hz)
const SPEECH_FREQ_LOW = 85;
const SPEECH_FREQ_HIGH = 255;

export const useVoiceActivityDetection = ({
  enabled,
  onVoiceDetected,
  threshold = 55, // Increased from 45 to reduce false positives
  detectionDuration = 400, // Increased from 200ms for sustained detection
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
  const consecutiveHighFramesRef = useRef<number>(0);

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
    consecutiveHighFramesRef.current = 0;
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
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;

      // Create filters for human speech frequency range (85-255 Hz)
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = SPEECH_FREQ_HIGH;
      lowPassFilter.Q.value = 1;

      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = SPEECH_FREQ_LOW;
      highPassFilter.Q.value = 1;

      const microphone = audioContext.createMediaStreamSource(stream);
      
      // Chain: microphone -> highPass -> lowPass -> analyser
      microphone.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(analyser);

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
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyResolution = sampleRate / (analyser.fftSize);

    // Calculate which bins correspond to speech frequencies
    const lowBin = Math.floor(SPEECH_FREQ_LOW / frequencyResolution);
    const highBin = Math.ceil(SPEECH_FREQ_HIGH / frequencyResolution);

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average only in speech frequency range (85-255 Hz)
      let speechSum = 0;
      let speechCount = 0;
      for (let i = lowBin; i <= highBin && i < bufferLength; i++) {
        speechSum += dataArray[i];
        speechCount++;
      }
      const speechAverage = speechCount > 0 ? speechSum / speechCount : 0;

      // Calculate overall average for noise comparison
      let totalSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalSum += dataArray[i];
      }
      const overallAverage = totalSum / bufferLength;

      // Speech should have higher energy in speech frequencies compared to overall
      // This helps distinguish speech from broadband noise
      const isSpeechLike = speechAverage > overallAverage * 1.2;

      // Update current level for visual feedback (use speech-filtered level)
      setCurrentLevel(speechAverage);
      if (onAudioLevel) {
        onAudioLevel(speechAverage);
      }

      // Check if voice detected above threshold with speech-like characteristics
      if (speechAverage > threshold && isSpeechLike) {
        consecutiveHighFramesRef.current++;
        
        // Require at least 3 consecutive frames above threshold (more reliable)
        if (consecutiveHighFramesRef.current >= 3) {
          const now = Date.now();
          // Cooldown of 500ms between triggers
          if (now - lastTriggerRef.current < 500) {
            animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
            return;
          }

          if (!detectionTimerRef.current) {
            detectionTimerRef.current = setTimeout(() => {
              console.log("VAD: Speech detected! Speech avg:", speechAverage.toFixed(1), "Overall:", overallAverage.toFixed(1));
              lastTriggerRef.current = Date.now();
              consecutiveHighFramesRef.current = 0;
              onVoiceDetected();
              detectionTimerRef.current = null;
            }, detectionDuration);
          }
        }
      } else {
        // Reset consecutive count on silence
        consecutiveHighFramesRef.current = Math.max(0, consecutiveHighFramesRef.current - 1);
        
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

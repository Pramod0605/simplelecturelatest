import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VoiceSettings {
  englishVoiceName: string;
  hindiVoiceName: string;
  englishRate: number;
  englishPitch: number;
  hindiRate: number;
  hindiPitch: number;
}

// Default Indian voice settings - Use Google Hindi for both languages
// Google Hindi works best across all browsers and platforms
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  englishVoiceName: "Google हिन्दी",
  hindiVoiceName: "Google हिन्दी",
  englishRate: 0.85,
  englishPitch: 1.10,
  hindiRate: 0.80,
  hindiPitch: 1.15,
};

// Recommended Indian voices for reference
export const RECOMMENDED_VOICES = {
  english: [
    "Google हिन्दी",
    "Microsoft Neerja Online (Natural) - English (India)",
    "Google US English",
  ],
  hindi: [
    "Google हिन्दी",
    "Microsoft Heera - Hindi (India)",
    "Microsoft Hemant - Hindi (India)",
  ],
};

export const useVoiceSettings = () => {
  return useQuery({
    queryKey: ["voice-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "voice_settings")
        .maybeSingle();

      if (error) {
        console.error("Error fetching voice settings:", error);
        return DEFAULT_VOICE_SETTINGS;
      }

      if (!data) {
        return DEFAULT_VOICE_SETTINGS;
      }

      return data.setting_value as unknown as VoiceSettings;
    },
  });
};

export const useUpdateVoiceSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: VoiceSettings) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("ai_settings")
        .select("id")
        .eq("setting_key", "voice_settings")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("ai_settings")
          .update({
            setting_value: settings as any,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "voice_settings");

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("ai_settings")
          .insert({
            setting_key: "voice_settings",
            setting_value: settings as any,
            description: "Voice settings for AI Sales Assistant",
          });

        if (error) throw error;
      }

      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-settings"] });
      toast({
        title: "Voice Settings Saved",
        description: "Your voice preferences will be applied to the AI Assistant",
      });
    },
    onError: (error) => {
      console.error("Error saving voice settings:", error);
      toast({
        title: "Error",
        description: "Failed to save voice settings",
        variant: "destructive",
      });
    },
  });
};

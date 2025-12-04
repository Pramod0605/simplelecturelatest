import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CounselorAvatars {
  female: string | null;
  male: string | null;
}

const CACHE_VERSION = 8; // Increment to force new realistic avatars
const STORAGE_KEY = `counselor_avatars_v${CACHE_VERSION}`;
const CACHE_EXPIRY_DAYS = 30;

// Fallback professional placeholder images (shown while generating)
const FALLBACK_AVATARS: CounselorAvatars = {
  female: null, // Will use emoji placeholder
  male: null,   // Will use emoji placeholder
};

const PROMPTS = {
  // Hindi - Realistic professional Indian female counselor
  female: `A real photograph of a young Indian woman education counselor, age 25, friendly professional smile, wearing light pink traditional kurta, small nose stud, gold earrings, black wavy hair, office background, natural lighting, portrait photo taken with professional camera, realistic human face, genuine warm expression, corporate headshot style`,
  
  // English - Realistic professional Indian male counselor  
  male: `A real photograph of a young Indian man education counselor, age 27, confident friendly smile, wearing navy blue blazer over white shirt, clean shaven, short styled black hair, office background, natural lighting, portrait photo taken with professional camera, realistic human face, professional approachable expression, corporate headshot style`,
};

export const useGenerateCounselorAvatars = () => {
  const [avatars, setAvatars] = useState<CounselorAvatars>({ female: null, male: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheDate = new Date(parsed.timestamp);
        const now = new Date();
        const daysSinceCached = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCached < CACHE_EXPIRY_DAYS && parsed.avatars) {
          console.log("✅ Loading cached avatars");
          setAvatars(parsed.avatars);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading cached avatars:", err);
    }

    generateAvatars();
  };

  const generateAvatars = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    console.log("🎨 Starting attractive avatar generation...");

    try {
      // Generate female avatar (Priya - Hindi)
      console.log("Generating beautiful female avatar (Priya)...");
      const femaleResponse = await supabase.functions.invoke("ai-generate-image", {
        body: { prompt: PROMPTS.female },
      });

      if (femaleResponse.error) {
        console.error("Female avatar generation error:", femaleResponse.error);
        throw new Error("Failed to generate female avatar");
      }

      console.log("✅ Female avatar generated");

      // Generate male avatar (Rahul - English)
      console.log("Generating handsome male avatar (Rahul)...");
      const maleResponse = await supabase.functions.invoke("ai-generate-image", {
        body: { prompt: PROMPTS.male },
      });

      if (maleResponse.error) {
        console.error("Male avatar generation error:", maleResponse.error);
        throw new Error("Failed to generate male avatar");
      }

      console.log("✅ Male avatar generated");

      const newAvatars: CounselorAvatars = {
        female: femaleResponse.data?.imageUrl || null,
        male: maleResponse.data?.imageUrl || null,
      };

      // Cache the avatars
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          avatars: newAvatars,
          timestamp: new Date().toISOString(),
        })
      );

      console.log("✅ Attractive avatars cached successfully");
      setAvatars(newAvatars);
      toast.success("Counselor avatars loaded successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate avatars";
      setError(errorMessage);
      console.error("❌ Avatar generation error:", err);
      toast.error("Using default avatars");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAvatars({ female: null, male: null });
    generateAvatars();
  };

  return {
    avatars,
    isGenerating,
    error,
    regenerate: generateAvatars,
    clearCache,
  };
};

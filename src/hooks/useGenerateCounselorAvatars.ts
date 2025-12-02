import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CounselorAvatars {
  female: string | null;
  male: string | null;
}

const CACHE_VERSION = 4; // Increment to invalidate old cache
const STORAGE_KEY = `counselor_avatars_v${CACHE_VERSION}`;
const CACHE_EXPIRY_DAYS = 30;

const PROMPTS = {
  female: `PHOTOREALISTIC professional headshot photograph of a young Indian woman educational counselor, age 28-30 years old, 
authentic Indian facial features with warm medium-dark brown skin tone, expressive dark brown eyes, 
genuine warm smile showing perfect white teeth, wearing elegant burgundy silk saree with delicate gold embroidery, 
traditional small gold and pearl earrings, minimal natural makeup highlighting natural beauty, 
straight black hair neatly styled in professional bun with jasmine flowers, clear glowing skin, 
shot with professional DSLR Canon EOS R5 with 85mm f/1.2 lens creating beautiful bokeh, 
studio lighting with soft natural window light from side, shallow depth of field f/1.8, 
professional corporate office background softly blurred, confident and approachable expression, 
REAL HUMAN PHOTOGRAPH NOT AI ART NOT ILLUSTRATION NOT CARTOON NOT 3D RENDER, 
ultra high resolution 8K quality, photojournalism style authentic portrait`,
  
  male: `PHOTOREALISTIC professional headshot photograph of a young Indian man educational counselor, age 28-30 years old,
authentic Indian facial features with warm medium brown skin tone, friendly dark brown eyes, 
genuine warm smile, wearing crisp light blue formal shirt with white collar, dark blue tie, 
clean shaven face with well-groomed short black hair professional cut, strong defined jawline,
shot with professional DSLR Canon EOS R5 with 85mm f/1.2 lens creating beautiful bokeh,
studio lighting with soft natural window light from side, shallow depth of field f/1.8,
professional corporate office background softly blurred, confident and approachable expression,
REAL HUMAN PHOTOGRAPH NOT AI ART NOT ILLUSTRATION NOT CARTOON NOT 3D RENDER,
ultra high resolution 8K quality, photojournalism style authentic portrait`,
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
          setAvatars(parsed.avatars);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading cached avatars:", err);
    }

    // If no valid cache, generate new avatars
    generateAvatars();
  };

  const generateAvatars = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      // Generate female avatar
      const femaleResponse = await supabase.functions.invoke("ai-generate-image", {
        body: { prompt: PROMPTS.female },
      });

      if (femaleResponse.error) throw new Error("Failed to generate female avatar");

      // Generate male avatar
      const maleResponse = await supabase.functions.invoke("ai-generate-image", {
        body: { prompt: PROMPTS.male },
      });

      if (maleResponse.error) throw new Error("Failed to generate male avatar");

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

      setAvatars(newAvatars);
      toast.success("Counselor avatars loaded successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate avatars";
      setError(errorMessage);
      console.error("Error generating avatars:", err);
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

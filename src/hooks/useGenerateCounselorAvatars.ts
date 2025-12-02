import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CounselorAvatars {
  female: string | null;
  male: string | null;
}

const CACHE_VERSION = 2; // Increment to invalidate old cache
const STORAGE_KEY = `counselor_avatars_v${CACHE_VERSION}`;
const CACHE_EXPIRY_DAYS = 30;

const PROMPTS = {
  female: `PHOTOREALISTIC photograph of a professional Indian woman in her late 20s, 
warm genuine smile showing teeth, wearing elegant burgundy saree with gold embroidery, 
small pearl earrings, clear smooth skin, natural makeup, expressive brown eyes with warmth, 
professional corporate headshot style, DSLR camera Canon 85mm f/1.4 portrait lens, 
natural soft lighting from window, shallow depth of field, 
REAL PERSON NOT ILLUSTRATION NOT CARTOON NOT CGI, 
modern office background blurred bokeh, confident approachable expression, 
ultra high resolution 4K photograph`,
  
  male: `PHOTOREALISTIC photograph of a professional Indian man in his late 20s, 
warm genuine smile, wearing crisp light blue formal shirt with collar, 
clean shaven face, well-groomed short black hair, friendly brown eyes, 
professional corporate headshot style, DSLR camera Canon 85mm f/1.4 portrait lens,
natural soft lighting from window, shallow depth of field, 
REAL PERSON NOT ILLUSTRATION NOT CARTOON NOT CGI, 
modern office background blurred bokeh, confident approachable expression, 
ultra high resolution 4K photograph`,
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

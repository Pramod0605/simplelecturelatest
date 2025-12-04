import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CounselorAvatars {
  female: string | null;
  male: string | null;
}

const CACHE_VERSION = 6; // Increment to force new attractive avatars
const STORAGE_KEY = `counselor_avatars_v${CACHE_VERSION}`;
const CACHE_EXPIRY_DAYS = 30;

const PROMPTS = {
  // Hindi - Beautiful, cute, professional Indian female
  female: `PHOTOREALISTIC professional photograph of a beautiful young Indian woman, 
age 24-26, cute and charming appearance with beautiful radiant smile showing warmth, 
large expressive dark brown eyes with natural kajal, glowing fair-medium wheatish skin tone, 
professional yet approachable look, wearing elegant pastel pink silk kurta with delicate gold embroidery, 
small sparkling diamond nose pin on left nostril, traditional gold jhumka earrings with pearls, 
silky lustrous black hair styled in soft waves falling on shoulders, natural dewy makeup with rosy cheeks, 
warm studio lighting with soft fill, professional corporate office background with soft bokeh,
confident intelligent friendly expression like a news anchor, high cheekbones, perfect eyebrows,
shot with professional DSLR Canon EOS R5 with 85mm f/1.2 L lens creating creamy bokeh,
GORGEOUS ATTRACTIVE AND PROFESSIONAL Indian beauty, Bollywood actress quality looks,
REAL HUMAN PHOTOGRAPH NOT AI ART NOT ILLUSTRATION NOT CARTOON NOT 3D RENDER NOT CGI,
ultra high resolution 8K quality, magazine cover portrait style, shot in natural daylight`,
  
  // English - Handsome, attractive, smart Indian male
  male: `PHOTOREALISTIC professional photograph of an attractive young Indian man,
age 26-28, charismatic and charming appearance with confident warm genuine smile showing dimples,
expressive friendly dark brown eyes with thick eyebrows, warm medium brown skin tone,
styled modern short haircut with neat side part, clean shaven face with strong defined jawline,
wearing premium navy blue blazer over crisp white formal shirt, no tie for approachable look,
silver wristwatch visible, confident pleasant approachable expression,
warm studio lighting with soft natural window light from side, 
professional corporate office background with plants softly blurred,
shot with professional DSLR Canon EOS R5 with 85mm f/1.2 L lens creating beautiful bokeh,
VERY HANDSOME AND APPEALING, Bollywood actor quality looks like Sidharth Malhotra or Vicky Kaushal,
sharp features, clear glowing skin, athletic build visible through blazer,
REAL HUMAN PHOTOGRAPH NOT AI ART NOT ILLUSTRATION NOT CARTOON NOT 3D RENDER NOT CGI,
ultra high resolution 8K quality, GQ magazine cover portrait style, shot in natural daylight`,
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

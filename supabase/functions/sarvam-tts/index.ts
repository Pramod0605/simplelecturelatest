import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map language codes to Sarvam speaker names
function getSpeakerForLanguageAndGender(languageCode: string, gender: string): string {
  // Sarvam voices: meera (female), abhilash (male), anushka (female)
  if (gender === 'female') {
    return 'meera';
  }
  return 'abhilash';
}

// Map our language codes to Sarvam's supported codes
function mapLanguageCode(langCode: string): string {
  const mapping: Record<string, string> = {
    'en-IN': 'en-IN',
    'hi-IN': 'hi-IN',
    'kn-IN': 'kn-IN',
    'ta-IN': 'ta-IN',
    'te-IN': 'te-IN',
    'ml-IN': 'ml-IN',
    'mr-IN': 'mr-IN',
    'bn-IN': 'bn-IN',
    'gu-IN': 'gu-IN',
    'pa-IN': 'pa-IN',
    'od-IN': 'od-IN',
  };
  return mapping[langCode] || 'en-IN';
}

// Split text into chunks of max 450 characters (leaving margin), breaking at sentence/word boundaries
function splitTextIntoChunks(text: string, maxLength: number = 450): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find best break point (sentence end, then comma, then space)
    let breakPoint = -1;
    const searchRange = remaining.substring(0, maxLength);
    
    // Try sentence endings first
    const sentenceEnd = Math.max(
      searchRange.lastIndexOf('. '),
      searchRange.lastIndexOf('! '),
      searchRange.lastIndexOf('? ')
    );
    if (sentenceEnd > maxLength * 0.5) {
      breakPoint = sentenceEnd + 1;
    }
    
    // Try comma if no sentence end
    if (breakPoint === -1) {
      const commaPoint = searchRange.lastIndexOf(', ');
      if (commaPoint > maxLength * 0.5) {
        breakPoint = commaPoint + 1;
      }
    }
    
    // Fall back to last space
    if (breakPoint === -1) {
      const spacePoint = searchRange.lastIndexOf(' ');
      if (spacePoint > 0) {
        breakPoint = spacePoint;
      } else {
        breakPoint = maxLength; // Hard cut if no space found
      }
    }

    chunks.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }

  return chunks.filter(c => c.length > 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languageCode = 'en-IN', gender = 'male' } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('SARVAM_API_KEY');
    if (!apiKey) {
      console.error('SARVAM_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SARVAM_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const speaker = getSpeakerForLanguageAndGender(languageCode, gender);
    const sarvamLangCode = mapLanguageCode(languageCode);

    // Split text into chunks to respect 500 char limit
    const chunks = splitTextIntoChunks(text);
    console.log(`🔊 Sarvam TTS: ${chunks.length} chunks, lang=${sarvamLangCode}, speaker=${speaker}`);

    const audioChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);

      // Add delay between chunks to avoid rate limiting (except for first chunk)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Subscription-Key': apiKey,
        },
        body: JSON.stringify({
          inputs: [chunk],
          target_language_code: sarvamLangCode,
          speaker: speaker,
          speech_sample_rate: 22050,
          model: 'bulbul:v2',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sarvam API error on chunk ${i + 1}:`, response.status, errorText);
        
        // On rate limit, wait and retry once
        if (response.status === 429) {
          console.log(`  Rate limited, waiting 2s and retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'API-Subscription-Key': apiKey,
            },
            body: JSON.stringify({
              inputs: [chunk],
              target_language_code: sarvamLangCode,
              speaker: speaker,
          speech_sample_rate: 22050,
              model: 'bulbul:v2',
            }),
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            if (retryResult.audios && retryResult.audios.length > 0) {
              audioChunks.push(retryResult.audios[0]);
              continue;
            }
          }
        }
        
        return new Response(
          JSON.stringify({ error: 'Sarvam TTS failed', details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      
      if (!result.audios || result.audios.length === 0) {
        console.error(`No audio in Sarvam response for chunk ${i + 1}`);
        return new Response(
          JSON.stringify({ error: 'No audio generated' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      audioChunks.push(result.audios[0]);
    }

    console.log(`✅ Sarvam TTS success: ${audioChunks.length} audio chunks`);

    return new Response(
      JSON.stringify({
        audioContent: audioChunks.length === 1 ? audioChunks[0] : audioChunks,
        isChunked: audioChunks.length > 1,
        chunkCount: audioChunks.length,
        languageCode: sarvamLangCode,
        voice: speaker,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sarvam TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

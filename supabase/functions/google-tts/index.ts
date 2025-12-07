import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map gender to lively, energetic voices
// OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
const getVoiceForGender = (gender: string): string => {
  // Use more energetic, lively voices
  if (gender === 'male') {
    return 'fable'; // Expressive, engaging British-accented voice
  }
  return 'nova'; // Energetic, youthful female voice
};

// Add energy to text for more lively speech
function addEnergyToText(text: string): string {
  // Add natural pauses and emphasis
  let energized = text
    // Add slight emphasis after key educational words
    .replace(/\b(important|remember|key|note|formula|concept)\b/gi, '$1!')
    // Add natural pauses after periods
    .replace(/\. /g, '... ')
    // Add enthusiasm markers
    .replace(/\?/g, '?!')
    // Keep it natural for Hindi
    .replace(/। /g, '। ... ');
  
  return energized;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languageCode = 'en-IN', gender = 'female' } = await req.json();

    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'TTS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voice = getVoiceForGender(gender);
    
    // Add energy to the text for lively delivery
    const energizedText = addEnergyToText(text);
    
    console.log(`Synthesizing lively speech: lang=${languageCode}, voice=${voice}, gender=${gender}, text length=${energizedText.length}`);

    // Call OpenAI TTS API with faster, more energetic speed
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Use HD model for better quality
        input: energizedText,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0, // Normal speed for more energetic delivery
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'TTS synthesis failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio as ArrayBuffer and convert to base64 (chunked to avoid stack overflow)
    const audioBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let binary = '';
    const chunkSize = 32768;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    console.log(`Lively speech synthesized successfully, audio size: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        languageCode,
        voice 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

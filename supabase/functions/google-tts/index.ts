import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Cloud TTS voice mapping for Indian regional languages
const VOICE_MAP: Record<string, { male: string; female: string; languageCode: string }> = {
  'en-IN': { male: 'en-IN-Standard-B', female: 'en-IN-Standard-A', languageCode: 'en-IN' },
  'hi-IN': { male: 'hi-IN-Standard-B', female: 'hi-IN-Standard-A', languageCode: 'hi-IN' },
  'ta-IN': { male: 'ta-IN-Standard-B', female: 'ta-IN-Standard-A', languageCode: 'ta-IN' },
  'te-IN': { male: 'te-IN-Standard-B', female: 'te-IN-Standard-A', languageCode: 'te-IN' },
  'kn-IN': { male: 'kn-IN-Standard-B', female: 'kn-IN-Standard-A', languageCode: 'kn-IN' },
  'ml-IN': { male: 'ml-IN-Standard-B', female: 'ml-IN-Standard-A', languageCode: 'ml-IN' },
  'bn-IN': { male: 'bn-IN-Standard-B', female: 'bn-IN-Standard-A', languageCode: 'bn-IN' },
  'mr-IN': { male: 'mr-IN-Standard-B', female: 'mr-IN-Standard-A', languageCode: 'mr-IN' },
  'gu-IN': { male: 'gu-IN-Standard-B', female: 'gu-IN-Standard-A', languageCode: 'gu-IN' },
  'pa-IN': { male: 'pa-IN-Standard-B', female: 'pa-IN-Standard-A', languageCode: 'pa-IN' },
};

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

    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_TTS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'TTS API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get voice configuration for the language
    const voiceConfig = VOICE_MAP[languageCode] || VOICE_MAP['en-IN'];
    const voiceName = gender === 'male' ? voiceConfig.male : voiceConfig.female;

    console.log(`Synthesizing speech: lang=${languageCode}, voice=${voiceName}, text length=${text.length}`);

    // Call Google Cloud TTS API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9, // Slightly slower for clarity
            pitch: 0, // Natural pitch
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'TTS synthesis failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('TTS synthesis successful, audio content length:', data.audioContent?.length || 0);

    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        languageCode,
        voiceName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Google TTS error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

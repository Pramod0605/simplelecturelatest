import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, checkOnly } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If checkOnly, find unanswered posts older than 10 minutes in General category
    if (checkOnly) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: unansweredPosts, error: fetchError } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          category:forum_categories!inner(is_general)
        `)
        .eq('is_answered', false)
        .eq('status', 'published')
        .lt('created_at', tenMinutesAgo)
        .eq('forum_categories.is_general', true);

      if (fetchError) {
        console.error('Error fetching unanswered posts:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${unansweredPosts?.length || 0} unanswered general posts`);

      // Process each unanswered post
      for (const post of unansweredPosts || []) {
        await generateAIReply(supabase, post.id, post.title, post.content, lovableApiKey);
      }

      return new Response(JSON.stringify({ 
        processed: unansweredPosts?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct post reply
    if (!postId) {
      throw new Error('postId is required');
    }

    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, title, content')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    await generateAIReply(supabase, post.id, post.title, post.content, lovableApiKey);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forum-ai-reply:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAIReply(
  supabase: any, 
  postId: string, 
  title: string, 
  content: string,
  lovableApiKey: string | undefined
) {
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return;
  }

  console.log(`Generating AI reply for post: ${postId}`);

  const systemPrompt = `You are a helpful AI assistant for an educational LMS forum. 
Your role is to:
- Answer student questions clearly and concisely
- Provide accurate information about the LMS platform
- Be friendly and encouraging
- If you don't know something specific about the platform, acknowledge that and provide general guidance
- Keep responses focused and not too long (2-3 paragraphs max)`;

  const userPrompt = `Please answer this forum question:

Title: ${title}

Question: ${content}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response content from AI');
      return;
    }

    // Insert AI reply
    const { error: replyError } = await supabase
      .from('forum_replies')
      .insert({
        post_id: postId,
        author_id: null, // null indicates AI response
        content: aiResponse,
        is_ai_generated: true,
        status: 'published'
      });

    if (replyError) {
      console.error('Error inserting AI reply:', replyError);
      return;
    }

    console.log(`AI reply created for post: ${postId}`);
  } catch (error) {
    console.error('Error generating AI reply:', error);
  }
}

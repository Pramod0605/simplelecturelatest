import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, leadId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active courses with categories and subjects (RAG context)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        course_categories(
          categories(name, slug)
        ),
        course_subjects(
          popular_subjects(name, description)
        )
      `)
      .eq('is_active', true);

    if (coursesError) throw coursesError;

    // Build comprehensive RAG context
    const ragContext = `
# SimpleLecture E-Learning Platform

## About Us
SimpleLecture is an AI-powered e-learning platform that revolutionizes exam preparation. We offer comprehensive courses at just ₹2000, eliminating the need for expensive tuitions or tutorials.

## Key Features
- **AI-Based Video Training**: Interactive video lessons with AI-powered explanations
- **AI Assistant**: 24/7 intelligent tutoring assistant for instant doubt clearing
- **Podcasts**: Learn on-the-go with audio content
- **Question Bank & Practice Tests**: Extensive practice materials with detailed solutions
- **Notes & Study Materials**: Comprehensive notes for all subjects
- **Multi-language Support**: Content available in 13 Indian languages including Hindi, English, Kannada, Tamil, Telugu, Malayalam, and more

## Pricing
All courses are available at just ₹2000 - incredible value for comprehensive exam preparation!

## Available Courses
${courses?.map(course => `
### ${course.name}
- **Price**: ₹${course.price_inr || 2000}
- **Duration**: ${course.duration_months || 'Flexible'} months
- **Description**: ${course.short_description || course.description}
- **Categories**: ${course.course_categories?.map((cc: any) => cc.categories.name).join(', ') || 'Various'}
- **Subjects**: ${course.course_subjects?.map((cs: any) => cs.popular_subjects.name).join(', ') || 'Multiple subjects'}
- **AI Tutoring**: ${course.ai_tutoring_enabled ? `Yes (₹${course.ai_tutoring_price})` : 'Base package'}
- **Live Classes**: ${course.live_classes_enabled ? `Yes (₹${course.live_classes_price})` : 'Base package'}
- **Students Enrolled**: ${course.student_count || 'Growing community'}
- **Rating**: ${course.rating || 'Highly rated'} ${course.review_count ? `(${course.review_count} reviews)` : ''}
`).join('\n')}

## Success Promise
With SimpleLecture, students can achieve their academic goals without expensive coaching centers. Our AI-powered approach ensures personalized learning at an affordable price.
`;

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // System prompt for sales agent
    const systemPrompt = `You are a friendly sales assistant for SimpleLecture. Keep responses SHORT (2-3 sentences max).

Available courses:
${ragContext}

Style:
- Very brief, natural conversation
- NO markdown, asterisks, or special formatting
- Simple language, like talking to a friend
- Price is ₹2000 per course
- Ask questions to understand needs
- Guide to enrollment when interested`;

    // Call Lovable AI with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Count tokens for analytics (rough estimate)
    const totalTokens = messages.reduce((sum: number, msg: { content: string }) => {
      return sum + (msg.content.length / 4); // Rough estimate: 1 token ≈ 4 characters
    }, 0);

    console.log(`Conversation stats - Lead: ${leadId}, Messages: ${messages.length}, Est. Tokens: ${Math.round(totalTokens)}`);

    // Update conversation history in database
    if (leadId) {
      await supabase
        .from('sales_leads')
        .update({
          conversation_history: messages,
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("ai-sales-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { subject, topic, marks, level, diagram } = await req.json();
    if (!subject || !topic || !marks || !level) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check daily reset
    const today = new Date().toISOString().split("T")[0];
    if (profile.daily_reset_date !== today) {
      await supabase.from("profiles").update({ daily_answers_used: 0, daily_reset_date: today }).eq("id", userId);
      profile.daily_answers_used = 0;
      profile.daily_reset_date = today;
    }

    // Check daily cap
    if (profile.daily_answers_used >= profile.daily_answers_cap) {
      return new Response(JSON.stringify({ error: "daily_limit", message: "You've reached today's limit of 20 answers!" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check free limit for type (only if plan is free or expired)
    const isPaid = profile.plan_type !== "free" && profile.plan_expiry && new Date(profile.plan_expiry) > new Date();
    if (!isPaid) {
      const searchField = `searches_${marks}mark` as "searches_2mark" | "searches_5mark" | "searches_10mark";
      const used = profile[searchField];
      if (used >= 2) {
        return new Response(JSON.stringify({ error: "free_limit", marks, message: `You've used all free ${marks}-mark answers! Upgrade to continue.` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Build prompt
    const isSchool = level === "school";
    let systemPrompt = `You are ExamAI, an expert exam answer writer for Indian students. Generate a perfectly structured exam answer.\n\n`;
    
    if (isSchool) {
      if (marks === "2") {
        systemPrompt += "Write a 2-mark board exam answer: Simple definition + one key point, max 4 lines, simple language, CBSE/State board format.";
      } else if (marks === "5") {
        systemPrompt += "Write a 5-mark board exam answer: Introduction + 3-4 points with headings + conclusion, neat formatting, board exam tone.";
      } else {
        systemPrompt += "Write a 10-mark board exam answer: Detailed intro + 6-8 points with subheadings + conclusion. Write exactly how a topper writes in board exams.";
      }
    } else {
      if (marks === "2") {
        systemPrompt += "Write a 2-mark university exam answer: Technical definition + brief explanation, university terminology.";
      } else if (marks === "5") {
        systemPrompt += "Write a 5-mark university exam answer: Detailed explanation + theory + real world applications + conclusion. Make it 2x longer than a school 5-mark answer.";
      } else {
        systemPrompt += "Write a 10-mark university exam answer: Essay style, very detailed. Cover theory + derivations + applications + critical analysis + conclusion. University paper format, minimum 600 words.";
      }
    }

    if (diagram) {
      systemPrompt += "\n\nAlso include a clear ASCII diagram or describe the diagram in detail with labels.";
    }

    systemPrompt += "\n\nUse markdown formatting with **bold** headings and proper structure. Do NOT include the question in the answer.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Subject: ${subject}\nTopic: ${topic}` },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update usage counts
    const searchField = `searches_${marks}mark`;
    const updateData: Record<string, number> = {
      daily_answers_used: profile.daily_answers_used + 1,
      total_answers_generated: profile.total_answers_generated + 1,
    };
    if (!isPaid) {
      updateData[searchField] = (profile[searchField as keyof typeof profile] as number) + 1;
    }
    await supabase.from("profiles").update(updateData).eq("id", userId);

    // Stream response back
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

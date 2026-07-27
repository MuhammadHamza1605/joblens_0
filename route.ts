import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// System prompt driving the AI feature. It is deliberately strict about
// only using what the user actually provided, and about being constructive
// rather than discouraging when pointing out gaps.
const SYSTEM_PROMPT = `You are a career preparation assistant. You are given a job description and a candidate's background (their own summary of experience, skills, and education). Your job is to analyze the fit between them and produce a practical, honest preparation package.

You must respond with ONLY valid JSON (no markdown fences, no commentary before or after), matching exactly this shape:

{
  "fitSummary": string,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "gapsToAddress": string[],
  "interviewQuestions": [{ "question": string, "guidance": string }]
}

Rules for each field:
- "fitSummary": A short, honest 3-4 sentence pitch a candidate could use to introduce themselves for THIS specific role, written in first person ("I..."), based only on what they actually told you about their background. Do not invent employers, projects, titles, years of experience, or skills the candidate did not mention.
- "matchedKeywords": 6-10 specific skills, tools, or requirements from the job description that the candidate's stated background genuinely supports. Use the exact terms from the job description where possible (for resume/ATS matching).
- "missingKeywords": 3-6 specific skills, tools, or requirements the job description asks for that the candidate's background does NOT clearly demonstrate. Only list things actually mentioned or clearly implied by the job description, do not invent generic requirements.
- "gapsToAddress": 2-4 short, constructive, non-discouraging suggestions for how the candidate could address the missing keywords before applying or interviewing (e.g. a specific way to phrase transferable experience, a resource type to learn from, a way to reframe an existing project). Never suggest lying or fabricating experience.
- "interviewQuestions": Exactly 5 interview questions genuinely likely to come up for THIS role based on its specific responsibilities and requirements (not generic questions like "tell me about yourself" unless the JD's seniority/context makes that especially relevant). For each, give 1-2 sentences of guidance on how this specific candidate could answer well, grounded in what they told you about their background. If their background doesn't cover something a question needs, the guidance should suggest an honest, transferable-skills angle rather than inventing an answer for them.

Do not fabricate any fact, employer, metric, or credential not present in the candidate's own words. If their background is thin for this role, say so plainly and constructively rather than papering over it.`;

interface RequestBody {
  jobDescription: string;
  background: string;
}

interface JobLensResult {
  fitSummary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  gapsToAddress: string[];
  interviewQuestions: { question: string; guidance: string }[];
}

export async function POST(req: NextRequest) {
  let body: RequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { jobDescription, background } = body;

  if (!jobDescription || jobDescription.trim().length < 30) {
    return NextResponse.json(
      { error: "Please paste a fuller job description (at least a few sentences)." },
      { status: 400 }
    );
  }

  if (!background || background.trim().length < 20) {
    return NextResponse.json(
      { error: "Please describe your background in a bit more detail." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Set it in your hosting provider's environment variables." },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = `Job description:
"""
${jobDescription.trim()}
"""

Candidate's background, in their own words:
"""
${background.trim()}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const raw = (response.text || "").trim();

    if (!raw) {
      return NextResponse.json({ error: "The AI did not return any text. Please try again." }, { status: 502 });
    }

    // Defensive: strip markdown code fences if the model added them despite instructions.
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: JobLensResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON. Raw output was:", raw);
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "Something went wrong analyzing the job. Please check your API key and try again." },
      { status: 500 }
    );
  }
}

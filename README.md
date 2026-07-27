# JobLens

JobLens decodes a job posting against your own background and gives you a tailored preparation package: a fit summary, the exact keywords to use in your resume, honest skill gaps, and interview questions specific to that role.

## Live app

🔗 **[ADD YOUR DEPLOYED VERCEL URL HERE]**

## The problem

Job seekers apply to many different postings but rarely tailor their resume or prep for each one individually. Most people either reuse the same generic resume everywhere, or spend a long time manually re-reading a job posting trying to guess what it's really asking for and what an interviewer might ask. This hurts both ATS keyword matching and interview readiness.

JobLens is for anyone actively job hunting — students, new grads, career switchers — who wants to quickly understand exactly what a specific job posting wants, how their own background actually lines up with it, and what to prepare before applying or interviewing.

## Features

- Paste any job description and describe your background in plain language
- Generates a short, honest fit summary written in first person, ready to use as an intro pitch
- Extracts the exact keywords from the job description your background supports (useful for tailoring your resume for ATS systems)
- Flags keywords the job asks for that your background doesn't clearly cover
- Gives constructive, non-discouraging suggestions for closing those gaps — never suggests fabricating experience
- Generates 5 interview questions specific to that role, each with guidance on how to answer based on your actual background
- Copy the whole prep package to clipboard or download as a `.txt` file
- Recent analyses are saved to your browser automatically, no account needed
- Works on desktop and mobile

## The AI feature

When you submit the form, the job description and your background are sent to Google's Gemini model with a system prompt instructing it to analyze fit and produce a structured JSON response (fit summary, matched/missing keywords, gaps, and interview Q&A). The system prompt used is:

```
You are a career preparation assistant. You are given a job description and a candidate's background (their own summary of experience, skills, and education). Your job is to analyze the fit between them and produce a practical, honest preparation package.

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

Do not fabricate any fact, employer, metric, or credential not present in the candidate's own words. If their background is thin for this role, say so plainly and constructively rather than papering over it.
```

The response is generated fresh for each specific job description and background — it's not a fixed template. The code lives in `app/api/analyze-job/route.ts`.

## Tools and models used

- Next.js 14 (App Router) with TypeScript
- Google Gemini (`gemini-2.5-flash`) via `@google/genai`, called server-side so the API key is never exposed to the browser
- Plain CSS, no UI framework
- `localStorage` for saving recent analyses on-device
- Deployed on Vercel

## Screenshots

*(Add at least 3 screenshots after running the app: the empty form, a filled-in job description + background, and a generated prep package. Save them in an `assets/` folder and reference them like this:)*

```markdown
![Form](assets/screenshot-form.png)
![Generated prep package](assets/screenshot-result.png)
```

## Running it locally

Requirements: Node.js 18+, a free Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

```bash
git clone https://github.com/YOUR-USERNAME/joblens.git
cd joblens
npm install
cp .env.example .env.local
# paste your Gemini API key into .env.local
npm run dev
```

Open http://localhost:3000

## Deploying it yourself

1. Push the repo to your own public GitHub account
2. Go to vercel.com, sign in with GitHub, click Add New → Project, import this repo
3. Vercel auto-detects Next.js — don't change any build settings
4. Before deploying, add an environment variable: `GEMINI_API_KEY` with your key
5. Click Deploy. You'll get a live URL like `https://joblens-yourname.vercel.app`

## Project structure

```
joblens/
├── app/
│   ├── api/analyze-job/route.ts   # calls the Gemini API
│   ├── layout.tsx
│   ├── page.tsx                    # form, output, history
│   └── globals.css
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Notes on design decisions

- **No database.** Each person's job analyses only matter to them, so browser `localStorage` is a simpler, honest fit than adding a database.
- **The AI is instructed never to invent facts about the candidate.** It's explicitly told not to fabricate employers, metrics, or skills the user didn't mention, and to be constructive rather than discouraging when flagging gaps.
- **Server-side API calls only.** The Gemini API key lives only in server environment variables and is never sent to or exposed in the browser.

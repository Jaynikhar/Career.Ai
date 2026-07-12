import { env } from '../config/env.js';

// Uses Groq if configured (free tier, OpenAI-compatible), falls back to
// OpenAI if that's configured instead, otherwise returns a clearly-labeled
// mock response so the rest of the app is fully developable/demoable
// without live API spend.
export async function generateWithAI({ type, jobTitle, companyName, context }) {
  const provider = getProvider();
  if (!provider) {
    return mockOutput(type, jobTitle, companyName);
  }

  const prompts = {
    resume_edit: `Edit this LaTeX resume so it targets the ${jobTitle} role at ${companyName}. Only reorder/edit the summary, skills, and project sections for relevance. Return valid LaTeX only.\n\n${context}`,
    cover_letter: `Write a concise, specific cover letter for a ${jobTitle} role at ${companyName}, referencing the candidate's background below.\n\n${context}`,
    cold_email: `Draft a short, specific cold outreach email to a recruiter about a ${jobTitle} role at ${companyName}. Candidate background:\n\n${context}`,
    linkedin_referral: `Draft a short, polite LinkedIn message (under 100 words) asking a connection for a referral for the ${jobTitle} role at ${companyName}. It should be specific, not generic, and reference the candidate's background below. Do not include a subject line — this is a direct message, not an email.\n\n${context}`
  };

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompts[type] }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw Object.assign(new Error('AI provider error'), { status: 502, code: 'AI_PROVIDER_ERROR', details: errText });
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function getProvider() {
  if (env.groqApiKey) {
    return { key: env.groqApiKey, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' };
  }
  if (env.openaiApiKey) {
    return { key: env.openaiApiKey, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' };
  }
  return null;
}

function mockOutput(type, jobTitle, companyName) {
  const samples = {
    resume_edit: `% [MOCK OUTPUT — set GROQ_API_KEY or OPENAI_API_KEY for real generation]\n% Reordered sections for ${jobTitle} at ${companyName}: Summary, Skills, Projects (relevant project promoted to top).`,
    cover_letter: `[MOCK OUTPUT — set GROQ_API_KEY or OPENAI_API_KEY for real generation]\nDear Hiring Team,\n\nI'm writing to apply for the ${jobTitle} role at ${companyName}...`,
    cold_email: `[MOCK OUTPUT — set GROQ_API_KEY or OPENAI_API_KEY for real generation]\nSubject: ${jobTitle} role at ${companyName}\n\nHi — I noticed the ${jobTitle} opening and wanted to reach out directly...`,
    linkedin_referral: `[MOCK OUTPUT — set GROQ_API_KEY or OPENAI_API_KEY for real generation]\nHi! I saw you're at ${companyName} — I just applied for the ${jobTitle} role there and would really appreciate a referral if you think I'd be a fit. Happy to share my resume. Thanks either way!`
  };
  return samples[type];
}
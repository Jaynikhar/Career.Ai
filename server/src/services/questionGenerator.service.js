import { env } from '../config/env.js';

// Generates ORIGINAL practice questions for a company — never scraped or
// copied from other sites. Uses Groq if configured (free tier), falls back
// to OpenAI, otherwise returns mock output.
export async function generateCompanyQuestions({ companyName, category, type, count = 3 }) {
  const provider = getProvider();
  if (!provider) {
    return mockQuestions(companyName, type, count);
  }

  const prompt = `Write ${count} realistic, original ${typeLabel(type)} interview questions that a candidate might face at ${companyName}, a ${category} company. `
    + `Do not reproduce or paraphrase any specific real interview report you may have seen — write new representative questions in the typical style for this company's industry and size. `
    + `Respond with ONLY a raw JSON array, no markdown code fences, no explanation. Format: [{"content": "...", "difficulty": "Easy|Medium|Hard"}]`;

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw Object.assign(new Error('AI provider error'), { status: 502, code: 'AI_PROVIDER_ERROR', details: errText });
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '[]';
  return safeParseQuestions(raw, count);
}

function getProvider() {
  if (env.groqApiKey) {
    return {
      key: env.groqApiKey,
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile'
    };
  }
  if (env.openaiApiKey) {
    return {
      key: env.openaiApiKey,
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini'
    };
  }
  return null;
}

function typeLabel(type) {
  return { OA: 'online assessment', Technical: 'technical interview', HR: 'HR/behavioral interview' }[type] || 'interview';
}

function safeParseQuestions(raw, count) {
  try {
    // Strip markdown code fences some models add despite instructions not to.
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
    return list
      .filter((q) => q && q.content)
      .slice(0, count)
      .map((q) => ({ content: q.content, difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium' }));
  } catch {
    return [];
  }
}

function mockQuestions(companyName, type, count) {
  const base = {
    OA: `[MOCK — set GROQ_API_KEY or OPENAI_API_KEY for real generation] Sample OA-style problem for ${companyName}: implement a function that satisfies the given constraints in O(n log n).`,
    Technical: `[MOCK — set GROQ_API_KEY or OPENAI_API_KEY for real generation] Sample technical question for ${companyName}: design a system that handles the described scale requirements.`,
    HR: `[MOCK — set GROQ_API_KEY or OPENAI_API_KEY for real generation] Sample HR question for ${companyName}: tell us about a time you disagreed with a teammate and how you resolved it.`
  };
  return Array.from({ length: count }).map((_, i) => ({
    content: `${base[type]} (variant ${i + 1})`,
    difficulty: 'Medium'
  }));
}
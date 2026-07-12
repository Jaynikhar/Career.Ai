import { env } from '../config/env.js';


// Pulls live job postings from legitimate public job-board APIs — not
// scraping. Both are free, structured JSON endpoints intended for exactly
// this kind of aggregation.
//
// Remotive: https://remotive.com/api/remote-jobs — no key required.
// Arbeitnow: https://www.arbeitnow.com/api/job-board-api — no key required.

async function fetchRemotive(searchTerm) {
  const url = `https://remotive.com/api/remote-jobs${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j) => ({
    title: j.title,
    companyName: j.company_name,
    description: cleanDescription(j.description),
    applyUrl: j.url,
    location: j.candidate_required_location || 'Remote',
    jobType: mapJobType(j.job_type),
    tags: (j.tags || []).slice(0, 8),
    source: 'remotive',
    externalId: `remotive:${j.id}`
  }));
}

async function fetchArbeitnow() {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
  if (!res.ok) throw new Error(`Arbeitnow API error: ${res.status}`);
  const data = await res.json();
  return (data.data || []).map((j) => ({
    title: j.title,
    companyName: j.company_name,
    description: cleanDescription(j.description),
    applyUrl: j.url,
    location: j.location || (j.remote ? 'Remote' : ''),
    jobType: j.job_types?.includes('Internship') ? 'Internship' : 'Full-time',
    tags: (j.tags || []).slice(0, 8),
    source: 'arbeitnow',
    externalId: `arbeitnow:${j.slug}`
  }));
}

// Turns raw HTML from these feeds into clean, readable plain text:
// - decodes HTML entities (&amp;, &nbsp;, etc.) instead of leaving them raw
// - converts block-level tags into line breaks so paragraphs/bullets don't
//   get squashed into one run-on wall of text
// - collapses only *excess* whitespace, not all of it
function cleanDescription(html) {
  if (!html) return '';
  let text = html
    .replace(/<(p|div|br|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '');

  text = decodeHtmlEntities(text);

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
}

function decodeHtmlEntities(str) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“',
    '&mdash;': '—', '&ndash;': '–', '&hellip;': '…'
  };
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;|&rsquo;|&lsquo;|&rdquo;|&ldquo;|&mdash;|&ndash;|&hellip;/g, (m) => entities[m]);
}

function mapJobType(raw) {
  if (!raw) return 'Full-time';
  const t = raw.toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('contract')) return 'Contract';
  return 'Full-time';
}

// Rough English-language filter: counts what fraction of letters fall
// outside the basic Latin alphabet. Postings in German, Spanish, French,
// etc. use accented/extended characters heavily enough to trip this, while
// occasional accented words in English postings (e.g. "café") won't.
function isLikelyEnglish(text) {
  if (!text || text.length < 40) return true; // too short to judge, let it through
  const letters = text.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
  if (letters.length === 0) return true;
  const nonBasicLatin = letters.replace(/[a-zA-Z]/g, '');
  return nonBasicLatin.length / letters.length < 0.08;
}


function isRecognizedCompany(companyName) {
  if (!companyName) return false;
  const name = companyName.toLowerCase();
  return env.recognizedCompanies.some((allowed) => name.includes(allowed));
}

export async function fetchLiveJobs({ searchTerm } = {}) {
  const results = await Promise.allSettled([fetchRemotive(searchTerm), fetchArbeitnow()]);
  const jobs = [];
  for (const r of results) {
    if (r.status === 'fulfilled') jobs.push(...r.value);
    else console.error('Job feed provider failed:', r.reason?.message);
  }
  return jobs.filter((j) => isRecognizedCompany(j.companyName));
}
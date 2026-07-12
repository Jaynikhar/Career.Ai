// Pulls live job postings from legitimate public job-board APIs — not
// scraping.
//
// Remotive: https://remotive.com/api/remote-jobs — no key required.
// Arbeitnow: https://www.arbeitnow.com/api/job-board-api — no key required.
// Adzuna: https://developer.adzuna.com — free API key required, aggregates
// from a much broader set of sources than the two above, so it's more
// likely to surface listings from recognizable/larger companies.

import { env } from '../config/env.js';

async function fetchRemotive(searchTerm) {
  const url = `https://remotive.com/api/remote-jobs${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);
  const data = await res.json();
  const jobs = (data.jobs || []).map((j) => ({
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
  console.log(`[job-feed] Remotive returned ${jobs.length} raw jobs`);
  return jobs;
}

async function fetchArbeitnow() {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
  if (!res.ok) throw new Error(`Arbeitnow API error: ${res.status}`);
  const data = await res.json();
  const jobs = (data.data || []).map((j) => ({
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
  console.log(`[job-feed] Arbeitnow returned ${jobs.length} raw jobs`);
  return jobs;
}

async function fetchAdzuna(searchTerm) {
  if (!env.adzunaAppId || !env.adzunaAppKey) {
    console.log('[job-feed] Adzuna skipped — ADZUNA_APP_ID/ADZUNA_APP_KEY not set');
    return [];
  }
  const what = encodeURIComponent(searchTerm || 'software engineer');
  const url = `https://api.adzuna.com/v1/api/jobs/${env.adzunaCountry}/search/1?app_id=${env.adzunaAppId}&app_key=${env.adzunaAppKey}&results_per_page=50&what=${what}&content-type=application/json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);
  const data = await res.json();
  const jobs = (data.results || []).map((j) => ({
    title: j.title,
    companyName: j.company?.display_name || 'Unknown',
    description: cleanDescription(j.description),
    applyUrl: j.redirect_url,
    location: j.location?.display_name || '',
    jobType: j.contract_time === 'part_time' ? 'Contract' : 'Full-time',
    tags: [],
    source: 'adzuna',
    externalId: `adzuna:${j.id}`
  }));
  console.log(`[job-feed] Adzuna returned ${jobs.length} raw jobs`);
  return jobs;
}

function cleanDescription(html) {
  if (!html) return '';
  let text = html
    .replace(/<(p|div|br|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  text = decodeHtmlEntities(text);
  return text.split('\n').map((line) => line.trim()).filter(Boolean).join('\n').slice(0, 4000);
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

function isLikelyEnglish(text) {
  if (!text || text.length < 40) return true;
  const letters = text.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
  if (letters.length === 0) return true;
  const nonBasicLatin = letters.replace(/[a-zA-Z]/g, '');
  return nonBasicLatin.length / letters.length < 0.08;
}

// function isRecognizedCompany(companyName) {
//   if (env.recognizedCompanies === null) return true;
//   if (!companyName) return false;
//   const name = companyName.toLowerCase();
//   return env.recognizedCompanies.some((allowed) => name.includes(allowed));
// }

function isRecognizedCompany(companyName) {
  if (!companyName) return false;
  const name = companyName.toLowerCase();
  return env.recognizedCompanies.some((allowed) => name.includes(allowed));
}

export async function fetchLiveJobs({ searchTerm } = {}) {
  const results = await Promise.allSettled([
    fetchRemotive(searchTerm),
    fetchArbeitnow(),
    fetchAdzuna(searchTerm)
  ]);
  const rawJobs = [];
  for (const r of results) {
    if (r.status === 'fulfilled') rawJobs.push(...r.value);
    else console.error('[job-feed] provider failed:', r.reason?.message);
  }

  const afterEnglishFilter = rawJobs.filter((j) => isLikelyEnglish(j.title) && isLikelyEnglish(j.description));
  const afterCompanyFilter = afterEnglishFilter.filter((j) => isRecognizedCompany(j.companyName));

  console.log(`[job-feed] raw=${rawJobs.length} → after language filter=${afterEnglishFilter.length} → after recognized-company filter=${afterCompanyFilter.length}`);
  if (rawJobs.length > 0 && afterCompanyFilter.length === 0) {
    for (const providerName of ['remotive', 'arbeitnow', 'adzuna']) {
      const sample = [...new Set(rawJobs.filter((j) => j.source === providerName).slice(0, 8).map((j) => j.companyName))];
      if (sample.length > 0) console.log(`[job-feed] sample from ${providerName}: ${sample.join(', ')}`);
    }
  }

  return afterCompanyFilter;
}
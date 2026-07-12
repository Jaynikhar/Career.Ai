import Company from '../models/Company.js';
import Question from '../models/Question.js';
import { generateCompanyQuestions } from '../services/questionGenerator.service.js';
import { env } from '../config/env.js';

const TYPES = ['OA', 'Technical', 'HR'];

// Runs on a schedule (see scheduler.js). For each company, tops up each
// question type to a target count with newly AI-generated questions.
export async function generateQuestionsForAllCompanies() {
  const companies = await Company.find();
  const results = [];

  for (const company of companies) {
    for (const type of TYPES) {
      const existingCount = await Question.countDocuments({ companyId: company._id, type });
      const target = env.questionBankTargetPerType;
      const needed = Math.max(0, Math.min(target - existingCount, env.maxNewQuestionsPerRun));

      if (needed === 0) {
        results.push({ company: company.name, type, added: 0, reason: `already at target (${existingCount}/${target})` });
        continue;
      }

      try {
        const generated = await generateCompanyQuestions({
          companyName: company.name,
          category: company.category,
          type,
          count: needed
        });

        if (generated.length > 0) {
          await Question.insertMany(
            generated.map((q) => ({
              companyId: company._id,
              type,
              year: new Date().getFullYear(),
              content: q.content,
              difficulty: q.difficulty,
              source: 'ai_generated'
            }))
          );
          results.push({ company: company.name, type, added: generated.length });
        } else {
          results.push({ company: company.name, type, added: 0, reason: 'AI returned no parseable questions — check server logs' });
        }
      } catch (err) {
        console.error(`[question-gen] failed for ${company.name} (${type}):`, err.message);
        results.push({ company: company.name, type, added: 0, reason: err.message });
      }
    }
  }

  const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
  console.log(`[question-gen] companies=${companies.length} totalAdded=${totalAdded}`);
  return { totalAdded, details: results };
}
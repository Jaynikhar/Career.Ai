import Company from '../models/Company.js';
import Question from '../models/Question.js';

export async function listCompanies(req, res, next) {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const companies = await Company.find(filter).sort({ name: 1 });
    res.json({ companies });
  } catch (err) { next(err); }
}

export async function listQuestions(req, res, next) {
  try {
    const { type, year } = req.query;
    const filter = { companyId: req.params.id };
    if (type) filter.type = type;
    if (year) filter.year = Number(year);
    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) { next(err); }
}

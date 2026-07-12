import { connectDB } from '../config/db.js';
import Company from '../models/Company.js';
import Question from '../models/Question.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function run() {
  await connectDB();

  await Promise.all([
    Company.deleteMany({}),
    Question.deleteMany({}),
    Job.deleteMany({})
  ]);

  const companies = await Company.insertMany([
    { name: 'Google', category: 'FAANG', description: 'Search, cloud, and consumer products.' },
    { name: 'Amazon', category: 'FAANG', description: 'E-commerce and cloud infrastructure.' },
    { name: 'TCS', category: 'Service-based', description: 'IT services and consulting.' },
    { name: 'Infosys', category: 'Service-based', description: 'IT services and consulting.' },
    { name: 'Razorpay', category: 'Product-based', description: 'Payments infrastructure.' },
    { name: 'Nova Labs', category: 'Startup', description: 'Early-stage robotics startup.' }
  ]);

  await Question.insertMany(
    companies.flatMap((c) => ([
      { companyId: c._id, type: 'OA', year: 2025, content: `Sample OA question for ${c.name}.`, difficulty: 'Medium' },
      { companyId: c._id, type: 'Technical', year: 2025, content: `Sample technical interview question for ${c.name}.`, difficulty: 'Hard' },
      { companyId: c._id, type: 'HR', year: 2025, content: `Sample HR interview question for ${c.name}.`, difficulty: 'Easy' }
    ]))
  );

  await Job.insertMany([
    { title: 'Backend engineer', companyName: 'Nova Systems', description: 'Build and scale core services.', applyUrl: 'https://example.com/apply/1', location: 'Remote', jobType: 'Full-time' },
    { title: 'Frontend engineer', companyName: 'Hexawave', description: 'Own the customer-facing web app.', applyUrl: 'https://example.com/apply/2', location: 'Bengaluru', jobType: 'Full-time' },
    { title: 'Data analyst', companyName: 'Quarrystone', description: 'Turn product data into decisions.', applyUrl: 'https://example.com/apply/3', location: 'Hybrid', jobType: 'Full-time' },
    { title: 'Product manager intern', companyName: 'Fintrix', description: 'Support the payments product team.', applyUrl: 'https://example.com/apply/4', location: 'Remote', jobType: 'Internship' }
  ]);

  const adminEmail = 'jaynikhar61@gmail.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Jay@8307', 8);
    await User.create({ name: 'Admin', email: adminEmail, passwordHash, role: 'admin' });
    console.log(`Seeded admin user: ${adminEmail} / Jay@8307`);
  }

  console.log('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

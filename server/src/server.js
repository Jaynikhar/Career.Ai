import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startScheduler } from './jobs/scheduler.js';

connectDB()
  .then(() => {
    app.listen(env.port, () => console.log(`Server running on http://localhost:${env.port}`));
    if (env.enableScheduler) {
      startScheduler();
    } else {
      console.log('Scheduler disabled (set ENABLE_SCHEDULER=true in .env to auto-fetch jobs and generate questions).');
    }
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

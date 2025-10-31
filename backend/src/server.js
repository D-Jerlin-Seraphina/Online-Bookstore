import dotenv from 'dotenv';
import app from './app.js';
import connectDatabase from './config/db.js';
import { startLendingReminderJob } from './services/reminderService.js';

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  startLendingReminderJob();
};

startServer();

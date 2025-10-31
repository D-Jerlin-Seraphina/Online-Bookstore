import Lending from '../models/Lending.js';

const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // hourly
const REMINDER_THRESHOLD_HOURS = 24;

export const startLendingReminderJob = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const threshold = new Date(now.getTime() + REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000);
      const lendings = await Lending.find({
        status: 'borrowed',
        reminderSent: false,
        dueDate: { $lte: threshold, $gte: now },
      })
        .populate('user', 'email name')
        .populate('book', 'title');

      for (const lending of lendings) {
        console.log(
          `Reminder: ${lending.user.name} (${lending.user.email}) should return book ${lending.book.title}`
        );
        lending.reminderSent = true;
        await lending.save();
      }
    } catch (error) {
      console.error('Failed to process lending reminders:', error.message);
    }
  }, REMINDER_INTERVAL_MS);
};

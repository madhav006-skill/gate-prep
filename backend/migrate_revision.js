// Migration: Convert old reason format to new format
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('revisionquestions');

  // Rename 'Wrong' -> 'Wrong Answer'
  const wrongRes = await collection.updateMany(
    { reason: 'Wrong' },
    { $set: {
      reason: 'Wrong Answer',
      status: 'Due',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      nextIntervalDays: 1
    }}
  );
  console.log(`Updated ${wrongRes.modifiedCount} 'Wrong' -> 'Wrong Answer'`);

  // Rename 'Slow' -> 'Slow but Correct'
  const slowRes = await collection.updateMany(
    { reason: 'Slow' },
    { $set: {
      reason: 'Slow but Correct',
      status: 'Upcoming',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      nextIntervalDays: 2
    }}
  );
  console.log(`Updated ${slowRes.modifiedCount} 'Slow' -> 'Slow but Correct'`);

  // Rename 'Bookmarked' -> 'Marked for Review'
  const bookRes = await collection.updateMany(
    { reason: 'Bookmarked' },
    { $set: {
      reason: 'Marked for Review',
      status: 'Due',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      nextIntervalDays: 1
    }}
  );
  console.log(`Updated ${bookRes.modifiedCount} 'Bookmarked' -> 'Marked for Review'`);

  await mongoose.disconnect();
  console.log('Migration complete!');
}

migrate().catch(console.error);

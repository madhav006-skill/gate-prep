require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const MockTest = require('./src/models/MockTest');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Test [1] and [2] are exact duplicates (same title, same time ~11 seconds apart)
  // Delete Test [1] (older one, 20:43:49)
  // Also delete its 65 duplicate questions

  const testToDelete = await MockTest.findById('6a19ad2d63e7d870e7ae0f71');
  console.log('Test to delete:', testToDelete.title, '- Questions:', testToDelete.questions.length);

  // Get question IDs from duplicate test
  const qIds = testToDelete.questions.map(q => q.question);
  
  // Delete those 65 questions
  const qDel = await Question.deleteMany({ _id: { $in: qIds } });
  console.log(`Deleted ${qDel.deletedCount} duplicate questions`);

  // Delete the duplicate test
  await MockTest.findByIdAndDelete('6a19ad2d63e7d870e7ae0f71');
  console.log('Deleted duplicate test');

  // Verify
  const totalTests = await MockTest.countDocuments();
  const totalQs = await Question.countDocuments();
  console.log(`\nFinal state: ${totalTests} tests, ${totalQs} questions`);

  const remaining = await MockTest.find({}).select('title questions createdAt');
  remaining.forEach(t => {
    console.log(`  - ${t.title} (${t.questions.length} questions)`);
  });

  process.exit(0);
});

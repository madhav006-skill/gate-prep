require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Question = require('./src/models/Question');
const { classifyQuestions } = require('./src/utils/aiClassifier');

async function reclassifyExisting() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    let remaining = true;
    while (remaining) {
      const questionsToUpdate = await Question.find({
        $or: [
          { topic: 'General' },
          { subject: 'CS' },
          { subject: 'General Computer Science' },
          { topic: 'Miscellaneous' }
        ]
      });
      console.log(`\nFound ${questionsToUpdate.length} questions that need classification.`);
      
      if (questionsToUpdate.length === 0) {
        remaining = false;
        break;
      }

      // Process in large batches of 20 to use fewer API requests
      const batchSize = 20;
      for (let i = 0; i < questionsToUpdate.length; i += batchSize) {
        const batch = questionsToUpdate.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(questionsToUpdate.length / batchSize)}...`);
        
        try {
          const classifications = await classifyQuestions(batch, 'CS');
          
          for (let j = 0; j < batch.length; j++) {
            const doc = batch[j];
            const classification = classifications.find(c => c.index === j);
            
            if (classification && classification.topic !== 'General' && classification.subject !== 'CS') {
              console.log(`Updated ${doc._id} -> ${classification.subject} | ${classification.topic}`);
              doc.subject = classification.subject;
              doc.topic = classification.topic;
              await doc.save();
            }
          }
        } catch (e) {
          console.error("Batch failed, will retry in next loop iteration.");
        }
        
        // Massive delay (65 seconds) to guarantee we stay under the 15 requests/minute Gemini limit
        console.log("Waiting 65 seconds for API quota cooldown...");
        await new Promise(r => setTimeout(r, 65000));
      }
    }

    console.log('\nAll questions successfully reclassified!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

reclassifyExisting();

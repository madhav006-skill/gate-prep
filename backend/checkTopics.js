require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./src/models/Question');

async function checkTopics() {
  await mongoose.connect(process.env.MONGODB_URI);
  const questions = await Question.find().select('subject topic').limit(20);
  console.log("Sample Questions:");
  questions.forEach(q => console.log(`- Subject: ${q.subject}, Topic: ${q.topic}`));
  
  const distinctTopics = await Question.distinct('topic');
  console.log("\nDistinct Topics in DB:", distinctTopics);
  
  mongoose.disconnect();
}
checkTopics();

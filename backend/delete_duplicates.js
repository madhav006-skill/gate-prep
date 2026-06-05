require('dotenv').config({path:'.env'}); 
const mongoose = require('mongoose'); 
const Question = require('./src/models/Question'); 

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const duplicates = await Question.aggregate([ 
    { $group: { _id: '$questionHtml', count: { $sum: 1 }, ids: { $push: '$_id' } } }, 
    { $match: { count: { $gt: 1 } } } 
  ]); 
  
  console.log('Duplicate groups found:', duplicates.length); 
  
  let deletedCount = 0; 
  for (const d of duplicates) {
    if (d._id === null) {
      // If it's a completely blank question, delete all of them
      const res = await Question.deleteMany({ _id: { $in: d.ids } });
      deletedCount += res.deletedCount;
      console.log(`Deleted ${res.deletedCount} completely blank questions.`);
    } else {
      // Keep the first one, delete the rest
      const idsToDelete = d.ids.slice(1);
      const res = await Question.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += res.deletedCount;
      console.log(`- Kept 1, deleted ${res.deletedCount} copies of:`, (d._id || '').substring(0, 50) + '...');
    }
  }
  console.log('Total duplicate/blank questions DELETED:', deletedCount); 
  mongoose.disconnect(); 
});

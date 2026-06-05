require('dotenv').config({path:'.env'}); 
const mongoose = require('mongoose'); 
const Question = require('./src/models/Question'); 

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const duplicates = await Question.aggregate([ 
    { $group: { _id: '$questionHtml', count: { $sum: 1 }, ids: { $push: '$_id' } } }, 
    { $match: { count: { $gt: 1 } } } 
  ]); 
  console.log('Duplicate groups found:', duplicates.length); 
  
  let totalDups = 0; 
  duplicates.forEach(d => { 
    totalDups += d.count - 1; 
    console.log(`- Duplicate content (x${d.count}):`, d._id.substring(0, 100) + '...');
  }); 
  console.log('Total duplicate extra questions:', totalDups); 
  mongoose.disconnect(); 
});

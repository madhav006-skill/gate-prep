require('dotenv').config();
const mongoose = require('mongoose');
const seedDatabase = require('./src/config/seedData');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await seedDatabase();
    console.log('Seeding finished, closing connection.');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

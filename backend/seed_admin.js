require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const adminEmail = 'admin@gateprep.com';
  
  // Check if admin exists
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    admin = new User({
      name: 'System Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created successfully');
  } else {
    // Make sure password is correct (update it)
    admin.password = 'admin123';
    admin.role = 'admin';
    await admin.save();
    console.log('Admin user updated successfully');
  }

  process.exit(0);
});

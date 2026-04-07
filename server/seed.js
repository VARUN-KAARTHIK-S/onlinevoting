const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Constituency = require('./models/Constituency');
const Voter = require('./models/Voter');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // 1. Add Default Constituency: PALLADAM
    const existingCons = await Constituency.findOne({ name: 'PALLADAM' });
    if (!existingCons) {
      await Constituency.create({
        name: 'PALLADAM',
        type: 'State',
        state: 'Tamil Nadu',
        district: 'Tiruppur'
      });
      console.log('Default Constituency [PALLADAM] created.');
    } else {
      console.log('Constituency [PALLADAM] already exists.');
    }

    // 2. Add Default Admin Account
    const adminEmail = 'admin@onlinevoting.com';
    const existingAdmin = await Voter.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Voter.create({
        name: 'System Administrator',
        email: adminEmail,
        phoneNumber: '9999999999',
        aadhaarNumber: '111122223333',
        constituency: 'PALLADAM',
        password: 'adminpassword123',
        role: 'admin',
        isApproved: true
      });
      console.log('Default Admin Account created:');
      console.log('Email: ' + adminEmail);
      console.log('Password: adminpassword123');
    } else {
      console.log('Admin account already exists.');
    }

    console.log('Seeding completed successfully.');
    process.exit();
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Problem from '../models/Problem.js';

dotenv.config();

const check = async () => {
  try {
    await connectDB();
    console.log('Migration trigger completed.');
    
    const count = await Problem.countDocuments({});
    console.log('Total problems in database:', count);
    
    
    const indexes = await Problem.collection.indexes();
    console.log('Active Indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
};

check();

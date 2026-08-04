import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clear = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');
  const collections = await mongoose.connection.db.listCollections({ name: 'analyticscaches' }).toArray();
  if (collections.length > 0) {
    await mongoose.connection.db.dropCollection('analyticscaches');
    console.log('Dropped analyticscaches collection.');
  } else {
    console.log('analyticscaches collection does not exist.');
  }
  await mongoose.connection.close();
};

clear();

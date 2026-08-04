import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../models/Problem.js';

dotenv.config();

const cleanSeedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/algomind');
    console.log('[Cleaner] MongoDB Connected');

    const seedTitles = [
      'Two Sum', 'Valid Parentheses', 'Merge Two Sorted Lists', 'Best Time to Buy and Sell Stock',
      'Valid Palindrome', 'Invert Binary Tree', 'Linked List Cycle', 'Binary Search', 'Flood Fill',
      'Climbing Stairs', 'Subarray with Given Sum', 'Missing Number in Array', 'Kadanes Algorithm',
      'Sort an Array of 0s, 1s and 2s', 'Detect Loop in Linked List', 'Find Triplet with Zero Sum',
      'Longest Common Subsequence', 'Container With Most Water', 'Longest Palindromic Substring',
      'Course Schedule', 'Merge Intervals', 'Watermelon', 'Way Too Long Words', 'Theatre Square',
      'Next Round', 'Median of Two Sorted Arrays', 'N-Queens', 'Edit Distance', 'Trapping Rain Water'
    ];

    console.log(`[Cleaner] Checking for mock seed problems matching ${seedTitles.length} titles...`);
    const deleteResult = await Problem.deleteMany({ title: { $in: seedTitles } });
    
    console.log(`[Cleaner] Successfully deleted ${deleteResult.deletedCount} seed problems from database.`);
    
    await mongoose.connection.close();
    console.log('[Cleaner] MongoDB Connection Closed.');
  } catch (err) {
    console.error('[Cleaner Error]:', err);
  }
};

cleanSeedData();

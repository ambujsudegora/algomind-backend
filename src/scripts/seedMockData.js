import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { extractProblemId } from '../utils/revisionHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('[Seeder Error] MONGO_URI is missing in environment variables.');
  process.exit(1);
}


const getIntervalDays = (difficulty, step) => {
  const diff = (difficulty || 'Medium').toLowerCase();
  if (diff === 'easy') {
    const intervals = { 1: 2, 2: 5, 3: 12, 4: 30 };
    return intervals[step] || 30;
  }
  if (diff === 'hard') {
    const intervals = { 1: 1, 2: 2, 3: 4, 4: 8 };
    return intervals[step] || 8;
  }
  const intervals = { 1: 1, 2: 3, 3: 7, 4: 15 };
  return intervals[step] || 15;
};


const mockProblemTemplates = [
  { title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', category: 'Arrays', url: 'https://leetcode.com/problems/two-sum/' },
  { title: 'Valid Parentheses', platform: 'LeetCode', difficulty: 'Easy', category: 'Strings', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { title: 'Merge Two Sorted Lists', platform: 'LeetCode', difficulty: 'Easy', category: 'Linked Lists', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { title: 'Best Time to Buy and Sell Stock', platform: 'LeetCode', difficulty: 'Easy', category: 'Arrays', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { title: 'Valid Palindrome', platform: 'LeetCode', difficulty: 'Easy', category: 'Strings', url: 'https://leetcode.com/problems/valid-palindrome/' },
  { title: 'Invert Binary Tree', platform: 'LeetCode', difficulty: 'Easy', category: 'Trees', url: 'https://leetcode.com/problems/invert-binary-tree/' },
  { title: 'Linked List Cycle', platform: 'LeetCode', difficulty: 'Easy', category: 'Linked Lists', url: 'https://leetcode.com/problems/linked-list-cycle/' },
  { title: 'Binary Search', platform: 'LeetCode', difficulty: 'Easy', category: 'Sorting & Searching', url: 'https://leetcode.com/problems/binary-search/' },
  { title: 'Flood Fill', platform: 'LeetCode', difficulty: 'Easy', category: 'Graphs', url: 'https://leetcode.com/problems/flood-fill/' },
  { title: 'Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/climbing-stairs/' },
  
  { title: 'Subarray with Given Sum', platform: 'GeeksforGeeks', difficulty: 'Medium', category: 'Arrays', url: 'https://practice.geeksforgeeks.org/problems/subarray-with-given-sum/' },
  { title: 'Missing Number in Array', platform: 'GeeksforGeeks', difficulty: 'Easy', category: 'Arrays', url: 'https://practice.geeksforgeeks.org/problems/missing-number-in-array/' },
  { title: 'Kadanes Algorithm', platform: 'GeeksforGeeks', difficulty: 'Medium', category: 'Arrays', url: 'https://practice.geeksforgeeks.org/problems/kadanes-algorithm/' },
  { title: 'Sort an Array of 0s, 1s and 2s', platform: 'GeeksforGeeks', difficulty: 'Medium', category: 'Sorting & Searching', url: 'https://practice.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s/' },
  { title: 'Detect Loop in Linked List', platform: 'GeeksforGeeks', difficulty: 'Medium', category: 'Linked Lists', url: 'https://practice.geeksforgeeks.org/problems/detect-loop-in-linked-list/' },
  { title: 'Find Triplet with Zero Sum', platform: 'GeeksforGeeks', difficulty: 'Medium', category: 'Arrays', url: 'https://practice.geeksforgeeks.org/problems/find-triplets-with-zero-sum/' },
  { title: 'Longest Common Subsequence', platform: 'LeetCode', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/longest-common-subsequence/' },
  { title: 'Container With Most Water', platform: 'LeetCode', difficulty: 'Medium', category: 'Arrays', url: 'https://leetcode.com/problems/container-with-most-water/' },
  { title: 'Longest Palindromic Substring', platform: 'LeetCode', difficulty: 'Medium', category: 'Strings', url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
  { title: 'Course Schedule', platform: 'LeetCode', difficulty: 'Medium', category: 'Graphs', url: 'https://leetcode.com/problems/course-schedule/' },
  { title: 'Merge Intervals', platform: 'LeetCode', difficulty: 'Medium', category: 'Arrays', url: 'https://leetcode.com/problems/merge-intervals/' },
  
  { title: 'Watermelon', platform: 'Codeforces', difficulty: 'Easy', category: 'General', url: 'https://codeforces.com/problemset/problem/4/A' },
  { title: 'Way Too Long Words', platform: 'Codeforces', difficulty: 'Easy', category: 'Strings', url: 'https://codeforces.com/problemset/problem/71/A' },
  { title: 'Theatre Square', platform: 'Codeforces', difficulty: 'Medium', category: 'General', url: 'https://codeforces.com/problemset/problem/1/A' },
  { title: 'Next Round', platform: 'Codeforces', difficulty: 'Easy', category: 'General', url: 'https://codeforces.com/problemset/problem/158/A' },
  
  { title: 'Median of Two Sorted Arrays', platform: 'LeetCode', difficulty: 'Hard', category: 'Arrays', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
  { title: 'N-Queens', platform: 'LeetCode', difficulty: 'Hard', category: 'Backtracking', url: 'https://leetcode.com/problems/n-queens/' },
  { title: 'Edit Distance', platform: 'LeetCode', difficulty: 'Hard', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/edit-distance/' },
  { title: 'Trapping Rain Water', platform: 'LeetCode', difficulty: 'Hard', category: 'Arrays', url: 'https://leetcode.com/problems/trapping-rain-water/' }
];

const seed = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] MongoDB Connected.');

    
    let email = '';
    const emailArg = process.argv.find(arg => arg.startsWith('--email='));
    if (emailArg) {
      email = emailArg.split('=')[1].trim();
    }

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne(); 
    }

    if (!user) {
      console.error('[Seeder Error] No user account found in database. Please register a user first on the dashboard website.');
      process.exit(1);
    }

    console.log(`[Seeder] Seeding mock data for user: ${user.username} (${user.email})`);

    
    const deleteResult = await Problem.deleteMany({ user: user._id });
    console.log(`[Seeder] Erased ${deleteResult.deletedCount} existing problems for this user.`);

    
    const createdProblems = [];
    const now = new Date();

    for (let i = 0; i < mockProblemTemplates.length; i++) {
      const template = mockProblemTemplates[i];
      
      
      const dayOffset = i % 14; 
      const solvedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, 10 + (i % 6), 15);
      
      
      const step = (i % 4) + 1;

      
      let status = 'Completed';
      let nextRevisionDate = new Date(solvedAt);

      if (i % 5 === 0) {
        
        status = 'Pending';
        
        nextRevisionDate = new Date(now.getTime() - 3600 * 1000); 
      } else {
        
        const intervalDays = getIntervalDays(template.difficulty, step);
        nextRevisionDate.setDate(nextRevisionDate.getDate() + intervalDays);
        
        
        
        if (nextRevisionDate <= now) {
          nextRevisionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2 + (i % 5));
        }
      }

      const problem = new Problem({
        user: user._id,
        problemId: extractProblemId(template.url, template.platform),
        title: template.title,
        platform: template.platform,
        url: template.url,
        difficulty: template.difficulty,
        category: template.category,
        revisionStep: step,
        nextRevisionDate,
        status,
        solvedAt,
        createdAt: solvedAt
      });

      await problem.save();
      createdProblems.push(problem);
    }

    console.log(`[Seeder] Inserted ${createdProblems.length} mock problems successfully.`);

    
    user.xp = 3150; 
    user.level = 4;
    user.streak = 8;
    user.lastActive = new Date();
    await user.save();

    console.log(`[Seeder] Updated profile stats for: ${user.username} (Level: ${user.level}, XP: ${user.xp}, Streak: ${user.streak})`);
    console.log('[Seeder] Data seeding completed successfully.');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Critical Error]:', error);
    process.exit(1);
  }
};

seed();

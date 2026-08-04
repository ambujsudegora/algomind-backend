import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../models/Problem.js';
import Notes from '../models/Notes.js';
import RevisionHistory from '../models/RevisionHistory.js';
import SubmissionService from '../services/SubmissionService.js';
import NotesService from '../services/NotesService.js';

dotenv.config();

const runTests = async () => {
  try {
    console.log('[Test Suite] Connecting to test database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/algomind');
    console.log('[Test Suite] MongoDB Connected.');

    const userId = new mongoose.Types.ObjectId('6a4d44a3fb51ddd6f02b428e');
    const mockProblemData = {
      title: 'Range Sum Query - Mutable',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/range-sum-query-mutable/',
      difficulty: 'Medium',
      category: 'Segment Trees',
      code: 'class NumArray { ... }',
      intuition: 'Use a Segment Tree to support log(N) updates and queries.',
      honestyMetrics: {
        timeTakenSeconds: 360,
        honestyScore: 90,
        tabSwitchesCount: 0
      }
    };

    console.log('[Test Suite] 1. Cleanup previous test run data...');
    const testProblemId = 'range-sum-query-mutable';
    await Problem.deleteOne({ user: userId, problemId: testProblemId });
    await Notes.deleteOne({ userId, problemId: testProblemId });
    await RevisionHistory.deleteMany({ userId, problemId: testProblemId });

    console.log('[Test Suite] 2. Run solve submission...');
    const res1 = await SubmissionService.addSolvedProblem(userId, mockProblemData);
    console.log(`[Test Suite] Initial solve submission processed. Duplicate? ${res1.isDuplicate}`);

    
    const problemRecord = await Problem.findOne({ user: userId, problemId: testProblemId });
    console.log('[Test Suite] Problem document exists in DB:', !!problemRecord);
    console.log('[Test Suite] Problem document contains NO history array:', !problemRecord.history);

    
    const notesRecord = await Notes.findOne({ userId, problemId: testProblemId });
    console.log('[Test Suite] Notes document exists in DB:', !!notesRecord);
    console.log('[Test Suite] Notes document intuition matches:', notesRecord.conceptNotes === mockProblemData.intuition);

    
    const historyCount = await RevisionHistory.countDocuments({ userId, problemId: testProblemId });
    console.log('[Test Suite] RevisionHistory records created count:', historyCount);

    console.log('[Test Suite] 3. Test duplicate check (within 2 minutes)...');
    const res2 = await SubmissionService.addSolvedProblem(userId, mockProblemData);
    console.log(`[Test Suite] Duplicate solve submission processed. Ignored? ${res2.isDuplicate}`);
    
    const finalHistoryCount = await RevisionHistory.countDocuments({ userId, problemId: testProblemId });
    console.log('[Test Suite] RevisionHistory records count remains unchanged:', finalHistoryCount === 1);

    console.log('[Test Suite] All integration tests executed successfully!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('[Test Suite Error]:', err);
    process.exit(1);
  }
};

runTests();

import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import { extractProblemId } from '../utils/revisionHelpers.js';

const migrateAndCleanupDuplicates = async () => {
  try {
    console.log('[Migration] Starting database migration & duplicate cleanup...');
    
    
    const allProblems = await Problem.find({}).lean();
    console.log(`[Migration] Found ${allProblems.length} total problems.`);
    
    let updatedCount = 0;
    for (const problem of allProblems) {
      let modified = false;
      let updateFields = {};
      
      
      if (problem.honestyMetrics && typeof problem.honestyMetrics.honestyScore === 'string') {
        const parsed = parseInt(problem.honestyMetrics.honestyScore, 10);
        updateFields['honestyMetrics.honestyScore'] = isNaN(parsed) ? 100 : parsed;
        modified = true;
      }
      
      if (!problem.problemId) {
        updateFields.problemId = extractProblemId(problem.url, problem.platform);
        modified = true;
      }
      
      if (modified) {
        await Problem.updateOne({ _id: problem._id }, { $set: updateFields });
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`[Migration] Populated and sanitized ${updatedCount} problems.`);
    }

    
    const groups = await Problem.aggregate([
      {
        $group: {
          _id: { user: '$user', platform: '$platform', problemId: '$problemId' },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`[Migration] Found ${groups.length} groups of duplicate problems.`);

    for (const group of groups) {
      const { user, platform, problemId } = group._id;
      const sortedDocs = group.docs.sort((a, b) => {
        const subA = a.submissionCount || 1;
        const subB = b.submissionCount || 1;
        return subB - subA;
      });

      const keepDoc = sortedDocs[0];
      const deleteIds = sortedDocs.slice(1).map(d => d._id);

      console.log(`[Migration] Consolidating duplicates for user: ${user}, platform: ${platform}, problemId: ${problemId}`);
      
      let totalSubmissions = keepDoc.submissionCount || 1;
      let totalRevisions = keepDoc.revisionCount || 1;
      let totalManualRevisions = keepDoc.manualRevisionCount || 0;
      let mergedHistory = keepDoc.history || [];
      let mergedRecallHistory = keepDoc.activeRecallHistory || [];

      for (let i = 1; i < sortedDocs.length; i++) {
        const doc = sortedDocs[i];
        totalSubmissions += doc.submissionCount || 1;
        totalRevisions += doc.revisionCount || 1;
        totalManualRevisions += doc.manualRevisionCount || 0;
        if (doc.history) {
          mergedHistory = mergedHistory.concat(doc.history);
        }
        if (doc.activeRecallHistory) {
          mergedRecallHistory = mergedRecallHistory.concat(doc.activeRecallHistory);
        }
      }

      await Problem.updateOne(
        { _id: keepDoc._id },
        {
          $set: {
            submissionCount: totalSubmissions,
            revisionCount: totalRevisions,
            manualRevisionCount: totalManualRevisions,
            history: mergedHistory,
            activeRecallHistory: mergedRecallHistory,
            status: keepDoc.status || 'Completed'
          }
        }
      );

      await Problem.deleteMany({ _id: { $in: deleteIds } });
    }

    
    try {
      await Problem.collection.dropIndexes();
      console.log('[Migration] Dropped old indexes.');
    } catch (indexErr) {
      console.log('[Migration] Index drop warning:', indexErr.message);
    }
    
    await Problem.syncIndexes();
    console.log('[Migration] Successfully synchronized unique database indexes.');
  } catch (err) {
    console.error('[Migration Error]:', err);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/algomind');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    
    await migrateAndCleanupDuplicates();
  } catch (error) {
    console.error(`[Database] Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

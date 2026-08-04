import mongoose from 'mongoose';
import ProblemRepository from '../repositories/ProblemRepository.js';
import RevisionHistoryRepository from '../repositories/RevisionHistoryRepository.js';
import SchedulerService from './SchedulerService.js';
import eventEmitter from '../events/eventEmitter.js';

class RevisionService {
  async performManualRevision(userId, problemId, action) {
    let session = null;
    let useTransaction = false;
    try {
      const adminDb = mongoose.connection.db.admin();
      const status = await adminDb.command({ isMaster: 1 });
      if (status.setName || status.ismaster) {
        useTransaction = true;
      }
    } catch (err) {
      
    }

    if (useTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      const problem = await ProblemRepository.findOne({ user: userId, _id: problemId });
      if (!problem) {
        throw new Error('Problem not found');
      }

      problem.manualRevisionCount += 1;
      let nextStep = problem.revisionStep;

      if (action === 'recalled') {
        nextStep = Math.min(nextStep + 1, 4);
        problem.status = 'Completed';
      } else if (action === 'forgot') {
        nextStep = 1;
        problem.status = 'Pending';
      } else {
        throw new Error('Invalid action. Must be recalled or forgot');
      }

      problem.revisionStep = nextStep;
      
      const honestyScore = problem.honestyMetrics?.honestyScore ?? 100;
      problem.nextRevisionDate = SchedulerService.calculateNextRevisionDate(problem.difficulty, nextStep, honestyScore);

      
      problem.forgetProbability = SchedulerService.calculateForgetProbability(problem, action);
      problem.learningState = SchedulerService.determineLearningState(problem);

      const savedProblem = await problem.save({ session });

      
      await RevisionHistoryRepository.create({
        userId,
        problemId: problem.problemId,
        submissionType: 'Manual',
        honestyScore,
        forgetProbability: savedProblem.forgetProbability,
        timeSpent: 0,
        revisionResult: action === 'recalled' ? 'Recalled' : 'Forgot',
        schedulerVersion: 'v1.0.0'
      }, { session });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      
      eventEmitter.emit('submission.accepted', { userId, problem: savedProblem, isManual: true, action });

      return savedProblem;
    } catch (err) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }
  }
}

export default new RevisionService();

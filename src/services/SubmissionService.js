import mongoose from 'mongoose';
import ProblemRepository from '../repositories/ProblemRepository.js';
import RevisionHistoryRepository from '../repositories/RevisionHistoryRepository.js';
import NotesRepository from '../repositories/NotesRepository.js';
import DuplicateDetectionService from './DuplicateDetectionService.js';
import SchedulerService from './SchedulerService.js';
import eventEmitter from '../events/eventEmitter.js';
import { getAICodeReview } from '../utils/aiService.js';
import { extractProblemId } from '../utils/revisionHelpers.js';

class SubmissionService {
  async addSolvedProblem(userId, data) {
    const { title, platform, url, difficulty, category, honestyMetrics, code, intuition, topic } = data;
    const problemId = data.problemId || extractProblemId(url, platform);
    const codeHash = DuplicateDetectionService.generateCodeHash(code);
    const finalCategory = (category && category !== 'General') ? category : (topic || 'General');

    
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
      let problem = await ProblemRepository.findOne({ user: userId, platform, problemId });
      const incomingScore = honestyMetrics && honestyMetrics.honestyScore !== undefined ? honestyMetrics.honestyScore : 100;
      let resultProblem;
      let isDuplicate = false;

      const isNoteOnly = data.isNoteOnly || (!data.code && (data.intuition || data.topic));

      if (problem) {
        if (isNoteOnly) {
          
          if (finalCategory) problem.category = finalCategory;
          problem.updatedAt = new Date();
          resultProblem = await problem.save({ session });
        } else {
          
          isDuplicate = DuplicateDetectionService.isDuplicate(problem.lastSolvedAt || problem.solvedAt, codeHash, problem.codeHash);
          if (isDuplicate) {
            if (session) {
              await session.commitTransaction();
              session.endSession();
            }
            return { problem, isDuplicate: true };
          }

          
          const timeDiffMs = Date.now() - new Date(problem.lastSolvedAt || problem.solvedAt || new Date()).getTime();
          const isRealRevision = timeDiffMs >= 16 * 60 * 60 * 1000;
          
          problem.submissionCount += 1;
          if (isRealRevision) {
            problem.revisionCount += 1;
          }

        
        const prevScore = problem.honestyMetrics?.honestyScore ?? 100;
        let trend = 'SAME';
        let difference = 0;
        if (incomingScore > prevScore) {
          trend = 'UP';
          difference = incomingScore - prevScore;
        } else if (incomingScore < prevScore) {
          trend = 'DOWN';
          difference = prevScore - incomingScore;
        }

        problem.difficulty = difficulty;
        if (finalCategory) problem.category = finalCategory;
        problem.lastSolvedAt = new Date();
        problem.updatedAt = new Date();
        problem.codeHash = codeHash;
        problem.revisionStep = Math.min(problem.revisionStep + 1, 4);
        
        problem.nextRevisionDate = SchedulerService.calculateNextRevisionDate(difficulty, problem.revisionStep, incomingScore);
        problem.status = 'Completed';
        problem.solvedAt = new Date();

        problem.honestyMetrics = {
          hintsUsed: honestyMetrics?.hintsUsed || false,
          solutionClicked: honestyMetrics?.solutionClicked || false,
          tabSwitchesCount: honestyMetrics?.tabSwitchesCount || 0,
          codePasted: honestyMetrics?.codePasted || false,
          timeTakenSeconds: honestyMetrics?.timeTakenSeconds || 0,
          honestyScore: incomingScore,
          trend,
          difference
        };

        
        problem.forgetProbability = SchedulerService.calculateForgetProbability(problem);
        problem.learningState = SchedulerService.determineLearningState(problem);

        resultProblem = await problem.save({ session });
        }
      } else {
        
        const nextRevisionDate = SchedulerService.calculateNextRevisionDate(difficulty, 1, incomingScore);
        
        const initialProblem = {
          user: userId,
          problemId,
          title,
          platform,
          url,
          difficulty,
          category: finalCategory,
          submissionCount: 1,
          revisionCount: 1,
          manualRevisionCount: 0,
          forgetProbability: 0,
          learningState: 'NEW',
          codeHash,
          lastSolvedAt: new Date(),
          updatedAt: new Date(),
          revisionStep: 1,
          nextRevisionDate,
          status: 'Completed',
          solvedAt: new Date(),
          honestyMetrics: {
            hintsUsed: honestyMetrics?.hintsUsed || false,
            solutionClicked: honestyMetrics?.solutionClicked || false,
            tabSwitchesCount: honestyMetrics?.tabSwitchesCount || 0,
            codePasted: honestyMetrics?.codePasted || false,
            timeTakenSeconds: honestyMetrics?.timeTakenSeconds || 0,
            honestyScore: incomingScore,
            trend: 'SAME',
            difference: 0
          }
        };

        
        initialProblem.forgetProbability = SchedulerService.calculateForgetProbability(initialProblem);
        initialProblem.learningState = SchedulerService.determineLearningState(initialProblem);

        const createdDoc = await ProblemRepository.create(initialProblem, { session });
        resultProblem = createdDoc;
      }

      
      const notes = await NotesRepository.findOrCreate(userId, problemId, { session });
      if (intuition || topic) {
        if (!notes.logicEntries) notes.logicEntries = [];
        notes.logicEntries.push({
          topic: topic || finalCategory || 'General',
          logic: intuition || 'Problem solved.',
          date: new Date()
        });
        if (intuition) {
          notes.conceptNotes = intuition;
        }
        await notes.save({ session });
      }

      
      await RevisionHistoryRepository.create({
        userId,
        problemId,
        submissionType: 'Submission',
        honestyScore: incomingScore,
        forgetProbability: resultProblem.forgetProbability,
        timeSpent: honestyMetrics?.timeTakenSeconds || 0,
        codeHash,
        revisionResult: 'Passed',
        schedulerVersion: 'v1.0.0'
      }, { session });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      
      eventEmitter.emit('submission.accepted', { userId, problem: resultProblem, isManual: false });

      // Generate AI Code Review (non-blocking, after DB commit)
      let aiReview = null;
      if (code && !isNoteOnly) {
        try {
          aiReview = await getAICodeReview(title, difficulty, finalCategory, code);
        } catch (aiErr) {
          console.warn('[SubmissionService] AI Code Review generation failed:', aiErr.message);
        }
      }

      return { problem: resultProblem, isDuplicate: false, aiReview };
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }
}

export default new SubmissionService();

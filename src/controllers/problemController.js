import SubmissionService from '../services/SubmissionService.js';
import ProblemService from '../services/ProblemService.js';
import RevisionService from '../services/RevisionService.js';
import AnalyticsService from '../services/AnalyticsService.js';
import NotesService from '../services/NotesService.js';
import ProblemRepository from '../repositories/ProblemRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { getAIPersonalizedQuote } from '../utils/aiService.js';




export const addSolvedProblem = async (req, res) => {
  try {
    const result = await SubmissionService.addSolvedProblem(req.user._id, req.body);
    
    if (result.isDuplicate) {
      const merged = await ProblemService.mergeProblemAndNotes(result.problem, req.user._id);
      return res.status(200).json({
        status: 'success',
        message: 'Duplicate submission within 2 minutes ignored.',
        data: merged
      });
    }

    const merged = await ProblemService.mergeProblemAndNotes(result.problem, req.user._id);
    if (result.aiReview) {
      merged.aiReview = result.aiReview;
    }
    res.status(201).json({
      status: 'success',
      data: merged
    });
  } catch (error) {
    console.error('[Controller Error] addSolvedProblem:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};




export const getProblems = async (req, res) => {
  try {
    await ProblemService.syncOverdueProblems(req.user._id);
    const problems = await ProblemService.getProblems(req.user._id, req.query);

    res.status(200).json({
      status: 'success',
      count: problems.length,
      data: problems
    });
  } catch (error) {
    console.error('[Controller Error] getProblems:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};




export const updateRevisionStatus = async (req, res) => {
  try {
    const { action } = req.body;
    const problem = await RevisionService.performManualRevision(req.user._id, req.params.id, action);
    const merged = await ProblemService.mergeProblemAndNotes(problem, req.user._id);

    res.status(200).json({
      status: 'success',
      data: merged
    });
  } catch (error) {
    console.error('[Controller Error] updateRevisionStatus:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};




export const getDashboardStats = async (req, res) => {
  try {
    await ProblemService.syncOverdueProblems(req.user._id);
    const stats = await AnalyticsService.getDashboardData(req.user._id);
    const user = await UserRepository.findById(req.user._id);
    
    
    res.status(200).json({
      status: 'success',
      data: {
        streak: stats.currentStreak,
        xp: stats.xpEarned,
        level: user ? user.level : 1,
        levelProgress: stats.xpEarned ? Math.floor((stats.xpEarned % 1000) / 10) : 0,
        memoryRetention: stats.memoryHealth,
        solvedToday: stats.aiInsightContext?.solvedToday || 0,
        pendingRevisions: stats.overdueRevisions,
        dailyActivity: stats.weeklyActivity.map((count, index) => {
          const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            day: weekdays[index],
            solved: count,
            revised: count > 0 ? count : 0
          };
        }),
        platformDistribution: Object.keys(stats.platformDistribution).map(name => ({
          name,
          value: stats.platformDistribution[name]
        })),
        difficultyDistribution: Object.keys(stats.difficultyDistribution).map(name => ({
          name,
          value: stats.difficultyDistribution[name]
        }))
      }
    });
  } catch (error) {
    console.error('[Controller Error] getDashboardStats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};




export const getMotivationQuote = async (req, res) => {
  try {
    const user = await UserRepository.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const solvedToday = await ProblemRepository.countDocuments({
      user: req.user._id,
      solvedAt: { $gte: todayStart }
    });

    const quote = await getAIPersonalizedQuote(
      user.username,
      user.streak || 0,
      solvedToday,
      user.level || 1
    );

    res.status(200).json({
      status: 'success',
      data: { quote }
    });
  } catch (error) {
    console.error('[Controller Error] getMotivationQuote:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

  


export const updateProblemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { intuition, topic, mistakes, timeComplexity, spaceComplexity, conceptTags, isImportant } = req.body;

    const problem = await ProblemRepository.findOne({ _id: id, user: req.user._id });
    if (!problem) {
      return res.status(404).json({
        status: 'error',
        message: 'Problem not found or unauthorized'
      });
    }

    if (isImportant !== undefined) {
      problem.isImportant = isImportant;
      await problem.save();
    }

    
    const updateData = {};
    if (intuition !== undefined) {
      updateData.logicEntry = {
        topic: topic || 'General',
        logic: intuition
      };
      updateData.conceptNotes = intuition;
    }
    if (mistakes !== undefined) updateData.mistakes = mistakes;
    if (timeComplexity !== undefined) updateData.timeComplexity = timeComplexity;
    if (spaceComplexity !== undefined) updateData.spaceComplexity = spaceComplexity;
    if (conceptTags !== undefined) updateData.conceptTags = conceptTags;

    await NotesService.updateNotes(req.user._id, problem.problemId, updateData);

    const merged = await ProblemService.mergeProblemAndNotes(problem, req.user._id);

    res.status(200).json({
      status: 'success',
      data: merged
    });
  } catch (error) {
    console.error('[Controller Error] updateProblemDetails:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

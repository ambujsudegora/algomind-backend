import ProblemRepository from '../repositories/ProblemRepository.js';
import NotesRepository from '../repositories/NotesRepository.js';
import SchedulerService from './SchedulerService.js';

class ProblemService {
  async getProblems(userId, filters) {
    const { status, platform, difficulty, search } = filters;
    const query = { user: userId };
    
    if (status) query.status = status;
    if (platform) query.platform = platform;
    if (difficulty) query.difficulty = difficulty;

    if (search) {
      const regex = new RegExp(search, 'i');
      
      
      const matchingNotes = await NotesRepository.find({
        userId,
        $or: [
          { conceptNotes: regex },
          { approach: regex },
          { mistakes: regex }
        ]
      });
      
      const noteProblemIds = matchingNotes.map(n => n.problemId);
      
      query.$or = [
        { title: regex },
        { category: regex },
        { problemId: { $in: noteProblemIds } }
      ];
    }

    const problems = await ProblemRepository.find(query, { sort: { solvedAt: -1 } });
    
    
    const mergedProblems = [];
    for (const problem of problems) {
      const merged = await this.mergeProblemAndNotes(problem, userId);
      mergedProblems.push(merged);
    }
    return mergedProblems;
  }

  async mergeProblemAndNotes(problemDoc, userId) {
    if (!problemDoc) return null;
    const problem = problemDoc.toObject ? problemDoc.toObject() : { ...problemDoc };
    const notes = await NotesRepository.findByUserAndProblemId(userId, problem.problemId);
    if (notes) {
      problem.intuition = notes.conceptNotes || '';
      problem.mistakes = notes.mistakes || [];
      problem.timeComplexity = notes.timeComplexity || '';
      problem.spaceComplexity = notes.spaceComplexity || '';
      problem.conceptTags = notes.conceptTags || [];
    } else {
      problem.intuition = '';
      problem.mistakes = [];
      problem.timeComplexity = '';
      problem.spaceComplexity = '';
      problem.conceptTags = [];
    }
    return problem;
  }

  async syncOverdueProblems(userId) {
    const problems = await ProblemRepository.find({ user: userId });
    for (const problem of problems) {
      let modified = false;
      
      if (problem.status === 'Completed' && new Date(problem.nextRevisionDate) <= new Date()) {
        problem.status = 'Pending';
        modified = true;
      }
      
      const fp = SchedulerService.calculateForgetProbability(problem);
      if (fp !== problem.forgetProbability) {
        problem.forgetProbability = fp;
        modified = true;
      }
      
      const state = SchedulerService.determineLearningState(problem);
      if (state !== problem.learningState) {
        problem.learningState = state;
        modified = true;
      }
      
      if (modified) {
        await problem.save();
      }
    }
  }
}

export default new ProblemService();

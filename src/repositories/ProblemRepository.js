import BaseRepository from './BaseRepository.js';
import Problem from '../models/Problem.js';

class ProblemRepository extends BaseRepository {
  constructor() {
    super(Problem);
  }

  async findByUserAndProblemId(userId, platform, problemId) {
    return this.model.findOne({ user: userId, platform, problemId });
  }

  async findByUser(userId, query = {}, sort = { solvedAt: -1 }) {
    return this.model.find({ user: userId, ...query }).sort(sort);
  }
}

export default new ProblemRepository();

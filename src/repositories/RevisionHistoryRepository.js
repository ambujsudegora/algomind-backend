import BaseRepository from './BaseRepository.js';
import RevisionHistory from '../models/RevisionHistory.js';

class RevisionHistoryRepository extends BaseRepository {
  constructor() {
    super(RevisionHistory);
  }

  async findLatestForProblem(userId, problemId) {
    return this.model.findOne({ userId, problemId }).sort({ date: -1 });
  }

  async getRevisionStats(userId) {
    return this.model.find({ userId }).sort({ date: -1 });
  }
}

export default new RevisionHistoryRepository();

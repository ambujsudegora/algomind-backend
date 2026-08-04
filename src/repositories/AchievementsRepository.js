import BaseRepository from './BaseRepository.js';
import Achievements from '../models/Achievements.js';

class AchievementsRepository extends BaseRepository {
  constructor() {
    super(Achievements);
  }

  async findByUser(userId) {
    return this.model.find({ userId });
  }
}

export default new AchievementsRepository();

import BaseRepository from './BaseRepository.js';
import AnalyticsCache from '../models/AnalyticsCache.js';

class AnalyticsCacheRepository extends BaseRepository {
  constructor() {
    super(AnalyticsCache);
  }

  async getByUser(userId) {
    return this.model.findOne({ userId });
  }

  async setByUser(userId, data) {
    return this.model.findOneAndUpdate(
      { userId },
      { data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

export default new AnalyticsCacheRepository();

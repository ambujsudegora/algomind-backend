import eventEmitter from './eventEmitter.js';
import XPService from '../services/XPService.js';
import AchievementService from '../services/AchievementService.js';
import AnalyticsService from '../services/AnalyticsService.js';

eventEmitter.on('submission.accepted', async (data) => {
  const { userId, problem, isManual, action } = data;
  try {
    console.log(`[Event Handler] Processing submission.accepted for user: ${userId}`);
    
    
    const score = problem.honestyMetrics?.honestyScore ?? 100;
    if (isManual) {
      await XPService.awardXP(userId, action === 'recalled' ? 50 : 10);
    } else {
      let xp = 0;
      if (score >= 80) xp = 100;
      else if (score >= 30) xp = 40;
      await XPService.awardXP(userId, xp);
    }

    
    await AchievementService.checkAndUnlock(userId);

    
    await AnalyticsService.invalidateCache(userId);
    
    console.log(`[Event Handler] Completed submission.accepted actions for user: ${userId}`);
  } catch (err) {
    console.error(`[Event Error] Error in submission.accepted handler:`, err);
  }
});

export default eventEmitter;

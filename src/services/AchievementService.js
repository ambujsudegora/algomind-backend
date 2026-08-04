import AchievementsRepository from '../repositories/AchievementsRepository.js';
import ProblemRepository from '../repositories/ProblemRepository.js';

class AchievementService {
  async checkAndUnlock(userId) {
    try {
      const problems = await ProblemRepository.find({ user: userId });
      const totalProblems = problems.length;
      
      const unlocked = [];

      if (totalProblems > 0) {
        unlocked.push({ id: 'first_solve', name: 'First solve', desc: 'Successfully tracked your first problem', icon: 'award', color: '#6366f1' });
      }
      if (totalProblems >= 5) {
        unlocked.push({ id: 'consistency_hero', name: 'Consistency hero', desc: 'Track 5 or more problems', icon: 'zap', color: '#f59e0b' });
      }
      
      const hardProblems = problems.filter(p => p.difficulty === 'Hard');
      if (hardProblems.length >= 1) {
        unlocked.push({ id: 'hard_conqueror', name: 'Hard conqueror', desc: 'Solve at least one Hard problem', icon: 'flame', color: '#ef4444' });
      }

      const mediumProblems = problems.filter(p => p.difficulty === 'Medium');
      if (mediumProblems.length >= 3) {
        unlocked.push({ id: 'medium_master', name: 'Medium master', desc: 'Solve 3 or more Medium problems', icon: 'shield', color: '#10b981' });
      }

      const dpProblems = problems.filter(p => p.category && p.category.toLowerCase().includes('dp'));
      if (dpProblems.length > 0) {
        unlocked.push({ id: 'dp_slayer', name: 'DP slayer', desc: 'Solve a dynamic programming problem', icon: 'robot', color: '#a78bfa' });
      }

      
      const existingAchievements = await AchievementsRepository.find({ userId });
      const existingIds = new Set(existingAchievements.map(a => a.badgeId));

      for (const badge of unlocked) {
        if (!existingIds.has(badge.id)) {
          await AchievementsRepository.create({
            userId,
            badgeId: badge.id,
            name: badge.name,
            description: badge.desc,
            icon: badge.icon,
            color: badge.color
          });
          console.log(`[Achievement] Unlocked badge "${badge.name}" for user ${userId}`);
        }
      }
    } catch (err) {
      console.error('[Achievement Check Error]:', err);
    }
  }
}

export default new AchievementService();

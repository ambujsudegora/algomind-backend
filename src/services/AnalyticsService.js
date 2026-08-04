import AnalyticsCacheRepository from '../repositories/AnalyticsCacheRepository.js';
import ProblemRepository from '../repositories/ProblemRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import AchievementsRepository from '../repositories/AchievementsRepository.js';
import RevisionHistoryRepository from '../repositories/RevisionHistoryRepository.js';

class AnalyticsService {
  async invalidateCache(userId) {
    console.log(`[Cache] Invalidating analytics cache for user: ${userId}`);
    await AnalyticsCacheRepository.deleteOne({ userId });
  }

  async getCachedDashboard(userId) {
    const cached = await AnalyticsCacheRepository.getByUser(userId);
    return cached ? cached.data : null;
  }

  async cacheDashboard(userId, data) {
    return AnalyticsCacheRepository.setByUser(userId, data);
  }

  async calculateDashboardStats(userId) {
    const user = await UserRepository.findById(userId);
    const problems = await ProblemRepository.find({ user: userId });
    const history = await RevisionHistoryRepository.find({ userId });
    const achievements = await AchievementsRepository.findByUser(userId);

    
    const heatmap = {};
    problems.forEach(p => {
      const dateStr = new Date(p.solvedAt || p.createdAt).toISOString().split('T')[0];
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
    });

    
    const topicsMap = {};
    problems.forEach(p => {
      const topic = p.category || 'General';
      if (!topicsMap[topic]) {
        topicsMap[topic] = { solved: 0, total: 0, fpSum: 0 };
      }
      topicsMap[topic].total += 1;
      topicsMap[topic].fpSum += p.forgetProbability || 0;
      if (p.status === 'Completed') {
        topicsMap[topic].solved += 1;
      }
    });
    const topicStats = Object.keys(topicsMap).map(topic => {
      const t = topicsMap[topic];
      const avgFp = Math.round(t.fpSum / t.total);
      return {
        topic,
        solved: t.solved,
        total: t.total,
        retention: Math.max(0, Math.min(100, 100 - avgFp))
      };
    });

    
    const weeklyActivity = Array(7).fill(0);
    const now = new Date();
    problems.forEach(p => {
      const pDate = new Date(p.solvedAt || p.createdAt);
      const diffTime = Math.abs(now - pDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        const day = pDate.getDay();
        weeklyActivity[day] += 1;
      }
    });

    
    const streakCalendar = {};
    problems.forEach(p => {
      const dStr = new Date(p.solvedAt || p.createdAt).toISOString().split('T')[0];
      streakCalendar[dStr] = true;
    });

    
    const unlockedBadges = achievements.map(a => ({
      id: a.badgeId,
      name: a.name,
      desc: a.description,
      icon: a.icon,
      color: a.color,
      unlocked: true,
      unlockedAt: a.unlockedAt
    }));

    
    const weakTopicsList = topicStats.filter(t => t.retention < 55).map(t => t.topic);
    const weakTopic = weakTopicsList.length > 0 ? weakTopicsList[0] : (topicStats[topicStats.length - 1]?.topic || 'DP');
    const solvedTodayCount = problems.filter(p => {
      const sDate = p.solvedAt ? new Date(p.solvedAt) : new Date(p.createdAt);
      return sDate >= new Date().setHours(0,0,0,0);
    }).length;

    const aiInsightContext = {
      weakTopic,
      solvedToday: solvedTodayCount,
      currentStreak: user ? user.streak : 0,
      level: user ? user.level : 1
    };

    
    const totalProblemsCount = problems.length;
    const solvedProblemsCount = problems.filter(p => p.status === 'Completed' || p.submissionCount > 0).length;
    const totalSubmissions = problems.reduce((sum, p) => sum + (p.submissionCount || 1), 0);
    const totalRevisionsCount = problems.reduce((sum, p) => sum + (p.revisionCount || 1), 0);
    const totalManualRevisionsCount = problems.reduce((sum, p) => sum + (p.manualRevisionCount || 0), 0);

    const honestyProblems = problems.filter(p => p.honestyMetrics && p.honestyMetrics.honestyScore !== undefined);
    const calculatedAvgHonestyScore = honestyProblems.length > 0
      ? Math.round(honestyProblems.reduce((sum, p) => sum + p.honestyMetrics.honestyScore, 0) / honestyProblems.length)
      : 100;

    const avgForgetProbability = problems.length > 0
      ? Math.round(problems.reduce((sum, p) => sum + (p.forgetProbability || 0), 0) / problems.length)
      : 0;

    const memoryHealth = Math.max(0, Math.min(100, 100 - avgForgetProbability));
    const upcomingRevisions = problems.filter(p => new Date(p.nextRevisionDate) > new Date()).length;
    const overdueRevisions = problems.filter(p => new Date(p.nextRevisionDate) <= new Date()).length;

    const topicDist = {};
    const platDist = {};
    const diffDist = { Easy: 0, Medium: 0, Hard: 0 };
    const stateDist = { NEW: 0, LEARNING: 0, REVIEWING: 0, MASTERED: 0, FORGOTTEN: 0 };

    problems.forEach(p => {
      const topic = p.category || 'General';
      topicDist[topic] = (topicDist[topic] || 0) + 1;
      platDist[p.platform] = (platDist[p.platform] || 0) + 1;
      if (diffDist[p.difficulty] !== undefined) diffDist[p.difficulty]++;
      const state = p.learningState || 'NEW';
      if (stateDist[state] !== undefined) stateDist[state]++;
    });

    const solveTimes = problems.map(p => p.honestyMetrics?.timeTakenSeconds).filter(t => t !== undefined && t > 0);
    const avgSolveTime = solveTimes.length > 0 ? Math.round(solveTimes.reduce((sum, t) => sum + t, 0) / solveTimes.length) : 0;

    let totalRevTime = 0;
    let revTimeCount = 0;
    history.forEach(h => {
      if (h.submissionType === 'Manual' || h.revisionResult === 'Passed') {
        totalRevTime += h.timeSpent || 0;
        revTimeCount++;
      }
    });
    const avgRevisionTime = revTimeCount > 0 ? Math.round(totalRevTime / revTimeCount) : 0;

    const mostRevised = [...problems]
      .sort((a, b) => ((b.revisionCount || 1) + (b.manualRevisionCount || 0)) - ((a.revisionCount || 1) + (a.manualRevisionCount || 0)))
      .slice(0, 5)
      .map(p => ({ title: p.title, count: (p.revisionCount || 1) + (p.manualRevisionCount || 0) }));

    const topicFpGroups = {};
    problems.forEach(p => {
      const topic = p.category || 'General';
      if (!topicFpGroups[topic]) topicFpGroups[topic] = { sum: 0, count: 0 };
      topicFpGroups[topic].sum += p.forgetProbability || 0;
      topicFpGroups[topic].count++;
    });

    const mostForgottenTopics = Object.keys(topicFpGroups)
      .map(topic => ({ topic, avgFp: Math.round(topicFpGroups[topic].sum / topicFpGroups[topic].count) }))
      .sort((a, b) => b.avgFp - a.avgFp)
      .slice(0, 3);

    const bestTopics = Object.keys(topicFpGroups)
      .map(topic => ({ topic, avgFp: Math.round(topicFpGroups[topic].sum / topicFpGroups[topic].count) }))
      .sort((a, b) => a.avgFp - b.avgFp)
      .slice(0, 3);

    const weakestTopics = Object.keys(topicFpGroups)
      .map(topic => ({ topic, avgFp: Math.round(topicFpGroups[topic].sum / topicFpGroups[topic].count) }))
      .sort((a, b) => b.avgFp - a.avgFp)
      .slice(0, 3);

    const revisionCalendar = problems.map(p => ({
      title: p.title,
      nextRevisionDate: p.nextRevisionDate,
      solvedAt: p.solvedAt
    }));

    const monthlyProgress = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const dayProblems = problems.filter(p => {
        const sDate = p.solvedAt ? new Date(p.solvedAt) : new Date(p.createdAt);
        return sDate >= start && sDate < end;
      });
      monthlyProgress.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: dayProblems.length
      });
    }

    const totalRecallAttempts = history.filter(h => h.submissionType === 'Manual').length;
    const recalledCount = history.filter(h => h.submissionType === 'Manual' && h.revisionResult === 'Recalled').length;
    const recallAccuracy = totalRecallAttempts > 0 ? Math.round((recalledCount / totalRecallAttempts) * 100) : 100;

    return {
      heatmap,
      topicStats,
      weeklyActivity,
      streakCalendar,
      badges: unlockedBadges,
      aiInsightContext,
      totalRevisions: history.length,
      currentStreak: user ? user.streak : 0,
      totalProblems: totalProblemsCount,
      solvedProblems: solvedProblemsCount,
      submissionCount: totalSubmissions,
      revisionCount: totalRevisionsCount,
      manualRevisionCount: totalManualRevisionsCount,
      longestStreak: user ? (user.bestStreak || user.streak) : 0,
      avgHonestyScore: calculatedAvgHonestyScore,
      avgForgetProbability,
      memoryHealth,
      upcomingRevisions,
      overdueRevisions,
      topicDistribution: topicDist,
      difficultyDistribution: diffDist,
      platformDistribution: platDist,
      learningStateDistribution: stateDist,
      avgSolveTime,
      avgRevisionTime,
      mostRevisedProblems: mostRevised,
      mostForgottenTopics,
      bestTopics,
      weakestTopics,
      revisionCalendar,
      monthlyProgress,
      xpEarned: user ? user.xp : 0,
      xp: user ? user.xp : 0,
      level: user ? user.level : 1,
      memoryRetention: memoryHealth,
      coinsEarned: Math.round((user ? user.xp : 0) * 1.5),
      recallAccuracy
    };
  }

  async getDashboardData(userId) {
    let stats = await this.getCachedDashboard(userId);
    if (!stats) {
      stats = await this.calculateDashboardStats(userId);
      await this.cacheDashboard(userId, stats);
    }
    return stats;
  }
}

export default new AnalyticsService();

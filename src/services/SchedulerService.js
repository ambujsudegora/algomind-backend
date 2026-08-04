class SchedulerService {
  getIntervalDays(difficulty, step) {
    const diff = (difficulty || 'Medium').toLowerCase();
    
    if (diff === 'easy') {
      const intervals = { 1: 2, 2: 5, 3: 12, 4: 30 };
      return intervals[step] || 30;
    }
    if (diff === 'hard') {
      const intervals = { 1: 1, 2: 2, 3: 4, 4: 8 };
      return intervals[step] || 8;
    }
    
    const intervals = { 1: 1, 2: 3, 3: 7, 4: 15 };
    return intervals[step] || 15;
  }

  calculateForgetProbability(problem, manualRecallAction = null) {
    const difficulty = (problem.difficulty || 'Medium').toLowerCase();
    const honesty = problem.honestyMetrics?.honestyScore ?? 100;
    const totalRevs = (problem.revisionCount || 1) + (problem.manualRevisionCount || 0);
    
    const lastActiveTime = problem.lastSolvedAt || problem.solvedAt || new Date();
    const daysSinceLast = Math.max(0, (Date.now() - new Date(lastActiveTime).getTime()) / (1000 * 60 * 60 * 24));
    
    let decayRate = 0.1;
    if (difficulty === 'easy') decayRate = 0.05;
    if (difficulty === 'hard') decayRate = 0.2;
    
    const honestyFactor = Math.max(0.5, 2 - (honesty / 100));
    decayRate *= honestyFactor;
    
    const reinforcement = Math.max(0.1, 1 / Math.sqrt(totalRevs));
    decayRate *= reinforcement;
    
    let retention = Math.exp(-daysSinceLast * decayRate);
    let probability = Math.round((1 - retention) * 100);
    
    if (manualRecallAction === 'forgot') {
      probability = 90;
    } else if (manualRecallAction === 'recalled') {
      probability = Math.max(10, Math.round(probability * 0.4));
    }
    
    return Math.min(100, Math.max(0, probability));
  }

  determineLearningState(problem) {
    const totalRevs = (problem.revisionCount || 1) + (problem.manualRevisionCount || 0);
    const fp = problem.forgetProbability ?? 0;
    
    if (fp > 75) {
      return 'FORGOTTEN';
    }
    if (totalRevs >= 4 && fp <= 15) {
      return 'MASTERED';
    }
    if ((problem.submissionCount || 1) <= 1 && totalRevs <= 1) {
      return 'NEW';
    }
    if (fp <= 50 && totalRevs >= 2) {
      return 'REVIEWING';
    }
    return 'LEARNING';
  }

  calculateNextRevisionDate(difficulty, step, honestyScore) {
    let daysToAdd = this.getIntervalDays(difficulty, step);
    
    if (honestyScore >= 80) {
      
    } else if (honestyScore >= 50) {
      daysToAdd = Math.max(1, Math.floor(daysToAdd * 0.6));
    } else if (honestyScore >= 20) {
      daysToAdd = Math.max(1, Math.floor(daysToAdd * 0.3));
    } else {
      daysToAdd = 1;
    }
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }
}

export default new SchedulerService();

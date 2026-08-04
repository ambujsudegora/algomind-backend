import UserRepository from '../repositories/UserRepository.js';

class XPService {
  async awardXP(userId, amount) {
    if (amount <= 0) return;
    const user = await UserRepository.findById(userId);
    if (!user) return;
    
    user.xp += amount;
    user.level = Math.floor(user.xp / 1000) + 1;
    return user.save();
  }
}

export default new XPService();

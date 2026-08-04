import AnalyticsService from '../services/AnalyticsService.js';
import User from '../models/User.js';




export const getAnalyticsDashboard = async (req, res) => {
  try {
    const stats = await AnalyticsService.getDashboardData(req.user._id);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('[Controller Error] getAnalyticsDashboard:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};




export const useStreakFreeze = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const freezesLeft = user.freezesLeft !== undefined ? user.freezesLeft : 1;
    if (freezesLeft <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No streak freezes left'
      });
    }

    user.freezesLeft = freezesLeft - 1;
    
    user.lastActive = new Date();
    await user.save();

    
    await AnalyticsService.invalidateCache(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Streak freeze used successfully',
      data: {
        freezesLeft: user.freezesLeft,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('[Controller Error] useStreakFreeze:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

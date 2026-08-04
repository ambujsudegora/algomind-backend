import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallbacksecretkey123', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};


export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide username, email, and password'
      });
    }

    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email or username'
      });
    }

    
    const user = await User.create({
      username,
      email,
      password
    });

    
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res, next) => {
  try {
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getUserSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      status: 'success',
      data: user.settings || {
        syncEnabled: true,
        remindersEnabled: true,
        revisionIntervals: [1, 3, 7, 15]
      }
    });
  } catch (error) {
    next(error);
  }
};


export const updateUserSettings = async (req, res, next) => {
  try {
    const { syncEnabled, remindersEnabled, revisionIntervals } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.settings) {
      if (syncEnabled !== undefined) user.settings.syncEnabled = syncEnabled;
      if (remindersEnabled !== undefined) user.settings.remindersEnabled = remindersEnabled;
      if (revisionIntervals !== undefined) user.settings.revisionIntervals = revisionIntervals;
    } else {
      user.settings = {
        syncEnabled: syncEnabled !== undefined ? syncEnabled : true,
        remindersEnabled: remindersEnabled !== undefined ? remindersEnabled : true,
        revisionIntervals: revisionIntervals !== undefined ? revisionIntervals : [1, 3, 7, 15]
      };
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      data: user.settings
    });
  } catch (error) {
    next(error);
  }
};

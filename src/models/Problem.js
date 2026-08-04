import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['LeetCode', 'GeeksforGeeks', 'Codeforces', 'AtCoder', 'CodeChef', 'HackerRank', 'Other']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Problem URL is required'],
    trim: true
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Completed']
  },
  submissionCount: {
    type: Number,
    default: 1
  },
  revisionCount: {
    type: Number,
    default: 1
  },
  manualRevisionCount: {
    type: Number,
    default: 0
  },
  forgetProbability: {
    type: Number,
    default: 0
  },
  learningState: {
    type: String,
    enum: ['NEW', 'LEARNING', 'REVIEWING', 'MASTERED', 'FORGOTTEN'],
    default: 'NEW'
  },
  codeHash: {
    type: String,
    default: ''
  },
  lastSolvedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  revisionStep: {
    type: Number,
    default: 1
  },
  nextRevisionDate: {
    type: Date,
    required: true
  },
  solvedAt: {
    type: Date,
    default: Date.now
  },
  honestyMetrics: {
    hintsUsed: {
      type: Boolean,
      default: false
    },
    solutionClicked: {
      type: Boolean,
      default: false
    },
    tabSwitchesCount: {
      type: Number,
      default: 0
    },
    codePasted: {
      type: Boolean,
      default: false
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    },
    honestyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    trend: {
      type: String,
      enum: ['UP', 'DOWN', 'SAME'],
      default: 'SAME'
    },
    difference: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


problemSchema.index({ user: 1, platform: 1, problemId: 1 }, { unique: true });
problemSchema.index({ user: 1, nextRevisionDate: 1 });
problemSchema.index({ user: 1, learningState: 1 });
problemSchema.index({ user: 1, forgetProbability: 1 });

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;

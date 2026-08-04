import mongoose from 'mongoose';

const revisionHistorySchema = new mongoose.Schema({
  userId: {
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
  submissionId: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  submissionType: {
    type: String,
    enum: ['Submission', 'Manual'],
    required: true
  },
  honestyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  forgetProbability: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  codeHash: {
    type: String
  },
  revisionResult: {
    type: String,
    enum: ['Passed', 'Failed', 'Recalled', 'Forgot'],
    required: true
  },
  schedulerVersion: {
    type: String,
    default: 'v1.0.0'
  }
});

revisionHistorySchema.index({ userId: 1, problemId: 1, date: -1 });

const RevisionHistory = mongoose.model('RevisionHistory', revisionHistorySchema);

export default RevisionHistory;

import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);

export default AnalyticsCache;

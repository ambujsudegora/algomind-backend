import mongoose from 'mongoose';

const achievementsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  icon: {
    type: String
  },
  color: {
    type: String
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
});

achievementsSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Achievements = mongoose.model('Achievements', achievementsSchema);

export default Achievements;

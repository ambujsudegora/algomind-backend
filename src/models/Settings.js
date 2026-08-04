import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  syncEnabled: {
    type: Boolean,
    default: true
  },
  remindersEnabled: {
    type: Boolean,
    default: true
  },
  revisionIntervals: {
    type: [Number],
    default: [1, 3, 7, 15]
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

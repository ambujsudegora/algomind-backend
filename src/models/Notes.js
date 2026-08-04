import mongoose from 'mongoose';

const notesSchema = new mongoose.Schema({
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
  conceptNotes: {
    type: String,
    default: ''
  },
  mistakes: {
    type: [String],
    default: []
  },
  approach: {
    type: String,
    default: ''
  },
  resources: {
    type: [String],
    default: []
  },
  timeComplexity: {
    type: String,
    default: ''
  },
  spaceComplexity: {
    type: String,
    default: ''
  },
  logicEntries: [{
    topic: { type: String, trim: true },
    logic: { type: String, trim: true },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

notesSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const Notes = mongoose.model('Notes', notesSchema);

export default Notes;

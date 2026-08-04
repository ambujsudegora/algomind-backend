import BaseRepository from './BaseRepository.js';
import Notes from '../models/Notes.js';

class NotesRepository extends BaseRepository {
  constructor() {
    super(Notes);
  }

  async findByUserAndProblemId(userId, problemId) {
    return this.model.findOne({ userId, problemId });
  }

  async findOrCreate(userId, problemId, options = {}) {
    let note = await this.model.findOne({ userId, problemId }).session(options.session || null);
    if (!note) {
      note = await this.create({ userId, problemId }, options);
    }
    return note;
  }
}

export default new NotesRepository();

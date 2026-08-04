import NotesRepository from '../repositories/NotesRepository.js';

class NotesService {
  async getNotes(userId, problemId) {
    return NotesRepository.findOrCreate(userId, problemId);
  }

  async updateNotes(userId, problemId, updateData) {
    const note = await NotesRepository.findOrCreate(userId, problemId);
    
    
    const allowedFields = ['conceptNotes', 'mistakes', 'approach', 'resources', 'timeComplexity', 'spaceComplexity'];
    
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        note[key] = updateData[key];
      }
    }
    
    if (updateData.logicEntry && updateData.logicEntry.logic) {
      if (!note.logicEntries) note.logicEntries = [];
      note.logicEntries.push({
        topic: updateData.logicEntry.topic || 'General',
        logic: updateData.logicEntry.logic,
        date: new Date()
      });
      
      note.conceptNotes = updateData.logicEntry.logic;
    }
    
    return note.save();
  }
}

export default new NotesService();

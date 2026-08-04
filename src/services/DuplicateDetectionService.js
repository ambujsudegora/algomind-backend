import crypto from 'crypto';

class DuplicateDetectionService {
  generateCodeHash(code) {
    if (!code) return '';
    const normalized = code.replace(/\s+/g, '').trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  isDuplicate(lastSolvedAt, incomingCodeHash, existingCodeHash) {
    if (!lastSolvedAt) return false;
    
    const timeDiffMs = Date.now() - new Date(lastSolvedAt).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    const sixtySeconds = 60 * 1000;

    // 1. If exact same code hash, ignore duplicates submitted within 15 minutes
    if (incomingCodeHash && existingCodeHash && incomingCodeHash === existingCodeHash) {
      if (timeDiffMs < fifteenMinutes) {
        return true;
      }
    }
    
    // 2. If any submission for this problem within 60 seconds, treat as duplicate burst
    if (timeDiffMs < sixtySeconds) {
      return true;
    }
    
    return false;
  }
}

export default new DuplicateDetectionService();

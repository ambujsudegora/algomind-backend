import { body, validationResult } from 'express-validator';

export const validateSolvedProblem = [
  body('title').trim().notEmpty().withMessage('Problem title is required'),
  body('platform').trim().isIn(['LeetCode', 'GeeksforGeeks', 'Codeforces', 'AtCoder', 'CodeChef', 'HackerRank', 'Other']).withMessage('Invalid platform'),
  body('difficulty').trim().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
  body('url').trim().isURL().withMessage('Please provide a valid problem URL'),
  body('honestyMetrics.honestyScore').optional().isInt({ min: 0, max: 100 }).withMessage('Honesty score must be between 0 and 100'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateNotesUpdate = [
  body('timeComplexity').optional().isString().trim(),
  body('spaceComplexity').optional().isString().trim(),
  body('conceptNotes').optional().isString().trim(),
  body('mistakes').optional().isArray().withMessage('Mistakes must be an array of strings'),
  body('approach').optional().isString().trim(),
  body('resources').optional().isArray().withMessage('Resources must be an array of strings'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

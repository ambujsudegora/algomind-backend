import express from 'express';
import { 
  addSolvedProblem, 
  getProblems, 
  updateRevisionStatus, 
  getDashboardStats,
  getMotivationQuote,
  updateProblemDetails
} from '../controllers/problemController.js';
import { protect } from '../middleware/auth.js';
import { validateSolvedProblem, validateNotesUpdate } from '../validators/problemValidator.js';

const router = express.Router();


router.use(protect);

router.route('/')
  .post(validateSolvedProblem, addSolvedProblem)
  .get(getProblems);

router.get('/dashboard-stats', getDashboardStats);
router.get('/stats', getDashboardStats);
router.get('/motivation-quote', getMotivationQuote);

router.put('/:id/revision', updateRevisionStatus);
router.put('/:id', validateNotesUpdate, updateProblemDetails);

export default router;

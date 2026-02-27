import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected (require authentication)
router.use(protect);

// Task CRUD routes
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task assignment and status update
router.patch('/:id/assign', assignTask);
router.patch('/:id/status', updateTaskStatus);

export default router;

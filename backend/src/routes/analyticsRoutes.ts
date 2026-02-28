import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getOverallStats,
  getTasksByStatus,
  getTasksByPriority,
  getTasksByProject,
  getCompletionTrend,
  getRecentActivity,
  getProjectAnalytics,
  getUserStats,
} from '../controllers/analyticsController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Overall statistics
router.get('/stats', getOverallStats);

// Task breakdowns
router.get('/tasks/by-status', getTasksByStatus);
router.get('/tasks/by-priority', getTasksByPriority);
router.get('/tasks/by-project', getTasksByProject);

// Trends
router.get('/trends/completion', getCompletionTrend);

// Activity
router.get('/activity/recent', getRecentActivity);

// User statistics (system-wide)
router.get('/users/stats', getUserStats);

// Project-specific analytics
router.get('/projects/:projectId', getProjectAnalytics);

export default router;

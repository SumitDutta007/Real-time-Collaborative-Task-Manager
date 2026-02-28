import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { analyticsService } from '../services/analyticsService';

export const getOverallStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const stats = await analyticsService.getOverallStats(userId);

    return res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    console.error('Get overall stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get statistics',
    });
  }
};

export const getTasksByStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getTasksByStatus(userId);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get tasks by status',
    });
  }
};

export const getTasksByPriority = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getTasksByPriority(userId);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get tasks by priority error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get tasks by priority',
    });
  }
};

export const getTasksByProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getTasksByProject(userId);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get tasks by project error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get tasks by project',
    });
  }
};

export const getCompletionTrend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 7;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getCompletionTrend(userId, days);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get completion trend error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get completion trend',
    });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getRecentActivity(userId, limit);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get recent activity',
    });
  }
};

export const getProjectAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getProjectAnalytics(projectId, userId);

    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get project analytics',
    });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const data = await analyticsService.getUserStats(userId);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get user statistics',
    });
  }
};

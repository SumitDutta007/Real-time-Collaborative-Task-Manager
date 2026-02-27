import { Response } from 'express';
import { taskService } from '../services/taskService';
import { AuthRequest } from '../middleware/authMiddleware';

enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, assigneeEmail, assigneeId } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required',
      });
    }

    const task = await taskService.createTask({
      title,
      description,
      status: status as 'PENDING' | 'COMPLETED',
      creatorId,
      assigneeId,
      pendingAssigneeEmail: assigneeEmail,
    });

    return res.status(201).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create task',
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const filter = req.query.filter as 'created' | 'assigned' | 'all' | undefined;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const tasks = await taskService.getTasks(userId, filter || 'all');

    return res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get tasks',
    });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const task = await taskService.getTaskById(id, userId);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get task',
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description, status, assigneeId, assigneeEmail } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const task = await taskService.updateTask(id, userId, {
      title,
      description,
      status: status as 'PENDING' | 'COMPLETED',
      assigneeId,
      pendingAssigneeEmail: assigneeEmail,
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you are not the creator',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update task',
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const task = await taskService.deleteTask(id, userId);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you are not the creator',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete task',
    });
  }
};

export const assignTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { assigneeEmail, assigneeId } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!assigneeEmail && !assigneeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Either assigneeEmail or assigneeId is required',
      });
    }

    const task = await taskService.assignTask(id, userId, assigneeEmail, assigneeId);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you are not the creator',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    console.error('Assign task error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to assign task',
    });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!status || !Object.values(Status).includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid status is required (PENDING or COMPLETED)',
      });
    }

    const task = await taskService.updateTaskStatus(id, userId, status as 'PENDING' | 'COMPLETED');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update task status',
    });
  }
};

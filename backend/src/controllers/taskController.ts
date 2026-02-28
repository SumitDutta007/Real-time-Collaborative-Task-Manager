import { Response } from 'express';
import { taskService } from '../services/taskService';
import { AuthRequest } from '../middleware/authMiddleware';
import { emitTaskEvent, emitToUser } from '../socket/socketHandler';

enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, assigneeEmail, assigneeId, projectId, priority, dueDate } = req.body;
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

    if (!projectId) {
      return res.status(400).json({
        status: 'error',
        message: 'Project ID is required',
      });
    }

    const task = await taskService.createTask({
      title,
      description,
      status: status as 'PENDING' | 'COMPLETED',
      priority: priority as 'LOW' | 'NORMAL' | 'HIGH',
      projectId,
      creatorId,
      assigneeId,
      pendingAssigneeEmail: assigneeEmail,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'task:created', { task });
      
      // Notify assignee if task is assigned
      if (task.assigneeId) {
        emitToUser(io, task.assigneeId, 'task:assigned', { task });
      }
    }

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
    const { title, description, status, priority, progress, assigneeId, assigneeEmail, dueDate } = req.body;

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
      priority: priority as 'LOW' | 'NORMAL' | 'HIGH',
      progress,
      assigneeId,
      pendingAssigneeEmail: assigneeEmail,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you are not the creator',
      });
    }

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'task:updated', { task });
      
      // Notify assignee if task has one
      if (task.assigneeId && task.assigneeId !== userId) {
        emitToUser(io, task.assigneeId, 'task:updated:assigned', { task });
      }
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

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'task:deleted', { taskId: id, task });
      
      // Notify assignee if task had one
      if (task.assigneeId && task.assigneeId !== userId) {
        emitToUser(io, task.assigneeId, 'task:deleted:assigned', { taskId: id, task });
      }
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

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'task:assigned', { task });
      
      // Notify the assignee
      if (task.assigneeId) {
        emitToUser(io, task.assigneeId, 'task:assigned:you', { task });
      }
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

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'task:status:updated', { task });
      
      // Notify creator if status updated by assignee
      if (task.creatorId && task.creatorId !== userId) {
        emitToUser(io, task.creatorId, 'task:status:updated:creator', { task });
      }
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

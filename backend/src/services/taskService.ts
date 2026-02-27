import { prisma } from '../utils/prisma';

type StatusType = 'PENDING' | 'COMPLETED';
type PriorityType = 'LOW' | 'NORMAL' | 'HIGH';

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: StatusType;
  priority?: PriorityType;
  projectId: string;
  creatorId: string;
  assigneeId?: string;
  pendingAssigneeEmail?: string;
  dueDate?: Date;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: StatusType;
  priority?: PriorityType;
  progress?: number;
  assigneeId?: string;
  pendingAssigneeEmail?: string;
  dueDate?: Date;
}

export class TaskService {
  // Create a new task
  async createTask(data: CreateTaskInput) {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'PENDING',
        priority: data.priority || 'NORMAL',
        projectId: data.projectId,
        creatorId: data.creatorId,
        assigneeId: data.assigneeId,
        pendingAssigneeEmail: data.pendingAssigneeEmail,
        dueDate: data.dueDate,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Get all tasks (with optional filtering)
  async getTasks(userId: string, filter?: 'created' | 'assigned' | 'all') {
    const where: any = {};

    if (filter === 'created') {
      where.creatorId = userId;
    } else if (filter === 'assigned') {
      where.OR = [
        { assigneeId: userId },
        { pendingAssigneeEmail: await this.getUserEmail(userId) },
      ];
    } else {
      // 'all' - tasks created by or assigned to user
      where.OR = [
        { creatorId: userId },
        { assigneeId: userId },
        { pendingAssigneeEmail: await this.getUserEmail(userId) },
      ];
    }

    return await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get a single task by ID
  async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!task) {
      return null;
    }

    // Check if user has access to this task
    const userEmail = await this.getUserEmail(userId);
    const hasAccess =
      task.creatorId === userId ||
      task.assigneeId === userId ||
      task.pendingAssigneeEmail === userEmail;

    if (!hasAccess) {
      return null;
    }

    return task;
  }

  // Update a task
  async updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
    // Check if user is the creator or assignee
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return null;
    }

    // Creators can update everything, assignees can only update status and progress
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isCreator && !isAssignee) {
      return null;
    }

    // If user is assignee (not creator), only allow status and progress updates
    const updateData: any = {};
    if (isCreator) {
      // Creator can update all fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.progress !== undefined) updateData.progress = data.progress;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
      if (data.pendingAssigneeEmail !== undefined) updateData.pendingAssigneeEmail = data.pendingAssigneeEmail;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    } else if (isAssignee) {
      // Assignee can only update status and progress
      if (data.status !== undefined) updateData.status = data.status;
      if (data.progress !== undefined) updateData.progress = data.progress;
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Delete a task
  async deleteTask(taskId: string, userId: string) {
    // Check if user is the creator
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.creatorId !== userId) {
      return null;
    }

    return await prisma.task.delete({
      where: { id: taskId },
    });
  }

  // Assign task to a user (by email or user ID)
  async assignTask(taskId: string, userId: string, assigneeEmail?: string, assigneeId?: string) {
    // Check if user is the creator
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.creatorId !== userId) {
      return null;
    }

    // If assigneeId is provided, use it directly
    if (assigneeId) {
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          assigneeId,
          pendingAssigneeEmail: null,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    }

    // If email is provided, check if user exists
    if (assigneeEmail) {
      const assignee = await prisma.user.findUnique({
        where: { email: assigneeEmail },
      });

      if (assignee) {
        // User exists, assign directly
        return await prisma.task.update({
          where: { id: taskId },
          data: {
            assigneeId: assignee.id,
            pendingAssigneeEmail: null,
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      } else {
        // User doesn't exist yet, store email for later linking
        return await prisma.task.update({
          where: { id: taskId },
          data: {
            assigneeId: null,
            pendingAssigneeEmail: assigneeEmail,
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      }
    }

    return null;
  }

  // Helper: Get user email by ID
  private async getUserEmail(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || null;
  }

  // Update task status (for assignee)
  async updateTaskStatus(taskId: string, userId: string, status: StatusType) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return null;
    }

    const userEmail = await this.getUserEmail(userId);

    // Check if user is the assignee
    const isAssignee = task.assigneeId === userId || task.pendingAssigneeEmail === userEmail;

    if (!isAssignee && task.creatorId !== userId) {
      return null;
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }
}

export const taskService = new TaskService();

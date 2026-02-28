import { prisma } from '../utils/prisma';

export class AnalyticsService {
  // Get overall statistics for the entire system (all users)
  async getOverallStats(_userId: string) {
    const [totalTasks, completedTasks, pendingTasks, projects, totalUsers] = await Promise.all([
      // Total tasks across all users
      prisma.task.count(),
      // Completed tasks
      prisma.task.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      // Pending tasks
      prisma.task.count({
        where: {
          status: 'PENDING',
        },
      }),
      // Total projects
      prisma.project.count(),
      // Total users
      prisma.user.count(),
    ]);

    // Calculate overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      projects,
      totalUsers,
      completionRate: parseFloat(completionRate.toFixed(1)),
    };
  }

  // Get tasks by status breakdown (system-wide)
  async getTasksByStatus(_userId: string) {
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return tasksByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  // Get tasks by priority breakdown (system-wide)
  async getTasksByPriority(_userId: string) {
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: {
        id: true,
      },
    });

    return tasksByPriority.map((item) => ({
      priority: item.priority,
      count: item._count.id,
    }));
  }

  // Get tasks by project (system-wide)
  async getTasksByProject(_userId: string) {
    const tasksByProject = await prisma.task.groupBy({
      by: ['projectId'],
      _count: {
        id: true,
      },
    });

    // Get project names
    const projectIds = tasksByProject.map((item) => item.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    return tasksByProject.map((item) => {
      const project = projects.find((p) => p.id === item.projectId);
      return {
        projectId: item.projectId,
        projectName: project?.name || 'Unknown',
        projectColor: project?.color || 'gray',
        count: item._count.id,
      };
    });
  }

  // Get task completion trend (last 7 days) - system-wide
  async getCompletionTrend(_userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const completedTasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
        },
      },
      select: {
        updatedAt: true,
      },
    });

    // Group by date
    const trendData: { [key: string]: number } = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      trendData[dateKey] = 0;
    }

    completedTasks.forEach((task) => {
      const dateKey = task.updatedAt.toISOString().split('T')[0];
      if (trendData[dateKey] !== undefined) {
        trendData[dateKey]++;
      }
    });

    return Object.entries(trendData)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get recent activity (system-wide)
  async getRecentActivity(_userId: string, limit: number = 10) {
    const recentTasks = await prisma.task.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      include: {
        project: {
          select: {
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return recentTasks;
  }

  // Get user statistics (system-wide)
  async getUserStats(_userId: string) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            createdTasks: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: {
        createdTasks: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      tasksCreated: user._count.createdTasks,
      tasksAssigned: user._count.assignedTasks,
      totalTasks: user._count.createdTasks + user._count.assignedTasks,
    }));
  }

  // Get project-specific analytics
  async getProjectAnalytics(projectId: string, _userId: string) {
    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    const [totalTasks, completedTasks, pendingTasks, tasksByPriority] = await Promise.all([
      prisma.task.count({
        where: { projectId },
      }),
      prisma.task.count({
        where: { projectId, status: 'COMPLETED' },
      }),
      prisma.task.count({
        where: { projectId, status: 'PENDING' },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),
    ]);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      project: {
        id: project.id,
        name: project.name,
        color: project.color,
        creator: project.creator,
      },
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: parseFloat(completionRate.toFixed(1)),
      },
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        count: item._count.id,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();

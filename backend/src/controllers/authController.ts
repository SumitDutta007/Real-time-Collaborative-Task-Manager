import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import jwt from 'jsonwebtoken';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { email, name, image } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and name are required',
      });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          image,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
        },
      });

      // Auto-link pending tasks
      await prisma.task.updateMany({
        where: {
          pendingAssigneeEmail: email,
        },
        data: {
          assigneeId: user.id,
          pendingAssigneeEmail: null,
        },
      });
    }

    // Generate JWT token for API authentication
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.error('Sync user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync user',
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      name: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }
};

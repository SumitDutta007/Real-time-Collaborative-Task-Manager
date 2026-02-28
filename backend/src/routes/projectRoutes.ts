import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// Get all projects (visible to all authenticated users)
router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    // Show all projects to all users for collaboration
    const projects = await prisma.project.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: [
        { favorite: "desc" },
        { updatedAt: "desc" },
      ],
    });

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get single project with tasks (accessible to all authenticated users)
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
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
        tasks: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create a new project
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, favorite } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || "blue",
        favorite: favorite || false,
        creatorId: userId!,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
});

// Update a project
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, favorite } = req.body;
    const userId = req.user?.id;

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(favorite !== undefined && { favorite }),
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project (and all its tasks)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
});

// Toggle favorite status
router.patch("/:id/favorite", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        favorite: !existingProject.favorite,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.json(project);
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res.status(500).json({ error: "Failed to toggle favorite" });
  }
});

export default router;

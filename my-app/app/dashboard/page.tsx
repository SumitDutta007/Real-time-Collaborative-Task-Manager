"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types";
import { taskApi } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const fetchTasks = useCallback(async () => {
    try {
      const response = await taskApi.getAll();
      setTasks(response.data.tasks || response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTasks();

      // Set up real-time updates
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const socket = connectSocket(token);

        socket.on("task:created", (task: Task) => {
          setTasks((prev) => [task, ...prev]);
        });

        socket.on("task:updated", (updatedTask: Task) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          );
        });

        socket.on("task:deleted", (taskId: string) => {
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        });

        return () => {
          disconnectSocket();
        };
      }
    }
  }, [session, fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const handleTaskComplete = async (taskId: string) => {
    try {
      await taskApi.complete(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskApi.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user!} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Tasks",
              value: tasks.length,
              borderClass: "border-blue-500",
            },
            {
              label: "Pending",
              value: tasks.filter((t) => !t.completed).length,
              borderClass: "border-yellow-500",
            },
            {
              label: "Completed",
              value: tasks.filter((t) => t.completed).length,
              borderClass: "border-green-500",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${stat.borderClass}`}
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Task
          </motion.button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 animate-pulse h-24"
              />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-xl">No tasks found</p>
            <p className="text-sm mt-2">
              Create your first task to get started
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

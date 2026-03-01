"use client";

import { motion } from "framer-motion";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  LOW: "bg-green-100 text-green-700",
  NORMAL: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

export default function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md ${
        task.status === "COMPLETED" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onComplete(task.id)}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
              task.status === "COMPLETED"
                ? "bg-green-500 border-green-500"
                : "border-gray-300 hover:border-green-400"
            }`}
          >
            {task.status === "COMPLETED" && (
              <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-800 ${
                task.status === "COMPLETED" ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>

              {task.assignee && (
                <span className="text-xs text-gray-400">
                  Assigned to: {task.assignee.name || task.pendingAssigneeEmail}
                </span>
              )}

              {task.pendingAssigneeEmail && !task.assignee && (
                <span className="text-xs text-orange-400">
                  Pending: {task.pendingAssigneeEmail}
                </span>
              )}

              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {task.progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Delete task"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Task } from "@/types";
import { taskApi } from "@/lib/api";

interface EditTaskModalProps {
  task: Task;
  currentUserEmail: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

export default function EditTaskModal({
  task,
  currentUserEmail,
  onClose,
  onUpdated,
}: EditTaskModalProps) {
  const isCreator = task.creator?.email === currentUserEmail;
  const isAssignee =
    task.assignee?.email === currentUserEmail ||
    task.pendingAssigneeEmail === currentUserEmail;

  // Creator fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ""
  );
  const [assigneeEmail, setAssigneeEmail] = useState(
    task.assignee?.email ?? task.pendingAssigneeEmail ?? ""
  );

  // Shared / assignee fields
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [status, setStatus] = useState<"PENDING" | "COMPLETED">(task.status);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When progress changes, auto-complete at 100
  const handleProgressChange = (val: number) => {
    setProgress(val);
    if (val === 100) setStatus("COMPLETED");
    else if (status === "COMPLETED" && val < 100) setStatus("PENDING");
  };

  // When status toggled to COMPLETED, snap progress to 100
  const handleStatusToggle = () => {
    if (status === "PENDING") {
      setStatus("COMPLETED");
      setProgress(100);
    } else {
      setStatus("PENDING");
      if (progress === 100) setProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let payload: Record<string, unknown>;

      if (isCreator) {
        payload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          assigneeEmail: assigneeEmail.trim() || undefined,
          progress,
          status,
        };
      } else {
        // Assignee — only progress + status
        payload = { progress, status };
      }

      const res = await taskApi.update(task.id, payload);
      onUpdated(res.data.data.task);
      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isCreator && !isAssignee) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-gray-500 text-sm mb-4">
            You don&apos;t have permission to edit this task.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Task</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isCreator ? "You are the creator — full edit access" : "You are the assignee — update progress & status"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── CREATOR FIELDS ── */}
          {isCreator && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "LOW" | "NORMAL" | "HIGH")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee Email
                </label>
                <input
                  type="email"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="border-gray-100" />
            </>
          )}

          {/* ── PROGRESS + STATUS (both roles) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Progress</label>
              <span className="text-sm font-semibold text-blue-600">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${progress}%, #e5e7eb ${progress}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span className="text-blue-400 text-xs">100% → auto-complete</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                status === "COMPLETED"
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-blue-300 bg-blue-50 text-blue-700"
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${status === "COMPLETED" ? "bg-green-500" : "bg-blue-400"}`} />
              {status === "COMPLETED" ? "Completed" : "In Progress"}
              <span className="text-xs text-gray-400 ml-1">(click to toggle)</span>
            </button>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isCreator && !title.trim())}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

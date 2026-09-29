"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  toggleTodo,
  editTodo,
  deleteTodo,
  updatePriority,
  updateDueDate,
  updateCategory,
} from "./actions";
import type { Priority, Todo } from "@/db/schema";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function isOverdue(dueDate: string | null, completed: boolean) {
  if (!dueDate || completed) return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

export function TodoItem({
  todo,
  dragDisabled,
}: {
  todo: Todo;
  dragDisabled: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [isPending, startTransition] = useTransition();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function commitEdit() {
    setIsEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== todo.title) {
      startTransition(() => editTodo(todo.id, trimmed));
    } else {
      setTitle(todo.title);
    }
  }

  const overdue = isOverdue(todo.dueDate, todo.completed);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border bg-white/80 px-3 py-3 shadow-sm transition-colors dark:bg-zinc-900/60 ${
        isDragging
          ? "border-blue-400 shadow-md"
          : "border-black/5 hover:border-black/10 dark:border-white/10 dark:hover:border-white/20"
      }`}
    >
      {!dragDisabled && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
          aria-label="Reorder"
        >
          <GripVertical size={18} />
        </button>
      )}

      <button
        onClick={() => startTransition(() => toggleTodo(todo.id, !todo.completed))}
        disabled={isPending}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        className="shrink-0 text-blue-600 disabled:opacity-50 dark:text-blue-400"
      >
        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-zinc-300 dark:text-zinc-600" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {isEditing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setTitle(todo.title);
                setIsEditing(false);
              }
            }}
            className="rounded border border-black/20 bg-transparent px-2 py-1 text-sm outline-none dark:border-white/20"
          />
        ) : (
          <span
            onDoubleClick={() => setIsEditing(true)}
            className={`truncate text-sm ${
              todo.completed ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {todo.title}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={todo.priority}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() => updatePriority(todo.id, e.target.value as Priority))
            }
            className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-medium capitalize outline-none ${PRIORITY_STYLES[todo.priority]}`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${
              overdue
                ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                : "border-black/10 text-zinc-500 dark:border-white/10 dark:text-zinc-400"
            }`}
          >
            {overdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
            <input
              type="date"
              value={todo.dueDate ?? ""}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => updateDueDate(todo.id, e.target.value || null))
              }
              className="w-[6.5rem] bg-transparent outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </label>

          <label className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-0.5 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <Tag size={12} />
            <input
              defaultValue={todo.category ?? ""}
              disabled={isPending}
              placeholder="category"
              onBlur={(e) => {
                if (e.target.value.trim() !== (todo.category ?? "")) {
                  startTransition(() => updateCategory(todo.id, e.target.value));
                }
              }}
              className="w-20 bg-transparent outline-none placeholder:text-zinc-400"
            />
          </label>
        </div>
      </div>

      <button
        onClick={() => startTransition(() => deleteTodo(todo.id))}
        disabled={isPending}
        aria-label={`Delete ${todo.title}`}
        className="shrink-0 text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 disabled:opacity-50 dark:text-zinc-600"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

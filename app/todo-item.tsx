"use client";

import { useState, useTransition } from "react";
import { toggleTodo, editTodo, deleteTodo } from "./actions";
import type { Todo } from "@/db/schema";

export function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [isPending, startTransition] = useTransition();

  function commitEdit() {
    setIsEditing(false);
    if (title.trim() && title.trim() !== todo.title) {
      startTransition(() => editTodo(todo.id, title));
    } else {
      setTitle(todo.title);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <input
        type="checkbox"
        checked={todo.completed}
        disabled={isPending}
        onChange={(e) => startTransition(() => toggleTodo(todo.id, e.target.checked))}
        className="size-4 shrink-0 accent-blue-600"
      />

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
          className="flex-1 rounded border border-black/20 bg-transparent px-2 py-1 text-sm outline-none dark:border-white/20"
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 text-sm ${todo.completed ? "text-black/40 line-through dark:text-white/40" : ""}`}
        >
          {todo.title}
        </span>
      )}

      <button
        onClick={() => startTransition(() => deleteTodo(todo.id))}
        disabled={isPending}
        className="shrink-0 text-xs text-red-500 hover:text-red-600"
        aria-label={`Delete ${todo.title}`}
      >
        Delete
      </button>
    </li>
  );
}

"use client";

import { useRef, useTransition } from "react";
import { Plus, Calendar, Tag } from "lucide-react";
import { addTodo } from "./actions";

export function AddTodoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await addTodo(formData);
          formRef.current?.reset();
        });
      }}
      className="flex flex-col gap-2 rounded-xl border border-black/5 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
    >
      <div className="flex gap-2">
        <input
          name="title"
          placeholder="What needs doing?"
          required
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <select
          name="priority"
          defaultValue="medium"
          className="rounded-full border border-black/10 bg-transparent px-2.5 py-1 outline-none dark:border-white/10"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>

        <label className="flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 dark:border-white/10">
          <Calendar size={12} />
          <input
            type="date"
            name="dueDate"
            className="bg-transparent outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </label>

        <label className="flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 dark:border-white/10">
          <Tag size={12} />
          <input
            name="category"
            placeholder="category"
            className="w-20 bg-transparent outline-none placeholder:text-zinc-400"
          />
        </label>
      </div>
    </form>
  );
}

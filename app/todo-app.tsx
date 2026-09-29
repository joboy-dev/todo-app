"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Search,
  ListChecks,
  ListTodo,
  ListFilter,
  CheckCheck,
  Eraser,
  ArrowDownWideNarrow,
} from "lucide-react";
import { TodoItem } from "./todo-item";
import { clearCompleted, toggleAll, reorderTodos } from "./actions";
import type { Todo } from "@/db/schema";

type StatusFilter = "all" | "active" | "completed";
type SortMode = "manual" | "priority" | "dueDate";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export function TodoApp({ todos }: { todos: Todo[] }) {
  const [prevTodos, setPrevTodos] = useState(todos);
  const [localTodos, setLocalTodos] = useState(todos);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [, startTransition] = useTransition();

  if (todos !== prevTodos) {
    setPrevTodos(todos);
    setLocalTodos(todos);
  }

  const categories = useMemo(
    () => Array.from(new Set(localTodos.map((t) => t.category).filter(Boolean))) as string[],
    [localTodos]
  );

  const remaining = localTodos.filter((t) => !t.completed).length;

  const isDefaultView =
    status === "all" && category === "all" && search.trim() === "" && sortMode === "manual";

  const visible = useMemo(() => {
    let list = [...localTodos];

    if (status === "active") list = list.filter((t) => !t.completed);
    if (status === "completed") list = list.filter((t) => t.completed);
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (sortMode === "priority") {
      list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    } else if (sortMode === "dueDate") {
      list.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return list;
  }, [localTodos, status, category, search, sortMode]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visible.findIndex((t) => t.id === active.id);
    const newIndex = visible.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);

    setLocalTodos((prev) => {
      const map = new Map(reordered.map((t, i) => [t.id, i]));
      return [...prev].sort((a, b) => (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0));
    });

    startTransition(() => reorderTodos(reordered.map((t) => t.id)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Search size={16} className="shrink-0 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search todos..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["all", "active", "completed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-2.5 py-1 capitalize transition-colors ${
                  status === s
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <label className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              <ListFilter size={12} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <ArrowDownWideNarrow size={12} />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent outline-none"
            >
              <option value="manual">Manual order</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due date</option>
            </select>
          </label>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => startTransition(() => toggleAll(remaining > 0))}
              className="flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-zinc-600 hover:border-black/20 dark:border-white/10 dark:text-zinc-300"
            >
              <CheckCheck size={12} />
              {remaining > 0 ? "Complete all" : "Undo all"}
            </button>
            <button
              onClick={() => startTransition(() => clearCompleted())}
              className="flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-zinc-600 hover:border-black/20 dark:border-white/10 dark:text-zinc-300"
            >
              <Eraser size={12} />
              Clear completed
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-1 text-xs text-zinc-500 dark:text-zinc-400">
        {remaining > 0 ? <ListTodo size={14} /> : <ListChecks size={14} />}
        {remaining} item{remaining === 1 ? "" : "s"} left
      </div>

      {visible.length === 0 ? (
        <p className="px-1 text-sm text-zinc-500">Nothing here — try a different filter, or add a todo above.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {visible.map((todo) => (
                <TodoItem key={todo.id} todo={todo} dragDisabled={!isDefaultView} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { todos, type Priority } from "@/db/schema";

export async function addTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const priority = (formData.get("priority") as Priority | null) ?? "medium";
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${todos.sortOrder}), 0)` })
    .from(todos);

  await db.insert(todos).values({
    title,
    priority,
    dueDate,
    category,
    sortOrder: maxOrder + 1,
  });
  revalidatePath("/");
}

export async function toggleTodo(id: number, completed: boolean) {
  await db.update(todos).set({ completed }).where(eq(todos.id, id));
  revalidatePath("/");
}

export async function editTodo(id: number, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;

  await db.update(todos).set({ title: trimmed }).where(eq(todos.id, id));
  revalidatePath("/");
}

export async function updatePriority(id: number, priority: Priority) {
  await db.update(todos).set({ priority }).where(eq(todos.id, id));
  revalidatePath("/");
}

export async function updateDueDate(id: number, dueDate: string | null) {
  await db.update(todos).set({ dueDate }).where(eq(todos.id, id));
  revalidatePath("/");
}

export async function updateCategory(id: number, category: string | null) {
  await db
    .update(todos)
    .set({ category: category?.trim() || null })
    .where(eq(todos.id, id));
  revalidatePath("/");
}

export async function deleteTodo(id: number) {
  await db.delete(todos).where(eq(todos.id, id));
  revalidatePath("/");
}

export async function clearCompleted() {
  await db.delete(todos).where(eq(todos.completed, true));
  revalidatePath("/");
}

export async function toggleAll(completed: boolean) {
  await db.update(todos).set({ completed });
  revalidatePath("/");
}

export async function reorderTodos(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(todos).set({ sortOrder: index }).where(eq(todos.id, id))
    )
  );
  revalidatePath("/");
}

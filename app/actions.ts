"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { todos } from "@/db/schema";

export async function addTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await db.insert(todos).values({ title });
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

export async function deleteTodo(id: number) {
  await db.delete(todos).where(eq(todos.id, id));
  revalidatePath("/");
}

"use client";
import { projectsTable, generationsTable, templatesTable } from "./db";
import type { Project, Generation } from "@/core/domain/types";

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  cardType?: string;
  style?: string;
  createdAt: number;
}

/* ----------------------------- Projects ----------------------------- */

export async function listProjects(): Promise<Project[]> {
  const items: Project[] = [];
  await projectsTable.iterate<Project, void>((v) => {
    items.push(v);
  });
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | null> {
  return (await projectsTable.getItem<Project>(id)) ?? null;
}

export async function saveProject(project: Project): Promise<Project> {
  await projectsTable.setItem(project.id, project);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  await projectsTable.removeItem(id);
  const gens = await listGenerations(id);
  await Promise.all(gens.map((g) => generationsTable.removeItem(g.id)));
}

/* --------------------------- Generations ---------------------------- */

export async function listGenerations(projectId?: string): Promise<Generation[]> {
  const items: Generation[] = [];
  await generationsTable.iterate<Generation, void>((v) => {
    if (!projectId || v.projectId === projectId) items.push(v);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveGeneration(gen: Generation): Promise<Generation> {
  await generationsTable.setItem(gen.id, gen);
  return gen;
}

export async function deleteGeneration(id: string): Promise<void> {
  await generationsTable.removeItem(id);
}

/* ---------------------------- Templates ----------------------------- */

export async function listTemplates(): Promise<PromptTemplate[]> {
  const items: PromptTemplate[] = [];
  await templatesTable.iterate<PromptTemplate, void>((v) => {
    items.push(v);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveTemplate(t: PromptTemplate): Promise<PromptTemplate> {
  await templatesTable.setItem(t.id, t);
  return t;
}

export async function deleteTemplate(id: string): Promise<void> {
  await templatesTable.removeItem(id);
}

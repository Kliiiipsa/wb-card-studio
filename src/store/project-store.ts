"use client";
import { create } from "zustand";
import type { Project, Generation, ProductInfo, StoredImage } from "@/core/domain/types";
import { EMPTY_PRODUCT } from "@/core/domain/types";
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  listGenerations,
  saveGeneration,
  deleteGeneration,
} from "@/core/storage/repository";
import { uid } from "@/lib/utils";

interface ProjectState {
  projects: Project[];
  current: Project | null;
  generations: Generation[];
  loaded: boolean;

  loadProjects: () => Promise<void>;
  createProject: (title: string, product?: Partial<ProductInfo>) => Promise<Project>;
  openProject: (id: string) => Promise<Project | null>;
  updateCurrent: (patch: Partial<Project>) => Promise<void>;
  updateProduct: (patch: Partial<ProductInfo>) => Promise<void>;
  addUpload: (image: StoredImage) => Promise<void>;
  removeProject: (id: string) => Promise<void>;

  addGeneration: (gen: Generation) => Promise<void>;
  removeGeneration: (id: string) => Promise<void>;
  loadGenerations: (projectId?: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  current: null,
  generations: [],
  loaded: false,

  loadProjects: async () => {
    const projects = await listProjects();
    set({ projects, loaded: true });
  },

  createProject: async (title, product) => {
    const now = Date.now();
    const project: Project = {
      id: uid("prj"),
      title: title.trim() || "Новый проект",
      product: { ...EMPTY_PRODUCT, ...product },
      uploads: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveProject(project);
    set((s) => ({ projects: [project, ...s.projects], current: project }));
    return project;
  },

  openProject: async (id) => {
    const project = await getProject(id);
    if (project) {
      const gens = await listGenerations(id);
      set({ current: project, generations: gens });
    }
    return project;
  },

  updateCurrent: async (patch) => {
    const current = get().current;
    if (!current) return;
    const updated: Project = { ...current, ...patch, updatedAt: Date.now() };
    await saveProject(updated);
    set((s) => ({
      current: updated,
      projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
  },

  updateProduct: async (patch) => {
    const current = get().current;
    if (!current) return;
    await get().updateCurrent({ product: { ...current.product, ...patch } });
  },

  addUpload: async (image) => {
    const current = get().current;
    if (!current) return;
    await get().updateCurrent({ uploads: [image, ...current.uploads] });
  },

  removeProject: async (id) => {
    await deleteProject(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      current: s.current?.id === id ? null : s.current,
    }));
  },

  addGeneration: async (gen) => {
    await saveGeneration(gen);
    set((s) => ({ generations: [gen, ...s.generations] }));
  },

  removeGeneration: async (id) => {
    await deleteGeneration(id);
    set((s) => ({ generations: s.generations.filter((g) => g.id !== id) }));
  },

  loadGenerations: async (projectId) => {
    const gens = await listGenerations(projectId);
    set({ generations: gens });
  },
}));

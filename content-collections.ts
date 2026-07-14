import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const compile = (
  context: Parameters<typeof compileMDX>[0],
  document: Parameters<typeof compileMDX>[1],
) => compileMDX(context, document, { remarkPlugins: [remarkGfm] });

const engineeringLogs = defineCollection({
  name: "engineeringLogs",
  directory: "content/engineering-logs",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    week: z.string(),
    status: z.enum(["Completed", "In progress", "Blocked"]),
    tags: z.array(z.string()),
    objective: z.string(),
    objectives: z.array(z.string()),
    workCompleted: z.array(z.string()),
    problemsEncountered: z.array(z.string()),
    technicalDecisions: z.array(z.string()),
    lessonsLearned: z.array(z.string()),
    nextWeekGoals: z.array(z.string()),
    photographIds: z.array(z.string()),
    githubCommits: z.array(
      z.object({
        hash: z.string(),
        summary: z.string(),
        url: z.string().url().nullable(),
      }),
    ),
    testingNotes: z.array(z.string()),
    readingTime: z.string(),
    difficulty: z.enum(["Foundational", "Moderate", "Advanced"]),
    relatedProjects: z.array(z.string()),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    slug: document._meta.path,
    mdx: await compile(context, document),
  }),
});

const researchNotes = defineCollection({
  name: "researchNotes",
  directory: "content/research",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    status: z.enum(["Research note", "Literature review", "Planned study"]),
    topics: z.array(z.string()),
    tags: z.array(z.string()),
    readingTime: z.string(),
    abstract: z.string(),
    problemStatement: z.string(),
    technicalBackground: z.string(),
    currentResearch: z.string(),
    references: z.array(
      z.object({
        title: z.string(),
        source: z.string(),
        url: z.string().url().nullable(),
      }),
    ),
    futureWork: z.array(z.string()),
    relatedProjects: z.array(z.string()),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    slug: document._meta.path,
    mdx: await compile(context, document),
  }),
});

const documentation = defineCollection({
  name: "documentation",
  directory: "content/docs",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    section: z.string(),
    updated: z.string(),
    version: z.string(),
    status: z.enum(["Active", "Draft", "Superseded"]),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    slug: document._meta.path,
    mdx: await compile(context, document),
  }),
});

export default defineConfig({
  content: [engineeringLogs, researchNotes, documentation],
});

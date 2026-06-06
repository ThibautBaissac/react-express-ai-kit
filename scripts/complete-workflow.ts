#!/usr/bin/env node

/**
 * CLI script to mark a task's workflow as complete.
 * Used by Claude agents to signal that the implementation loop should stop.
 *
 * Self-contained: the status is persisted to `tasks/task-<id>.status.json`.
 * No database or server module is required.
 *
 * Usage: tsx scripts/complete-workflow.ts <taskId>
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

type TaskStatus = {
  taskId: number;
  planificationComplete: boolean;
  workflowComplete: boolean;
  updatedAt: string;
};

const tasksDir = resolve(process.cwd(), "tasks");
const docPath = (id: number) => resolve(tasksDir, `task-${id}.md`);
const statusPath = (id: number) => resolve(tasksDir, `task-${id}.status.json`);

function readStatus(id: number): TaskStatus {
  const path = statusPath(id);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as TaskStatus;
  }
  return {
    taskId: id,
    planificationComplete: false,
    workflowComplete: false,
    updatedAt: new Date().toISOString(),
  };
}

function writeStatus(status: TaskStatus): void {
  writeFileSync(
    statusPath(status.taskId),
    `${JSON.stringify(status, null, 2)}\n`,
  );
}

function taskTitle(id: number): string {
  const path = docPath(id);
  if (!existsSync(path)) return "(no title)";
  const heading = readFileSync(path, "utf8")
    .split("\n")
    .find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : "(no title)";
}

function completeWorkflow(taskId: string | undefined): void {
  // Validate taskId
  if (!taskId) {
    console.error(`${colors.red}Error:${colors.reset} Task ID is required`);
    console.log(`\nUsage: tsx scripts/complete-workflow.ts <taskId>`);
    process.exit(1);
  }

  const parsedTaskId = parseInt(taskId, 10);
  if (isNaN(parsedTaskId)) {
    console.error(
      `${colors.red}Error:${colors.reset} Task ID must be a number`,
    );
    process.exit(1);
  }

  // The task doc is the source of truth that the task exists.
  if (!existsSync(docPath(parsedTaskId))) {
    console.error(
      `${colors.red}Error:${colors.reset} Task doc not found at tasks/task-${parsedTaskId}.md`,
    );
    process.exit(1);
  }

  const status = readStatus(parsedTaskId);

  // Check if already complete
  if (status.workflowComplete) {
    console.log(
      `${colors.cyan}Info:${colors.reset} Task ${parsedTaskId} workflow is already marked as complete`,
    );
    process.exit(0);
  }

  // Mark workflow as complete
  try {
    status.workflowComplete = true;
    status.updatedAt = new Date().toISOString();
    writeStatus(status);

    console.log("");
    console.log(
      `${colors.green}${colors.bright}Workflow marked as complete!${colors.reset}`,
    );
    console.log(`${colors.cyan}Task ID:${colors.reset} ${parsedTaskId}`);
    console.log(
      `${colors.cyan}Title:${colors.reset} ${taskTitle(parsedTaskId)}`,
    );
    console.log("");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `${colors.red}Error:${colors.reset} Failed to update task status:`,
      message,
    );
    process.exit(1);
  }
}

// Main
completeWorkflow(process.argv[2]);

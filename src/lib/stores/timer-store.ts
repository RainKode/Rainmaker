"use client";

import { create } from "zustand";

type TimerState = {
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string | null; // ISO string
  isRunning: boolean;
  elapsed: number; // seconds
};

type TimerActions = {
  start: (taskId: string, taskTitle: string) => void;
  stop: () => { taskId: string; startedAt: string; durationMinutes: number } | null;
  reset: () => void;
  tick: () => void;
  restore: (state: { taskId: string; taskTitle: string; startedAt: string }) => void;
};

export const useTimerStore = create<TimerState & TimerActions>((set, get) => ({
  taskId: null,
  taskTitle: null,
  startedAt: null,
  isRunning: false,
  elapsed: 0,

  start: (taskId, taskTitle) => {
    set({
      taskId,
      taskTitle,
      startedAt: new Date().toISOString(),
      isRunning: true,
      elapsed: 0,
    });
  },

  stop: () => {
    const { taskId, startedAt, elapsed } = get();
    if (!taskId || !startedAt) return null;

    const result = {
      taskId,
      startedAt,
      durationMinutes: Math.max(1, Math.round(elapsed / 60)),
    };

    set({
      taskId: null,
      taskTitle: null,
      startedAt: null,
      isRunning: false,
      elapsed: 0,
    });

    return result;
  },

  reset: () => {
    set({
      taskId: null,
      taskTitle: null,
      startedAt: null,
      isRunning: false,
      elapsed: 0,
    });
  },

  tick: () => {
    const { isRunning, startedAt } = get();
    if (!isRunning || !startedAt) return;
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    set({ elapsed });
  },

  restore: ({ taskId, taskTitle, startedAt }) => {
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    set({
      taskId,
      taskTitle,
      startedAt,
      isRunning: true,
      elapsed,
    });
  },
}));

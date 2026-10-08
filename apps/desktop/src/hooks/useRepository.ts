import { create } from 'zustand';

export interface RepoState {
  repoPath: string;
  isIndexed: boolean;
  branch: string;
  totalFiles: number;
  totalChunks: number;
  lastIndexedAt: string | null;
  setRepoPath: (path: string) => void;
  setIndexedInfo: (info: {
    isIndexed: boolean;
    totalFiles?: number;
    totalChunks?: number;
    lastIndexedAt?: string;
    branch?: string;
  }) => void;
  reset: () => void;
}

export const useRepository = create<RepoState>((set) => ({
  repoPath: '',
  isIndexed: false,
  branch: 'main',
  totalFiles: 0,
  totalChunks: 0,
  lastIndexedAt: null,
  setRepoPath: (path) => set({ repoPath: path }),
  setIndexedInfo: (info) =>
    set((state) => ({
      ...state,
      ...info,
    })),
  reset: () =>
    set({
      repoPath: '',
      isIndexed: false,
      branch: 'main',
      totalFiles: 0,
      totalChunks: 0,
      lastIndexedAt: null,
    }),
}));

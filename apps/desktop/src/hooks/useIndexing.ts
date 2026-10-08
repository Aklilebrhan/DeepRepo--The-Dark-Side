import { create } from 'zustand';
import { IndexProgress } from '@deeprepo/core';

export interface IndexingState {
  isIndexing: boolean;
  progress: IndexProgress | null;
  error: string | null;
  startIndexing: () => void;
  updateProgress: (progress: IndexProgress) => void;
  finishIndexing: () => void;
  setError: (err: string | null) => void;
}

export const useIndexing = create<IndexingState>((set) => ({
  isIndexing: false,
  progress: null,
  error: null,
  startIndexing: () =>
    set({
      isIndexing: true,
      error: null,
      progress: {
        phase: 'scanning',
        filesScanned: 0,
        totalFiles: 0,
        chunksCreated: 0,
        embeddingsDone: 0,
        totalChunks: 0,
      },
    }),
  updateProgress: (progress) => set({ progress }),
  finishIndexing: () => set({ isIndexing: false }),
  setError: (err) => set({ error: err, isIndexing: false }),
}));

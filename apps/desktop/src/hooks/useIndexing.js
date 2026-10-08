import { create } from 'zustand';
export const useIndexing = create((set) => ({
    isIndexing: false,
    progress: null,
    error: null,
    startIndexing: () => set({
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
//# sourceMappingURL=useIndexing.js.map
import { create } from 'zustand';
export const useRepository = create((set) => ({
    repoPath: '',
    isIndexed: false,
    branch: 'main',
    totalFiles: 0,
    totalChunks: 0,
    lastIndexedAt: null,
    setRepoPath: (path) => set({ repoPath: path }),
    setIndexedInfo: (info) => set((state) => ({
        ...state,
        ...info,
    })),
    reset: () => set({
        repoPath: '',
        isIndexed: false,
        branch: 'main',
        totalFiles: 0,
        totalChunks: 0,
        lastIndexedAt: null,
    }),
}));
//# sourceMappingURL=useRepository.js.map
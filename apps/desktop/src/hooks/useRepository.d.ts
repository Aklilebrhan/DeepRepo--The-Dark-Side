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
export declare const useRepository: import('zustand').UseBoundStore<
  import('zustand').StoreApi<RepoState>
>;
//# sourceMappingURL=useRepository.d.ts.map

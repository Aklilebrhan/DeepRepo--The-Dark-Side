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
export declare const useIndexing: import('zustand').UseBoundStore<
  import('zustand').StoreApi<IndexingState>
>;
//# sourceMappingURL=useIndexing.d.ts.map

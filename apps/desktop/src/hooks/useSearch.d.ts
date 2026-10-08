import { SearchResult } from '@deeprepo/core';
export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  selectedChunk: SearchResult['chunk'] | null;
  setQuery: (q: string) => void;
  setResults: (results: SearchResult[]) => void;
  setIsSearching: (val: boolean) => void;
  setSelectedChunk: (chunk: SearchResult['chunk'] | null) => void;
  clear: () => void;
}
export declare const useSearch: import('zustand').UseBoundStore<
  import('zustand').StoreApi<SearchState>
>;
//# sourceMappingURL=useSearch.d.ts.map

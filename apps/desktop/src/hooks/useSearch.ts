import { create } from 'zustand';
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

export const useSearch = create<SearchState>((set) => ({
  query: '',
  results: [],
  isSearching: false,
  selectedChunk: null,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSelectedChunk: (selectedChunk) => set({ selectedChunk }),
  clear: () => set({ query: '', results: [], selectedChunk: null }),
}));

import { create } from 'zustand';
export const useSearch = create((set) => ({
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
//# sourceMappingURL=useSearch.js.map
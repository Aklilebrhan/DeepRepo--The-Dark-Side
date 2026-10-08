import React from 'react';
import { SearchResult } from '@deeprepo/core';
export interface SearchResultsProps {
  onSelectChunk?: (chunk: SearchResult['chunk']) => void;
  onExplainChunk?: (chunk: SearchResult['chunk']) => void;
  onGenerateTestChunk?: (chunk: SearchResult['chunk']) => void;
}
export declare const SearchResults: React.FC<SearchResultsProps>;
//# sourceMappingURL=SearchResults.d.ts.map

import React from 'react';
import { CodeChunk } from '@deeprepo/core';
export interface CodePreviewProps {
  chunk: CodeChunk | null;
  onGenerateTests?: (chunk: CodeChunk) => void;
  onExplain?: (chunk: CodeChunk) => void;
}
export declare const CodePreview: React.FC<CodePreviewProps>;
//# sourceMappingURL=CodePreview.d.ts.map

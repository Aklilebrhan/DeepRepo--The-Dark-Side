import { describe, it, expect, beforeEach } from 'vitest';
import { useRepository } from '../hooks/useRepository';
import { useIndexing } from '../hooks/useIndexing';
import { useSearch } from '../hooks/useSearch';
import { useChat } from '../hooks/useChat';
describe('Desktop Hooks State Management', () => {
    beforeEach(() => {
        useRepository.getState().reset();
        useIndexing.setState({ isIndexing: false, progress: null, error: null });
        useSearch.getState().clear();
        useChat.getState().clearChat();
    });
    it('manages repository state correctly', () => {
        const { setRepoPath, setIndexedInfo } = useRepository.getState();
        setRepoPath('C:/test/repo');
        expect(useRepository.getState().repoPath).toBe('C:/test/repo');
        setIndexedInfo({ isIndexed: true, totalChunks: 42, branch: 'develop' });
        expect(useRepository.getState().isIndexed).toBe(true);
        expect(useRepository.getState().totalChunks).toBe(42);
        expect(useRepository.getState().branch).toBe('develop');
    });
    it('manages indexing lifecycle and errors', () => {
        const { startIndexing, updateProgress, finishIndexing, setError } = useIndexing.getState();
        startIndexing();
        expect(useIndexing.getState().isIndexing).toBe(true);
        updateProgress({
            phase: 'embedding',
            filesScanned: 5,
            totalFiles: 5,
            chunksCreated: 10,
            embeddingsDone: 5,
            totalChunks: 10,
        });
        expect(useIndexing.getState().progress?.phase).toBe('embedding');
        finishIndexing();
        expect(useIndexing.getState().isIndexing).toBe(false);
        setError('OOM exception');
        expect(useIndexing.getState().error).toBe('OOM exception');
    });
    it('manages search queries and selected chunks', () => {
        const { setQuery, setResults, setSelectedChunk } = useSearch.getState();
        setQuery('authenticate user');
        expect(useSearch.getState().query).toBe('authenticate user');
        const mockChunk = {
            id: 'chunk-1',
            content: 'function auth() {}',
            metadata: {
                file_path: 'src/auth.ts',
                language: 'typescript',
                start_line: 1,
                end_line: 3,
                symbol_name: 'auth',
                symbol_type: 'function',
                dependencies: [],
                imports_from: [],
                file_hash: 'h1',
                chunk_index: 0,
                tokens: 10,
            },
        };
        setResults([{ chunk: mockChunk, score: 0.95 }]);
        expect(useSearch.getState().results).toHaveLength(1);
        setSelectedChunk(mockChunk);
        expect(useSearch.getState().selectedChunk?.id).toBe('chunk-1');
    });
    it('manages streaming chat messages and history', () => {
        const { addMessage, appendToLastMessage, finalizeLastMessage } = useChat.getState();
        addMessage({ role: 'user', content: 'Explain DB setup' });
        addMessage({ role: 'assistant', content: '', isStreaming: true });
        expect(useChat.getState().messages).toHaveLength(2);
        expect(useChat.getState().isStreaming).toBe(true);
        appendToLastMessage('First token. ');
        appendToLastMessage('Second token.');
        expect(useChat.getState().messages[1].content).toBe('First token. Second token.');
        finalizeLastMessage([{ filePath: 'src/db.ts', startLine: 1, endLine: 10 }]);
        expect(useChat.getState().isStreaming).toBe(false);
        expect(useChat.getState().messages[1].references).toHaveLength(1);
    });
});
//# sourceMappingURL=hooks.test.js.map
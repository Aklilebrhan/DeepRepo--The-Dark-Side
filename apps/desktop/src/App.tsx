import React, { useState, useEffect } from 'react';
import { RepoSelector } from './components/RepoSelector';
import { IndexingProgress } from './components/IndexingProgress';
import { SearchResults } from './components/SearchResults';
import { CodePreview } from './components/CodePreview';
import { ChatWindow } from './components/ChatWindow';
import { SettingsPanel } from './components/SettingsPanel';
import { useRepository } from './hooks/useRepository';
import { useIndexing } from './hooks/useIndexing';
import { useSearch } from './hooks/useSearch';
import { useChat } from './hooks/useChat';
import { Shield, Settings, MessageSquare, Code2, Search } from 'lucide-react';
import { CodeChunk } from '@deeprepo/core';

export const App: React.FC = () => {
  const { repoPath, isIndexed, setIndexedInfo } = useRepository();
  const { isIndexing, startIndexing, updateProgress, finishIndexing, setError } = useIndexing();
  const { query, setQuery, setResults, setIsSearching, selectedChunk, setSelectedChunk } =
    useSearch();
  const { addMessage, appendToLastMessage, finalizeLastMessage } = useChat();

  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'settings'>('chat');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [isOllamaConnected, setIsOllamaConnected] = useState(true);

  // Check Ollama connection on load
  const checkOllama = async () => {
    try {
      const res = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(3000) });
      setIsOllamaConnected(res.ok);
    } catch {
      setIsOllamaConnected(false);
    }
  };

  useEffect(() => {
    checkOllama();
  }, [ollamaHost]);

  // Indexing flow
  const handleIndexRequest = async (path: string) => {
    startIndexing();
    try {
      // Dynamic import of core indexer
      const { Indexer } = await import('@deeprepo/core');
      const indexer = new Indexer({ repoPath: path });

      const stats = await indexer.index((prog) => {
        updateProgress(prog);
      });

      setIndexedInfo({
        isIndexed: true,
        totalFiles: stats.filesIndexed,
        totalChunks: stats.chunksIndexed,
        lastIndexedAt: new Date().toISOString(),
      });
      finishIndexing();
    } catch (err: any) {
      setError(err.message || 'Indexing failed');
    }
  };

  // Search flow
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !repoPath) return;

    setIsSearching(true);
    try {
      const { Indexer, CodeRetriever } = await import('@deeprepo/core');
      const indexer = new Indexer({ repoPath });
      const retriever = new CodeRetriever({
        vectorDB: indexer.getVectorDB(),
        embeddingPipeline: indexer.getEmbeddingPipeline(),
      });

      const searchResults = await retriever.retrieve(query, 5);
      setResults(searchResults);
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Chat Q&A flow
  const handleSendMessage = async (userPrompt: string) => {
    addMessage({ role: 'user', content: userPrompt });
    addMessage({ role: 'assistant', content: '', isStreaming: true });

    try {
      const { Indexer, CodeRetriever, ContextBuilder, PromptTemplateEngine, OllamaClient } =
        await import('@deeprepo/core');

      const indexer = new Indexer({ repoPath });
      const retriever = new CodeRetriever({
        vectorDB: indexer.getVectorDB(),
        embeddingPipeline: indexer.getEmbeddingPipeline(),
      });

      // 1. Retrieve top-5 chunks
      const retrieved = await retriever.retrieve(userPrompt, 5);
      const references = retrieved.map((r) => ({
        filePath: r.chunk.metadata.file_path,
        startLine: r.chunk.metadata.start_line,
        endLine: r.chunk.metadata.end_line,
        symbolName: r.chunk.metadata.symbol_name,
      }));

      // 2. Assemble context window
      const contextBuilder = new ContextBuilder();
      const promptEngine = new PromptTemplateEngine();
      const assembled = contextBuilder.assemble(userPrompt, retrieved);

      const formatted = promptEngine.format('rag_chat', {
        context: assembled.formattedContext || 'No specific codebase matches found.',
        query: userPrompt,
      });

      // 3. Query local LLM with streaming
      const client = new OllamaClient({ host: ollamaHost, defaultModel: selectedModel });
      for await (const token of client.streamGenerate({
        system: formatted.system,
        prompt: formatted.prompt,
        model: selectedModel,
      })) {
        appendToLastMessage(token);
      }

      finalizeLastMessage(references);
    } catch (err: any) {
      appendToLastMessage(`\n\n⚠️ Error during local inference: ${err.message}`);
      finalizeLastMessage();
    }
  };

  // Test generation flow
  const handleGenerateTests = async (chunk: CodeChunk) => {
    setActiveTab('chat');
    const prompt = `Generate unit tests for ${chunk.metadata.symbol_name}`;
    addMessage({ role: 'user', content: prompt });
    addMessage({ role: 'assistant', content: '', isStreaming: true });

    try {
      const { TestGenerator, OllamaClient } = await import('@deeprepo/core');
      const client = new OllamaClient({ host: ollamaHost, defaultModel: selectedModel });
      const testGen = new TestGenerator({ llmClient: client });

      for await (const token of testGen.streamGenerateTests({
        symbol: {
          name: chunk.metadata.symbol_name,
          type: chunk.metadata.symbol_type,
          startLine: chunk.metadata.start_line,
          endLine: chunk.metadata.end_line,
          code: chunk.content,
        },
        filePath: chunk.metadata.file_path,
        language: String(chunk.metadata.language),
      })) {
        appendToLastMessage(token);
      }

      finalizeLastMessage([
        {
          filePath: chunk.metadata.file_path,
          startLine: chunk.metadata.start_line,
          endLine: chunk.metadata.end_line,
          symbolName: chunk.metadata.symbol_name,
        },
      ]);
    } catch (err: any) {
      // Fallback to static stub
      const { TestGenerator, OllamaClient } = await import('@deeprepo/core');
      const testGen = new TestGenerator({ llmClient: new OllamaClient() });
      const stub = testGen.createStaticTestStub(
        {
          name: chunk.metadata.symbol_name,
          type: chunk.metadata.symbol_type,
          startLine: chunk.metadata.start_line,
          endLine: chunk.metadata.end_line,
          code: chunk.content,
        },
        chunk.metadata.file_path,
        String(chunk.metadata.language),
      );
      appendToLastMessage(`\`\`\`typescript\n${stub}\n\`\`\``);
      finalizeLastMessage();
    }
  };

  // Code explanation flow
  const handleExplainCode = async (chunk: CodeChunk) => {
    setActiveTab('chat');
    const prompt = `Explain logic for ${chunk.metadata.symbol_name} in ${chunk.metadata.file_path}`;
    addMessage({ role: 'user', content: prompt });
    addMessage({ role: 'assistant', content: '', isStreaming: true });

    try {
      const { CodeExplainer, OllamaClient } = await import('@deeprepo/core');
      const client = new OllamaClient({ host: ollamaHost, defaultModel: selectedModel });
      const explainer = new CodeExplainer({ llmClient: client });

      for await (const token of explainer.streamExplain({
        code: chunk.content,
        filePath: chunk.metadata.file_path,
        startLine: chunk.metadata.start_line,
        endLine: chunk.metadata.end_line,
        language: String(chunk.metadata.language),
      })) {
        appendToLastMessage(token);
      }
      finalizeLastMessage([
        {
          filePath: chunk.metadata.file_path,
          startLine: chunk.metadata.start_line,
          endLine: chunk.metadata.end_line,
          symbolName: chunk.metadata.symbol_name,
        },
      ]);
    } catch (err: any) {
      appendToLastMessage(`⚠️ Error explaining code: ${err.message}`);
      finalizeLastMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-14 bg-slate-950/80 border-b border-slate-800/80 px-4 flex items-center justify-between flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/src/assets/logo.svg" alt="DeepRepo Logo" className="w-8 h-8" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-2">
              DeepRepo
              <span className="text-[11px] font-normal text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                The Dark Side
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Local Codebase RAG & Semantic Explorer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-xs text-slate-300">
            <Shield size={12} className="text-emerald-400" />
            <span className="text-[11px]">100% Offline</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={13} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings size={13} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Column: Repository & Search */}
        <div className="w-[440px] flex flex-col gap-3 flex-shrink-0">
          <RepoSelector onIndexRequest={handleIndexRequest} isIndexing={isIndexing} />

          <IndexingProgress />

          {/* Semantic Search Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col flex-1 overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <input
                type="text"
                placeholder="Semantic search (e.g. 'how do we authenticate?')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </form>

            <div className="flex-1 overflow-y-auto">
              <SearchResults
                onSelectChunk={(chunk) => {
                  setSelectedChunk(chunk);
                  setActiveTab('preview');
                }}
                onExplainChunk={handleExplainCode}
                onGenerateTestChunk={handleGenerateTests}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Panel (Chat, Code Preview, or Settings) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <ChatWindow onSendMessage={handleSendMessage} isReady={isIndexed || !!repoPath} />
          )}

          {activeTab === 'preview' && (
            <CodePreview
              chunk={selectedChunk}
              onGenerateTests={handleGenerateTests}
              onExplain={handleExplainCode}
            />
          )}

          {activeTab === 'settings' && (
            <div className="h-full flex items-center justify-center p-6">
              <SettingsPanel
                ollamaHost={ollamaHost}
                selectedModel={selectedModel}
                isOllamaConnected={isOllamaConnected}
                onSaveSettings={(h, m) => {
                  setOllamaHost(h);
                  setSelectedModel(m);
                }}
                onResetIndex={async () => {
                  if (repoPath) {
                    const { Indexer } = await import('@deeprepo/core');
                    const idx = new Indexer({ repoPath });
                    await idx.getVectorDB().reset();
                    setIndexedInfo({ isIndexed: false, totalChunks: 0 });
                  }
                }}
                onCheckConnection={checkOllama}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

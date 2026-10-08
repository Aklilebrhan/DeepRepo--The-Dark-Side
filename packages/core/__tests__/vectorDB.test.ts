import { describe, it, expect, beforeEach } from 'vitest';
import { VectorDB } from '../src/indexing/vectorDB';
import { VectorDocument } from '../src/types';

describe('VectorDB', () => {
  let db: VectorDB;

  beforeEach(() => {
    db = new VectorDB({ inMemory: true });
  });

  it('adds documents to collection', async () => {
    const doc: VectorDocument = {
      id: 'doc-1',
      content: 'export function login() {}',
      embedding: [1, 0, 0],
      metadata: {
        file_path: 'src/auth.ts',
        language: 'typescript',
        start_line: 1,
        end_line: 5,
        symbol_name: 'login',
        symbol_type: 'function',
        dependencies: [],
        imports_from: [],
        file_hash: 'abc',
        chunk_index: 0,
        tokens: 15,
      },
    };

    await db.addDocuments([doc]);
    expect(db.getCount()).toBe(1);
  });

  it('searches by query vector returning top results ordered by similarity', async () => {
    const docs: VectorDocument[] = [
      {
        id: 'doc-login',
        content: 'export function login() {}',
        embedding: [0.9, 0.1, 0.0],
        metadata: {
          file_path: 'src/auth.ts',
          language: 'typescript',
          start_line: 1,
          end_line: 5,
          symbol_name: 'login',
          symbol_type: 'function',
          dependencies: [],
          imports_from: [],
          file_hash: 'abc',
          chunk_index: 0,
          tokens: 15,
        },
      },
      {
        id: 'doc-database',
        content: 'export function connectDB() {}',
        embedding: [0.0, 0.9, 0.1],
        metadata: {
          file_path: 'src/db.ts',
          language: 'typescript',
          start_line: 1,
          end_line: 10,
          symbol_name: 'connectDB',
          symbol_type: 'function',
          dependencies: [],
          imports_from: [],
          file_hash: 'xyz',
          chunk_index: 0,
          tokens: 20,
        },
      },
    ];

    await db.addDocuments(docs);

    // Search close to login embedding
    const results = await db.search([1.0, 0.0, 0.0], 5);
    expect(results).toHaveLength(2);
    expect(results[0].chunk.id).toBe('doc-login');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('deletes documents from collection by id and file path', async () => {
    const doc: VectorDocument = {
      id: 'doc-auth',
      content: 'export function authenticate() {}',
      embedding: [0.5, 0.5, 0.0],
      metadata: {
        file_path: 'src/auth.ts',
        language: 'typescript',
        start_line: 1,
        end_line: 10,
        symbol_name: 'authenticate',
        symbol_type: 'function',
        dependencies: [],
        imports_from: [],
        file_hash: 'abc',
        chunk_index: 0,
        tokens: 25,
      },
    };

    await db.addDocuments([doc]);
    expect(db.getCount()).toBe(1);

    await db.delete(['doc-auth']);
    expect(db.getCount()).toBe(0);

    // Test delete by file path
    await db.addDocuments([doc]);
    const deletedCount = await db.deleteByFilePath('src/auth.ts');
    expect(deletedCount).toBe(1);
    expect(db.getCount()).toBe(0);
  });

  it('queries by metadata filter', async () => {
    const docs: VectorDocument[] = [
      {
        id: 'doc-1',
        content: 'class AuthService {}',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          file_path: 'src/auth.ts',
          language: 'typescript',
          start_line: 1,
          end_line: 20,
          symbol_name: 'AuthService',
          symbol_type: 'class',
          dependencies: [],
          imports_from: [],
          file_hash: 'h1',
          chunk_index: 0,
          tokens: 30,
        },
      },
      {
        id: 'doc-2',
        content: 'function verifyToken() {}',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          file_path: 'src/auth.ts',
          language: 'typescript',
          start_line: 25,
          end_line: 35,
          symbol_name: 'verifyToken',
          symbol_type: 'function',
          dependencies: [],
          imports_from: [],
          file_hash: 'h1',
          chunk_index: 0,
          tokens: 20,
        },
      },
    ];

    await db.addDocuments(docs);
    const classes = await db.queryByMetadata({ symbol_type: 'class' });
    expect(classes).toHaveLength(1);
    expect(classes[0].metadata.symbol_name).toBe('AuthService');
  });
});

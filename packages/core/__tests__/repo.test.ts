import { describe, it, expect } from 'vitest';
import { CodeParser } from '../src/repo/parser';

describe('CodeParser', () => {
  const parser = new CodeParser();

  it('parses TypeScript function: extracts name, params, return type', () => {
    const tsCode = `
import { Request, Response } from 'express';

/**
 * Authenticates user credentials
 */
export async function authenticate(req: Request, res: Response): Promise<boolean> {
  const token = req.headers.authorization;
  if (!token) return false;
  return true;
}
    `.trim();

    const result = parser.parse(tsCode, 'typescript', 'src/auth/handler.ts');
    expect(result.imports).toContain('express');
    expect(result.dependencies).toContain('express');
    expect(result.symbols).toHaveLength(1);

    const func = result.symbols[0];
    expect(func.name).toBe('authenticate');
    expect(func.type).toBe('function');
    expect(func.params).toContain('req: Request');
    expect(func.params).toContain('res: Response');
    expect(func.returnType).toBe('Promise<boolean>');
    expect(func.docstring).toContain('Authenticates user credentials');
  });

  it('parses Python class: extracts methods and attributes', () => {
    const pyCode = `
import os
import sys

class ModelService:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.is_ready = True

    def predict(self, prompt: str) -> str:
        return f"result for {prompt}"

    def reset_state(self):
        self.is_ready = False
    `.trim();

    const result = parser.parse(pyCode, 'python', 'services/model.py');
    expect(result.imports).toContain('os');
    expect(result.symbols).toHaveLength(1);

    const cls = result.symbols[0];
    expect(cls.name).toBe('ModelService');
    expect(cls.type).toBe('class');
    expect(cls.methods).toContain('__init__');
    expect(cls.methods).toContain('predict');
    expect(cls.methods).toContain('reset_state');
    expect(cls.attributes).toContain('model_name');
    expect(cls.attributes).toContain('is_ready');
  });

  it('skips vendored files in node_modules or build directories', () => {
    const code = 'export function test() {}';
    const resultNodeModules = parser.parse(code, 'typescript', 'project/node_modules/pkg/index.ts');
    expect(resultNodeModules.symbols).toHaveLength(0);

    const resultDist = parser.parse(code, 'typescript', 'project/dist/bundle.js');
    expect(resultDist.symbols).toHaveLength(0);

    const resultVendor = parser.parse(code, 'go', 'project/vendor/github.com/pkg/main.go');
    expect(resultVendor.symbols).toHaveLength(0);
  });
});

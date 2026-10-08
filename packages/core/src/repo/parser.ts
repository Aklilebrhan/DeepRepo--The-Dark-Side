import { ASTSymbol } from '../types';
import { SupportedLanguage } from '../constants';

export interface ParseResult {
  filePath: string;
  language: SupportedLanguage | string;
  symbols: ASTSymbol[];
  imports: string[];
  dependencies: string[];
}

export class CodeParser {
  /**
   * Parses source code according to the file language and extracts AST symbols
   */
  public parse(code: string, language: SupportedLanguage | string, filePath = ''): ParseResult {
    // Check if path indicates vendored code to skip
    if (this.isVendored(filePath)) {
      return {
        filePath,
        language,
        symbols: [],
        imports: [],
        dependencies: [],
      };
    }

    const imports = this.extractImports(code, language);
    const dependencies = this.extractDependencies(imports);
    let symbols: ASTSymbol[] = [];

    switch (language) {
      case 'typescript':
      case 'javascript':
        symbols = this.parseJavaScriptOrTypeScript(code);
        break;
      case 'python':
        symbols = this.parsePython(code);
        break;
      case 'go':
        symbols = this.parseGo(code);
        break;
      case 'java':
        symbols = this.parseJava(code);
        break;
      default:
        symbols = this.parseGeneric(code);
        break;
    }

    return {
      filePath,
      language,
      symbols,
      imports,
      dependencies,
    };
  }

  public isVendored(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return (
      normalized.includes('/node_modules/') ||
      normalized.includes('/vendor/') ||
      normalized.includes('/__pycache__/') ||
      normalized.includes('/dist/') ||
      normalized.includes('/build/')
    );
  }

  private extractImports(code: string, language: string): string[] {
    const imports: string[] = [];
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (language === 'typescript' || language === 'javascript') {
        // e.g. import { x } from 'express' or const y = require('jsonwebtoken')
        const esMatch = trimmed.match(/import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/);
        if (esMatch) imports.push(esMatch[1]);
        const reqMatch = trimmed.match(/require\(['"]([^'"]+)['"]\)/);
        if (reqMatch) imports.push(reqMatch[1]);
      } else if (language === 'python') {
        const pyMatch = trimmed.match(
          /^(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/,
        );
        if (pyMatch) imports.push(pyMatch[1] || pyMatch[2]);
      } else if (language === 'go') {
        const goMatch = trimmed.match(/^import\s+['"]([^'"]+)['"]/);
        if (goMatch) imports.push(goMatch[1]);
      } else if (language === 'java') {
        const javaMatch = trimmed.match(/^import\s+([a-zA-Z0-9_.]+);/);
        if (javaMatch) imports.push(javaMatch[1]);
      }
    }

    return Array.from(new Set(imports));
  }

  private extractDependencies(imports: string[]): string[] {
    const deps: string[] = [];
    for (const imp of imports) {
      if (imp.startsWith('.')) continue; // local relative path
      const rootPkg = imp.startsWith('@')
        ? imp.split('/').slice(0, 2).join('/')
        : imp.split('/')[0];
      if (rootPkg && !deps.includes(rootPkg)) {
        deps.push(rootPkg);
      }
    }
    return deps;
  }

  /**
   * AST symbol extraction for TypeScript / JavaScript
   */
  private parseJavaScriptOrTypeScript(code: string): ASTSymbol[] {
    const symbols: ASTSymbol[] = [];
    const lines = code.split('\n');

    // Regex patterns
    const funcRegex =
      /^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^;{]+))?/;
    const arrowFuncRegex =
      /^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/;
    const classRegex =
      /^(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$.]+)?(?:\s+implements\s+[a-zA-Z0-9_$,\s]+)?/;
    const interfaceRegex =
      /^(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$,\s]+)?/;
    const typeRegex = /^(?:export\s+)?type\s+([a-zA-Z0-9_$]+)(?:<[^>]+>)?\s*=/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check docstring preceding
      let docstring: string | undefined;
      if (i > 0 && lines[i - 1].trim().endsWith('*/')) {
        let docStart = i - 1;
        while (docStart >= 0 && !lines[docStart].trim().startsWith('/**')) {
          docStart--;
        }
        if (docStart >= 0) {
          docstring = lines.slice(docStart, i).join('\n');
        }
      }

      // Check Function
      const fMatch = trimmed.match(funcRegex);
      if (fMatch) {
        const name = fMatch[1];
        const params = fMatch[2]
          ? fMatch[2]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const returnType = fMatch[3] ? fMatch[3].trim() : undefined;
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'function',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          params,
          returnType,
          docstring,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      // Check Arrow Function
      const aMatch = trimmed.match(arrowFuncRegex);
      if (aMatch) {
        const name = aMatch[1];
        const params = aMatch[2]
          ? aMatch[2]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const returnType = aMatch[3] ? aMatch[3].trim() : undefined;
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'function',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          params,
          returnType,
          docstring,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      // Check Class
      const cMatch = trimmed.match(classRegex);
      if (cMatch) {
        const name = cMatch[1];
        const block = this.extractBlock(lines, i);
        const { methods, attributes } = this.extractClassMembers(block.code);
        symbols.push({
          name,
          type: 'class',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          methods,
          attributes,
          docstring,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      // Check Interface
      const iMatch = trimmed.match(interfaceRegex);
      if (iMatch) {
        const name = iMatch[1];
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'interface',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          docstring,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      // Check Type Alias
      const tMatch = trimmed.match(typeRegex);
      if (tMatch) {
        const name = tMatch[1];
        let endIdx = i;
        while (endIdx < lines.length && !lines[endIdx].includes(';')) {
          endIdx++;
        }
        symbols.push({
          name,
          type: 'type',
          startLine: i + 1,
          endLine: endIdx + 1,
          docstring,
          code: lines.slice(i, endIdx + 1).join('\n'),
        });
        i = endIdx + 1;
        continue;
      }

      i++;
    }

    return symbols;
  }

  /**
   * AST symbol extraction for Python
   */
  private parsePython(code: string): ASTSymbol[] {
    const symbols: ASTSymbol[] = [];
    const lines = code.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Top-level or class definition
      const defMatch = line.match(/^(\s*)def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);
      const classMatch = line.match(/^(\s*)class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?:/);

      if (classMatch) {
        const indent = classMatch[1].length;
        const name = classMatch[2];
        const block = this.extractPythonIndentedBlock(lines, i, indent);
        const methods: string[] = [];
        const attributes: string[] = [];

        for (const bline of block.lines) {
          const mMatch = bline.match(/^\s+def\s+([a-zA-Z0-9_]+)/);
          if (mMatch) methods.push(mMatch[1]);
          const aMatch = bline.match(/^\s+self\.([a-zA-Z0-9_]+)\s*=/);
          if (aMatch && !attributes.includes(aMatch[1])) {
            attributes.push(aMatch[1]);
          }
        }

        symbols.push({
          name,
          type: 'class',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          methods,
          attributes,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      if (defMatch) {
        const indent = defMatch[1].length;
        const name = defMatch[2];
        const params = defMatch[3]
          ? defMatch[3]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const returnType = defMatch[4] ? defMatch[4].trim() : undefined;
        const block = this.extractPythonIndentedBlock(lines, i, indent);

        symbols.push({
          name,
          type: indent === 0 ? 'function' : 'method',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          params,
          returnType,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      i++;
    }

    return symbols;
  }

  /**
   * AST symbol extraction for Go
   */
  private parseGo(code: string): ASTSymbol[] {
    const symbols: ASTSymbol[] = [];
    const lines = code.split('\n');

    const funcRegex = /^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*([^{]+))?/;
    const typeRegex = /^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      const fMatch = line.match(funcRegex);
      if (fMatch) {
        const name = fMatch[1];
        const params = fMatch[2]
          ? fMatch[2]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const returnType = fMatch[3] ? fMatch[3].trim() : undefined;
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'function',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          params,
          returnType,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      const tMatch = line.match(typeRegex);
      if (tMatch) {
        const name = tMatch[1];
        const kind = tMatch[2];
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: kind === 'struct' ? 'class' : 'interface',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      i++;
    }

    return symbols;
  }

  /**
   * AST symbol extraction for Java
   */
  private parseJava(code: string): ASTSymbol[] {
    const symbols: ASTSymbol[] = [];
    const lines = code.split('\n');

    const classRegex =
      /^(?:public|protected|private)?\s*(?:static)?\s*(?:final)?\s*(?:class|interface|enum)\s+([a-zA-Z0-9_]+)/;
    const methodRegex =
      /^(?:public|protected|private)\s+(?:static\s+)?(?:final\s+)?([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      const cMatch = line.match(classRegex);
      if (cMatch) {
        const name = cMatch[1];
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'class',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      const mMatch = line.match(methodRegex);
      if (mMatch && !line.includes('class')) {
        const returnType = mMatch[1];
        const name = mMatch[2];
        const params = mMatch[3]
          ? mMatch[3]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const block = this.extractBlock(lines, i);
        symbols.push({
          name,
          type: 'method',
          startLine: i + 1,
          endLine: block.endIndex + 1,
          params,
          returnType,
          code: block.code,
        });
        i = block.endIndex + 1;
        continue;
      }

      i++;
    }

    return symbols;
  }

  private parseGeneric(code: string): ASTSymbol[] {
    return [
      {
        name: 'main',
        type: 'module',
        startLine: 1,
        endLine: code.split('\n').length,
        code,
      },
    ];
  }

  private extractBlock(lines: string[], startIndex: number): { endIndex: number; code: string } {
    let braceCount = 0;
    let foundFirstBrace = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundFirstBrace = true;
        } else if (char === '}') {
          braceCount--;
        }
      }

      if (foundFirstBrace && braceCount <= 0) {
        endIndex = i;
        break;
      }
      endIndex = i;
    }

    return {
      endIndex,
      code: lines.slice(startIndex, endIndex + 1).join('\n'),
    };
  }

  private extractPythonIndentedBlock(
    lines: string[],
    startIndex: number,
    baseIndent: number,
  ): { endIndex: number; code: string; lines: string[] } {
    let endIndex = startIndex;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // ignore empty lines

      const indentMatch = line.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1].length : 0;
      if (currentIndent <= baseIndent) {
        break;
      }
      endIndex = i;
    }

    const blockLines = lines.slice(startIndex, endIndex + 1);
    return {
      endIndex,
      code: blockLines.join('\n'),
      lines: blockLines,
    };
  }

  private extractClassMembers(classCode: string): { methods: string[]; attributes: string[] } {
    const methods: string[] = [];
    const attributes: string[] = [];
    const lines = classCode.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // method: async authenticate(...) { or validate(...) {
      const mMatch = trimmed.match(
        /^(?:(?:public|private|protected|async)\s+)*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*(?::\s*[^;{]+)?\s*\{/,
      );
      if (mMatch && !['constructor', 'if', 'for', 'while', 'switch'].includes(mMatch[1])) {
        methods.push(mMatch[1]);
      }
      // attribute: private token: string;
      const aMatch = trimmed.match(
        /^(?:(?:public|private|protected|readonly)\s+)+([a-zA-Z0-9_$]+)\s*[:=]/,
      );
      if (aMatch) {
        attributes.push(aMatch[1]);
      }
    }

    return { methods, attributes };
  }
}

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Button, CodeBlock, ChatMessage } from '../src';

describe('UI Shared Components (SSR/Static Render)', () => {
  it('renders Button with variants and sizes', () => {
    const htmlPrimary = renderToString(<Button variant="primary">Click Me</Button>);
    expect(htmlPrimary).toContain('Click Me');
    expect(htmlPrimary).toContain('bg-emerald-600');

    const htmlLoading = renderToString(<Button isLoading>Saving</Button>);
    expect(htmlLoading).toContain('Saving');
    expect(htmlLoading).toContain('animate-spin');
  });

  it('renders CodeBlock with syntax line numbers and copy controls', () => {
    const code = 'const answer = 42;\nconsole.log(answer);';
    const html = renderToString(
      <CodeBlock code={code} language="typescript" filePath="src/index.ts" startLine={10} />,
    );

    expect(html).toContain('src/index.ts');
    expect(html).toContain('typescript');
    expect(html).toContain('10');
    expect(html).toContain('11');
    expect(html).toContain('const answer = 42;');
  });

  it('renders ChatMessage for user and assistant with code blocks and references', () => {
    const userMsg = renderToString(
      <ChatMessage role="user" content="How does auth work?" timestamp="12:00 PM" />,
    );
    expect(userMsg).toContain('You');
    expect(userMsg).toContain('How does auth work?');

    const assistantMsg = renderToString(
      <ChatMessage
        role="assistant"
        content="Here is the code:\n```typescript\nexport function auth() {}\n```"
        references={[
          {
            filePath: 'src/auth.ts',
            startLine: 1,
            endLine: 5,
            symbolName: 'auth',
          },
        ]}
      />,
    );

    expect(assistantMsg).toContain('DeepRepo Assistant');
    expect(assistantMsg).toContain('Attributed Context:');
    expect(assistantMsg).toContain('src/auth.ts');
  });
});

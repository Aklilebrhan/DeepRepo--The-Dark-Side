import { PromptTemplateConfig } from '../types';

export const DEFAULT_TEMPLATES: Record<string, PromptTemplateConfig> = {
  rag_chat: {
    name: 'rag_chat',
    system:
      'You are DeepRepo (The Dark Side), an offline expert pair-programmer and code intelligence assistant. You answer user inquiries with extreme precision based strictly on the provided codebase context snippets. If the context does not contain enough information, truthfully state what is missing instead of hallucinating. Always reference specific file paths and line numbers when explaining code.',
    template: `Codebase Context:
{context}

User Query:
{query}

Please provide a clear, accurate, and comprehensive explanation with relevant code references.`,
    variables: ['context', 'query'],
  },
  test_generation: {
    name: 'test_generation',
    system:
      'You are an expert test automation engineer. Generate a comprehensive, idiomatic unit test suite with high branch and statement coverage for the provided function or class. Include test cases for edge cases, null/empty parameters, and error conditions. Output code only.',
    template: `Target File: {file_path}
Language: {language}
Symbol: {symbol_name} ({symbol_type})

Code to Test:
\`\`\`{language}
{code}
\`\`\`

Generate a complete test suite using {test_framework} (e.g., Jest/Vitest for TS/JS, unittest/pytest for Python). Ensure all imports and assertions are present.`,
    variables: ['file_path', 'language', 'symbol_name', 'symbol_type', 'code', 'test_framework'],
  },
  code_explanation: {
    name: 'code_explanation',
    system:
      'You are a senior software architect explaining complex code to onboarding engineers. Break down the logic, explain why particular patterns were used, trace dependencies, and highlight any edge cases or performance bottlenecks.',
    template: `Context & Dependencies:
{context}

Target Code ({file_path}:{start_line}-{end_line}):
\`\`\`{language}
{code}
\`\`\`

Explain what this code does and why. Highlight any complex logic, design patterns, and interaction with related dependencies.`,
    variables: ['context', 'file_path', 'start_line', 'end_line', 'language', 'code'],
  },
};

export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplateConfig> = new Map();

  constructor(customTemplates?: Record<string, PromptTemplateConfig>) {
    // Load defaults
    for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
      this.templates.set(key, tpl);
    }
    // Overlay custom
    if (customTemplates) {
      for (const [key, tpl] of Object.entries(customTemplates)) {
        this.templates.set(key, tpl);
      }
    }
  }

  public getTemplate(name: string): PromptTemplateConfig {
    const tpl = this.templates.get(name);
    if (!tpl) {
      throw new Error(`Prompt template '${name}' not found.`);
    }
    return tpl;
  }

  public format(
    name: string,
    variables: Record<string, string | number>,
  ): { system: string; prompt: string } {
    const tpl = this.getTemplate(name);
    let formattedPrompt = tpl.template;

    for (const [key, val] of Object.entries(variables)) {
      formattedPrompt = formattedPrompt.split(`{${key}}`).join(String(val));
    }

    return {
      system: tpl.system,
      prompt: formattedPrompt,
    };
  }
}

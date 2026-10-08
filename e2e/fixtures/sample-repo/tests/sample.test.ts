import { describe, it, expect } from 'vitest';
import { formatGreeting } from '../src/utils';

describe('sample utils', () => {
  it('formats greeting', () => {
    expect(formatGreeting('Alice')).toBe('Hello, Alice!');
  });
});

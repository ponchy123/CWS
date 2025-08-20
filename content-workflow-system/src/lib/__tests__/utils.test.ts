import { describe, it, expect } from 'vitest';

import { cn } from '../utils';

describe('utils', () => {
  describe('cn function', () => {
    it('应该合并类名', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('应该处理条件类名', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('应该处理undefined和null值', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('应该处理Tailwind冲突类名', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('应该处理空字符串', () => {
      const result = cn('', 'valid', '');
      expect(result).toBe('valid');
    });

    it('应该处理数组输入', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('应该处理对象输入', () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toBe('class1 class3');
    });
  });
});

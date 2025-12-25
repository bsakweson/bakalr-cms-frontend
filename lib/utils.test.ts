import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'excluded');
      expect(result).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('should handle arrays of class names', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        foo: true,
        bar: false,
        baz: true,
      });
      expect(result).toBe('foo baz');
    });

    it('should merge Tailwind classes correctly', () => {
      // tailwind-merge should handle conflicting classes
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2'); // Later class should win
    });

    it('should merge Tailwind color classes correctly', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should merge Tailwind spacing classes correctly', () => {
      const result = cn('mt-4', 'mt-8');
      expect(result).toBe('mt-8');
    });

    it('should preserve non-conflicting classes', () => {
      const result = cn('p-4', 'mt-2', 'text-lg');
      expect(result).toBe('p-4 mt-2 text-lg');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle empty strings', () => {
      const result = cn('foo', '', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle complex conditional expressions', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        isActive ? 'text-green-500' : 'text-gray-500'
      );
      expect(result).toBe('base-class active text-green-500');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'string-class',
        ['array-class-1', 'array-class-2'],
        { 'object-class': true, 'excluded-class': false },
        undefined,
        null,
        false && 'conditional-false',
        true && 'conditional-true'
      );
      expect(result).toBe('string-class array-class-1 array-class-2 object-class conditional-true');
    });

    it('should handle responsive Tailwind classes', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
      expect(result).toBe('text-sm md:text-base lg:text-lg');
    });

    it('should merge responsive Tailwind classes correctly', () => {
      const result = cn('md:text-sm', 'md:text-lg');
      expect(result).toBe('md:text-lg');
    });

    it('should handle state variants', () => {
      const result = cn('hover:bg-blue-500', 'focus:bg-blue-600', 'active:bg-blue-700');
      expect(result).toBe('hover:bg-blue-500 focus:bg-blue-600 active:bg-blue-700');
    });

    it('should merge state variants correctly', () => {
      const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
      expect(result).toBe('hover:bg-blue-500');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-900');
      expect(result).toBe('bg-white dark:bg-gray-900');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[200px]', 'h-[100px]');
      expect(result).toBe('w-[200px] h-[100px]');
    });

    it('should merge width classes correctly', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
    });

    it('should merge flex classes correctly', () => {
      const result = cn('flex-row', 'flex-col');
      expect(result).toBe('flex-col');
    });

    it('should handle negative values', () => {
      const result = cn('-mt-4', '-ml-2');
      expect(result).toBe('-mt-4 -ml-2');
    });

    it('should merge negative and positive values', () => {
      const result = cn('mt-4', '-mt-4');
      expect(result).toBe('-mt-4');
    });
  });
});

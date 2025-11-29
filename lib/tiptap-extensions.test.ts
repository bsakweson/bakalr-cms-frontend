import { describe, it, expect } from 'vitest';
import { Callout, Details } from './tiptap-extensions';

describe('tiptap-extensions', () => {
  describe('Callout extension', () => {
    it('should have correct name', () => {
      expect(Callout.name).toBe('callout');
    });

    it('should be a block-level node', () => {
      expect(Callout.config.group).toBe('block');
    });

    it('should allow block content', () => {
      expect(Callout.config.content).toBe('block+');
    });

    it('should have addAttributes function', () => {
      expect(Callout.config.addAttributes).toBeDefined();
      expect(typeof Callout.config.addAttributes).toBe('function');
    });

    it('should have parseHTML function', () => {
      expect(Callout.config.parseHTML).toBeDefined();
      expect(typeof Callout.config.parseHTML).toBe('function');
    });

    it('should have renderHTML function', () => {
      expect(Callout.config.renderHTML).toBeDefined();
      expect(typeof Callout.config.renderHTML).toBe('function');
    });
  });

  describe('Details extension', () => {
    it('should have correct name', () => {
      expect(Details.name).toBe('details');
    });

    it('should be a block-level node', () => {
      expect(Details.config.group).toBe('block');
    });

    it('should allow block content', () => {
      expect(Details.config.content).toBe('block+');
    });

    it('should have parseHTML function', () => {
      expect(Details.config.parseHTML).toBeDefined();
      expect(typeof Details.config.parseHTML).toBe('function');
    });

    it('should have renderHTML function', () => {
      expect(Details.config.renderHTML).toBeDefined();
      expect(typeof Details.config.renderHTML).toBe('function');
    });
  });

  describe('Extension comparison', () => {
    it('should have different names', () => {
      expect(Callout.name).not.toBe(Details.name);
    });

    it('should both be block-level nodes', () => {
      expect(Callout.config.group).toBe('block');
      expect(Details.config.group).toBe('block');
    });

    it('should both allow block content', () => {
      expect(Callout.config.content).toBe('block+');
      expect(Details.config.content).toBe('block+');
    });
  });

  describe('Extension structure', () => {
    it('Callout should have all required TipTap node properties', () => {
      expect(Callout).toHaveProperty('name');
      expect(Callout).toHaveProperty('config');
      expect(Callout.config).toHaveProperty('group');
      expect(Callout.config).toHaveProperty('content');
      expect(Callout.config).toHaveProperty('addAttributes');
      expect(Callout.config).toHaveProperty('parseHTML');
      expect(Callout.config).toHaveProperty('renderHTML');
    });

    it('Details should have all required TipTap node properties', () => {
      expect(Details).toHaveProperty('name');
      expect(Details).toHaveProperty('config');
      expect(Details.config).toHaveProperty('group');
      expect(Details.config).toHaveProperty('content');
      expect(Details.config).toHaveProperty('parseHTML');
      expect(Details.config).toHaveProperty('renderHTML');
    });

    it('Callout should have addAttributes while Details should not', () => {
      expect(Callout.config).toHaveProperty('addAttributes');
      expect(Details.config.addAttributes).toBeUndefined();
    });
  });
});


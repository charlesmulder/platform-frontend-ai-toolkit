
/**
 * @jest-environment node
 */
/**
 * Test suite for exportScanner utility
 * Tests the TypeScript AST-based export scanning functionality
 */


import * as fs from 'fs';
// Import the mocked module
import fg from 'fast-glob';

// Mock fast-glob before importing the module under test
jest.mock('fast-glob', () => {
  const actual = jest.requireActual('fast-glob');
  const fn = jest.fn();
  
  return {
    __esModule: true,
    ...actual,
    default: fn,
  };
});

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    // We only overwrite the specific function we need to test
    readFile: jest.fn(), 
  };
});

import { scanPackageExports, findExportSource, clearExportCache } from '../exportScanner';

// Cast to jest mock for type safety
const mockFastGlob = fg as jest.MockedFunction<typeof fg>;

describe('exportScanner', () => {
  let readFileSpy: jest.SpyInstance = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    clearExportCache();
    
    // Spy on fs.readFile
    readFileSpy = jest.spyOn(fs, 'readFile');
  });

  afterEach(() => {
    readFileSpy.mockRestore();
  });

  describe('scanPackageExports', () => {
    it('should scan src directory and find exports', async () => {
      mockFastGlob.mockResolvedValue([
        '/test-package/src/Button.tsx',
        '/test-package/src/utils/helper.ts'
      ] as never);

      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        const pathStr = path.toString();
        if (pathStr === '/test-package/src/Button.tsx') {
          callback(null, 'export const Button = () => <button>Click</button>;');
        } else if (pathStr === '/test-package/src/utils/helper.ts') {
          callback(null, 'export function helper() { return true; }');
        } else {
          callback(null, '');
        }
      });

      const result = await scanPackageExports('/test-package');

      expect(result.exports.has('Button')).toBe(true);
      expect(result.exports.has('helper')).toBe(true);
      expect(result.exports.get('Button')?.kind).toBe('variable');
      expect(result.exports.get('helper')?.kind).toBe('function');
    });

    it('should use correct glob pattern with ignore list', async () => {
      mockFastGlob.mockResolvedValue([] as never);

      await scanPackageExports('/test-package');

      expect(mockFastGlob).toHaveBeenCalledWith(
        '**/*.{ts,tsx}',
        expect.objectContaining({
          cwd: '/test-package/src',
          absolute: true,
          ignore: expect.arrayContaining([
            '**/examples/**',
            '**/__tests__/**',
            '**/__mocks__/**',
          ])
        })
      );
    });

    it('should handle different export types', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/exports.ts'] as never);

      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(null, `
          export const MyVariable = 'value';
          export function myFunction() { return true; }
          export class MyClass {}
          export interface MyInterface {}
          export type MyType = string;
          export enum MyEnum { A, B }
        `);
      });

      const result = await scanPackageExports('/test-package');

      expect(result.exports.has('MyVariable')).toBe(true);
      expect(result.exports.get('MyVariable')?.kind).toBe('variable');

      expect(result.exports.has('myFunction')).toBe(true);
      expect(result.exports.get('myFunction')?.kind).toBe('function');

      expect(result.exports.has('MyClass')).toBe(true);
      expect(result.exports.get('MyClass')?.kind).toBe('class');

      expect(result.exports.has('MyInterface')).toBe(true);
      expect(result.exports.get('MyInterface')?.kind).toBe('interface');

      expect(result.exports.has('MyType')).toBe(true);
      expect(result.exports.get('MyType')?.kind).toBe('type');

      expect(result.exports.has('MyEnum')).toBe(true);
      expect(result.exports.get('MyEnum')?.kind).toBe('enum');
    });

    it('should cache results', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/Button.tsx'] as never);
      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(null, 'export const Button = () => <button>Click</button>;');
      });

      // First call
      await scanPackageExports('/test-package');

      // Clear mocks to verify cache usage
      mockFastGlob.mockClear();

      // Second call should use cache
      const result = await scanPackageExports('/test-package');

      expect(mockFastGlob).not.toHaveBeenCalled();
      expect(result.exports.has('Button')).toBe(true);
    });

    it('should handle glob errors gracefully', async () => {
      mockFastGlob.mockRejectedValue(new Error('Permission denied') as never);

      const result = await scanPackageExports('/test-package');

      expect(result.exports.size).toBe(0);
    });

    it('should handle file read errors gracefully', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/Button.tsx'] as never);
      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(new Error('File not found') as NodeJS.ErrnoException);
      });

      const result = await scanPackageExports('/test-package');

      expect(result.exports.size).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should prefer actual exports over re-exports', async () => {
      mockFastGlob.mockResolvedValue([
        '/test-package/src/index.ts',
        '/test-package/src/Button.tsx'
      ] as never);

      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        const pathStr = path.toString();
        if (pathStr === '/test-package/src/index.ts') {
          callback(null, "export { Button } from './Button';");
        } else if (pathStr === '/test-package/src/Button.tsx') {
          callback(null, 'export const Button = () => <button>Click</button>;');
        } else {
          callback(null, '');
        }
      });

      const result = await scanPackageExports('/test-package');

      expect(result.exports.has('Button')).toBe(true);
      // Should have the actual source, not the re-export
      expect(result.exports.get('Button')?.kind).toBe('variable');
      expect(result.exports.get('Button')?.filePath).toContain('Button.tsx');
    });
  });

  describe('findExportSource', () => {
    it('should find the export source for a component', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/Button.tsx'] as never);
      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(null, 'export const Button = () => <button>Click</button>;');
      });

      const result = await findExportSource('/test-package', 'Button');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Button');
      expect(result?.filePath).toContain('Button.tsx');
    });

    it('should return undefined for non-existent export', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/Button.tsx'] as never);
      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(null, 'export const Button = () => <button>Click</button>;');
      });

      const result = await findExportSource('/test-package', 'NonExistent');

      expect(result).toBeUndefined();
    });
  });

  describe('clearExportCache', () => {
    it('should clear the cache', async () => {
      mockFastGlob.mockResolvedValue(['/test-package/src/Button.tsx'] as never);
      readFileSpy.mockImplementation((path: fs.PathOrFileDescriptor, options: any, callback: (err: NodeJS.ErrnoException | null, data?: string) => void) => {
        callback(null, 'export const Button = () => <button>Click</button>;');
      });

      // First call
      await scanPackageExports('/test-package');

      // Clear cache
      clearExportCache();

      // Clear mocks
      mockFastGlob.mockClear();

      // Second call should NOT use cache
      const r = await scanPackageExports('/test-package');
      console.log(r);

      expect(mockFastGlob).toHaveBeenCalled();
    });
  });
});

import { TEST_DATA, createMockError } from '../../__tests__/testUtils';
import * as readFileModule from '../readFile';

/**
 * Test suite for readFile utilities
 * Tests readFileAsync and readJsonFile functions
 * 
 * Note: These tests use jest.isolateModules to prevent module contamination
 * from other test files that may mock 'fs' globally.
 */

describe('readFile utilities', () => {
  let readFileAsyncSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    
    // Import fresh module for each test
    
    // Spy on the exported readFileAsync function
    readFileAsyncSpy = jest.spyOn(readFileModule, 'readFileAsync');
  });

  afterEach(() => {
    if (readFileAsyncSpy) {
      readFileAsyncSpy.mockRestore();
    }
    jest.clearAllMocks();
  });

  describe('readFileAsync', () => {
    it('should be a function', () => {
      expect(typeof readFileModule.readFileAsync).toBe('function');
    });

    it('should call with correct arguments', async () => {
      const testFilePath = '/path/to/test/file.txt';
      const testContent = 'test file content';

      readFileAsyncSpy.mockResolvedValue(testContent);

      const result = await readFileModule.readFileAsync(testFilePath, 'utf-8');

      expect(readFileAsyncSpy).toHaveBeenCalledWith(testFilePath, 'utf-8');
      expect(result).toBe(testContent);
    });

    it('should handle file read errors', async () => {
      const testFilePath = '/path/to/nonexistent/file.txt';
      const fileError = createMockError.fileSystem('ENOENT', 'no such file or directory');

      readFileAsyncSpy.mockRejectedValue(fileError);

      await expect(readFileModule.readFileAsync(testFilePath, 'utf-8')).rejects.toThrow('ENOENT: no such file or directory');
    });

    it('should handle permission errors', async () => {
      const testFilePath = '/path/to/restricted/file.txt';
      const permissionError = createMockError.fileSystem('EACCES', 'permission denied');

      readFileAsyncSpy.mockRejectedValue(permissionError);

      await expect(readFileModule.readFileAsync(testFilePath, 'utf-8')).rejects.toThrow('EACCES: permission denied');
    });

    it('should support different encoding options', async () => {
      const testFilePath = '/path/to/binary/file.bin';
      const binaryContent = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

      readFileAsyncSpy.mockResolvedValue(binaryContent);

      const result = await readFileModule.readFileAsync(testFilePath);

      expect(readFileAsyncSpy).toHaveBeenCalledWith(testFilePath);
      expect(result).toBe(binaryContent);
    });
  });

  describe('readJsonFile', () => {
    describe('successful JSON parsing', () => {
      it('should read and parse simple JSON file', async () => {
        const testFilePath = '/path/to/simple.json';
        const testJsonString = JSON.stringify(TEST_DATA.JSON.SIMPLE);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile(testFilePath);

        expect(readFileAsyncSpy).toHaveBeenCalledWith(testFilePath, 'utf-8');
        expect(result).toEqual(TEST_DATA.JSON.SIMPLE);
      });

      it('should read and parse complex JSON file', async () => {
        const testFilePath = '/path/to/complex.json';
        const testJsonString = JSON.stringify(TEST_DATA.JSON.COMPLEX);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile(testFilePath);

        expect(readFileAsyncSpy).toHaveBeenCalledWith(testFilePath, 'utf-8');
        expect(result).toEqual(TEST_DATA.JSON.COMPLEX);
      });

      it('should read and parse JSON array', async () => {
        const testFilePath = '/path/to/array.json';
        const testJsonString = JSON.stringify(TEST_DATA.JSON.ARRAY);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile(testFilePath);

        expect(result).toEqual(TEST_DATA.JSON.ARRAY);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should read and parse empty JSON object', async () => {
        const testFilePath = '/path/to/empty.json';
        const testJsonString = JSON.stringify(TEST_DATA.JSON.EMPTY);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile(testFilePath);

        expect(result).toEqual(TEST_DATA.JSON.EMPTY);
        expect(typeof result).toBe('object');
      });

      it('should handle JSON with special characters and unicode', async () => {
        const testFilePath = '/path/to/unicode.json';
        const unicodeData = { text: 'éñïcödé, 中文, 🎯', emoji: '🚀' };
        const testJsonString = JSON.stringify(unicodeData);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof unicodeData>(testFilePath);

        expect(result).toEqual(unicodeData);
        expect(result.text).toBe('éñïcödé, 中文, 🎯');
        expect(result.emoji).toBe('🚀');
      });

      it('should preserve JSON number types', async () => {
        const testFilePath = '/path/to/numbers.json';
        const numberData = { integer: 42, float: 3.14159, negative: -123, zero: 0 };
        const testJsonString = JSON.stringify(numberData);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof numberData>(testFilePath);

        expect(result).toEqual(numberData);
        expect(typeof result.integer).toBe('number');
        expect(typeof result.float).toBe('number');
        expect(result.integer).toBe(42);
        expect(result.float).toBe(3.14159);
      });

      it('should preserve JSON boolean and null types', async () => {
        const testFilePath = '/path/to/types.json';
        const typeData = {
          isTrue: true,
          isFalse: false,
          isNull: null,
          nested: {
            booleanValue: true,
            nullValue: null
          }
        };
        const testJsonString = JSON.stringify(typeData);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof typeData>(testFilePath);

        expect(result).toEqual(typeData);
        expect(result.isTrue).toBe(true);
        expect(result.isFalse).toBe(false);
        expect(result.isNull).toBe(null);
        expect(result.nested.booleanValue).toBe(true);
        expect(result.nested.nullValue).toBe(null);
      });
    });

    describe('error handling', () => {
      it('should handle file read errors', async () => {
        const testFilePath = '/path/to/nonexistent.json';
        const fileError = createMockError.fileSystem('ENOENT', TEST_DATA.ERRORS.FILE_NOT_FOUND);

        readFileAsyncSpy.mockRejectedValue(fileError);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(TEST_DATA.ERRORS.FILE_NOT_FOUND);
        expect(readFileAsyncSpy).toHaveBeenCalledWith(testFilePath, 'utf-8');
      });

      it('should handle permission errors', async () => {
        const testFilePath = '/path/to/restricted.json';
        const permissionError = createMockError.fileSystem('EACCES', TEST_DATA.ERRORS.PERMISSION);

        readFileAsyncSpy.mockRejectedValue(permissionError);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(TEST_DATA.ERRORS.PERMISSION);
      });

      it('should handle invalid JSON syntax', async () => {
        const testFilePath = '/path/to/invalid.json';
        const invalidJsonString = '{ "invalid": json }'; // Missing quotes around json

        readFileAsyncSpy.mockResolvedValue(invalidJsonString);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(SyntaxError);
      });

      it('should handle empty file content', async () => {
        const testFilePath = '/path/to/empty.json';
        const emptyContent = '';

        readFileAsyncSpy.mockResolvedValue(emptyContent);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(SyntaxError);
      });

      it('should handle malformed JSON with trailing comma', async () => {
        const testFilePath = '/path/to/trailing-comma.json';
        const malformedJson = '{ "key": "value", }'; // Trailing comma

        readFileAsyncSpy.mockResolvedValue(malformedJson);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(SyntaxError);
      });

      it('should handle JSON with comments (invalid)', async () => {
        const testFilePath = '/path/to/with-comments.json';
        const jsonWithComments = '{ /* comment */ "key": "value" }';

        readFileAsyncSpy.mockResolvedValue(jsonWithComments);

        await expect(readFileModule.readJsonFile(testFilePath)).rejects.toThrow(SyntaxError);
      });

      it('should handle non-object JSON root (string)', async () => {
        const testFilePath = '/path/to/string-root.json';
        const stringJson = '"just a string"';

        readFileAsyncSpy.mockResolvedValue(stringJson);

        const result = await readFileModule.readJsonFile<string>(testFilePath);
        expect(result).toBe('just a string');
        expect(typeof result).toBe('string');
      });

      it('should handle non-object JSON root (number)', async () => {
        const testFilePath = '/path/to/number-root.json';
        const numberJson = '42';

        readFileAsyncSpy.mockResolvedValue(numberJson);

        const result = await readFileModule.readJsonFile<number>(testFilePath);
        expect(result).toBe(42);
        expect(typeof result).toBe('number');
      });
    });

    describe('TypeScript type inference', () => {
      it('should maintain type safety with generic type parameter', async () => {
        interface TestInterface {
          id: number;
          name: string;
          active: boolean;
        }

        const testFilePath = '/path/to/typed.json';
        const testData: TestInterface = { id: 1, name: 'Test', active: true };
        const testJsonString = JSON.stringify(testData);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<TestInterface>(testFilePath);

        expect(result).toEqual(testData);
        expect(typeof result.id).toBe('number');
        expect(typeof result.name).toBe('string');
        expect(typeof result.active).toBe('boolean');
        expect(result.id).toBe(1);
        expect(result.name).toBe('Test');
        expect(result.active).toBe(true);
      });

      it('should work with array type parameter', async () => {
        const testFilePath = '/path/to/array.json';
        const testArray = [{ id: 1, name: 'First' }, { id: 2, name: 'Second' }];
        const testJsonString = JSON.stringify(testArray);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<Array<{ id: number; name: string }>>(testFilePath);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[0].name).toBe('First');
        expect(result[1].id).toBe(2);
        expect(result[1].name).toBe('Second');
      });
    });

    describe('edge cases', () => {
      it('should handle large JSON files', async () => {
        const testFilePath = '/path/to/large.json';
        const largeData = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: 'A'.repeat(100)  // 100 char description
          }))
        };
        const testJsonString = JSON.stringify(largeData);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof largeData>(testFilePath);

        expect(result).toEqual(largeData);
        expect(result.items).toHaveLength(1000);
        expect(result.items[999].id).toBe(999);
      });

      it('should handle deeply nested JSON', async () => {
        const testFilePath = '/path/to/nested.json';
        const deeplyNested = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deep value',
                    array: [1, 2, 3]
                  }
                }
              }
            }
          }
        };
        const testJsonString = JSON.stringify(deeplyNested);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof deeplyNested>(testFilePath);

        expect(result).toEqual(deeplyNested);
        expect(result.level1.level2.level3.level4.level5.value).toBe('deep value');
        expect(result.level1.level2.level3.level4.level5.array).toEqual([1, 2, 3]);
      });

      it('should handle JSON with special numeric values', async () => {
        const testFilePath = '/path/to/special-numbers.json';
        const specialNumbers = {
          zero: 0,
          negativeZero: 0,
          maxSafeInteger: Number.MAX_SAFE_INTEGER,
          minSafeInteger: Number.MIN_SAFE_INTEGER,
          verySmall: 1e-10,
          veryLarge: 1e10
        };
        const testJsonString = JSON.stringify(specialNumbers);

        readFileAsyncSpy.mockResolvedValue(testJsonString);

        const result = await readFileModule.readJsonFile<typeof specialNumbers>(testFilePath);

        expect(result).toEqual(specialNumbers);
        expect(result.zero).toBe(0);
        expect(result.maxSafeInteger).toBe(Number.MAX_SAFE_INTEGER);
        expect(result.minSafeInteger).toBe(Number.MIN_SAFE_INTEGER);
      });
    });
  });
});

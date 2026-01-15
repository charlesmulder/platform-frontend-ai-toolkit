// Mock the utility dependencies
const mockGetLocalModulesMap = jest.fn();
const mockVerifyLocalPackage = jest.fn();
const mockReadFileAsync = jest.fn();
const mockFindExportSource = jest.fn();

jest.mock('../../utils/getLocalModulesMap', () => ({
  getLocalModulesMap: mockGetLocalModulesMap
}));

jest.mock('../../utils/verifyLocalPackage', () => ({
  verifyLocalPackage: mockVerifyLocalPackage
}));

jest.mock('../../utils/readFile', () => ({
  readFileAsync: mockReadFileAsync
}));

jest.mock('../../utils/exportScanner', () => ({
  findExportSource: mockFindExportSource
}));

import { getComponentSourceCode } from '../getComponentSourceCode';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  TEST_DATA,
  expectMcpTool,
  createMockError,
  errorTypeGuards
} from '../../__tests__/testUtils';

describe('getComponentSourceCode', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('tool configuration', () => {
    it('should return tool configuration with correct name and schema', () => {
      const tool = getComponentSourceCode();
      expectMcpTool.toHaveValidConfiguration(tool, 'getComponentSourceCode');

      const [, config] = tool;
      expect(config.description).toContain('Retrieve a source code of a specified Patternfly react-core module');
      expect(config.inputSchema.componentName).toBeDefined();
      expect(config.inputSchema.packageName).toBeDefined();
      expect(config.inputSchema.nodeModulesRootPath).toBeDefined();
    });

    it('should have proper package name enum values', () => {
      const [, config] = getComponentSourceCode();
      const packageSchema = config.inputSchema.packageName;

      // Check that the schema accepts valid enum values
      expect(() => packageSchema.parse('@patternfly/react-core')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-table')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-data-view')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-component-groups')).not.toThrow();

      // Check that invalid values are rejected
      expect(() => packageSchema.parse('invalid-package')).toThrow();
    });

    it('should have componentName as required parameter', () => {
      const [, config] = getComponentSourceCode();
      const componentNameSchema = config.inputSchema.componentName;

      expect(() => componentNameSchema.parse('Button')).not.toThrow();
      expect(() => componentNameSchema.parse(undefined)).toThrow();
    });

    it('should have optional packageName with default value', () => {
      const [, config] = getComponentSourceCode();
      const packageSchema = config.inputSchema.packageName;

      // Should be optional and default to @patternfly/react-core
      const result = packageSchema.parse(undefined);
      expect(result).toBe('@patternfly/react-core');
    });

    it('should have optional nodeModulesRootPath parameter', () => {
      const [, config] = getComponentSourceCode();
      const nodeModulesSchema = config.inputSchema.nodeModulesRootPath;

      expect(() => nodeModulesSchema.parse(undefined)).not.toThrow();
      expect(() => nodeModulesSchema.parse('/valid/path')).not.toThrow();
    });

    it('should have consistent configuration across multiple calls', () => {
      const [toolName1, config1, toolFunction1] = getComponentSourceCode();
      const [toolName2, config2, toolFunction2] = getComponentSourceCode();

      expect(toolName1).toBe(toolName2);
      expect(config1.description).toBe(config2.description);
      expect(typeof toolFunction1).toBe(typeof toolFunction2);
    });
  });

  describe('successful source code retrieval', () => {
    beforeEach(() => {
      // Default successful mocks
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/components/Button/Button.tsx',
        kind: 'variable',
        isDefault: false
      });
    });

    it('should successfully retrieve component source code', async () => {
      const componentContent = `import * as React from 'react';\nexport const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(componentContent);
    });

    it('should call findExportSource with correct packageRoot', async () => {
      const componentContent = `import * as React from 'react';\nexport const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({ componentName: 'Button' });

      expect(mockFindExportSource).toHaveBeenCalledWith('/node_modules/@patternfly/react-core', 'Button');
    });

    it('should use default package name when not provided', async () => {
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({ componentName: 'Button' });

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-core', undefined);
      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-core', undefined);
    });

    it('should use provided package name', async () => {
      // Set up mocks for different package
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-data-view'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'DataView': 'dist/dynamic/DataView'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'DataView',
        filePath: '/node_modules/@patternfly/react-data-view/src/DataView.tsx',
        kind: 'variable',
        isDefault: false
      });

      const componentContent = `export const DataView = () => <div>DataView</div>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({
        componentName: 'DataView',
        packageName: '@patternfly/react-data-view'
      });

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-data-view', undefined);
      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-data-view', undefined);
      expect(mockFindExportSource).toHaveBeenCalledWith('/node_modules/@patternfly/react-data-view', 'DataView');
    });

    it('should pass nodeModulesRootPath to utility functions', async () => {
      const customPath = '/custom/node_modules';
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({
        componentName: 'Button',
        nodeModulesRootPath: customPath
      });

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-core', customPath);
      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-core', customPath);
    });

    it('should read the file from the path returned by findExportSource', async () => {
      const componentContent = `export const Button = () => <button>Test</button>;`;
      const expectedPath = '/node_modules/@patternfly/react-core/src/components/Button/Button.tsx';

      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: expectedPath,
        kind: 'variable',
        isDefault: false
      });
      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({ componentName: 'Button' });

      expect(mockReadFileAsync).toHaveBeenCalledWith(expectedPath, 'utf-8');
    });

    it('should return the file content from the source file', async () => {
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(componentContent);
    });

    it('should handle different export kinds (function, class, etc)', async () => {
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/components/Button/Button.tsx',
        kind: 'function',
        isDefault: false
      });

      const componentContent = `export function Button() { return <button>Test</button>; }`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(componentContent);
    });
  });

  describe('input validation', () => {
    it('should throw McpError for missing componentName', async () => {
      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: componentName');
      }
    });

    it('should throw McpError for null componentName', async () => {
      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: null });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: componentName');
      }
    });

    it('should throw McpError for undefined componentName', async () => {
      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: undefined });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: componentName');
      }
    });

    it('should throw McpError for non-string componentName', async () => {
      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 123 });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: componentName');
      }
    });

    it('should throw McpError for empty string componentName', async () => {
      mockVerifyLocalPackage.mockResolvedValue({ exists: true, packageRoot: '/test' });
      mockGetLocalModulesMap.mockResolvedValue({});

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: '' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Component "" not found in available modules');
      }
    });
  });

  describe('package verification', () => {
    it('should throw McpError when package does not exist', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: new Error('Package not found')
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Package "@patternfly/react-core" not found locally');
      }
    });

    it('should include error message when package verification fails', async () => {
      const mockError = new Error('Permission denied');
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: mockError
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Permission denied');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle package verification for different package names', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: new Error('Package not found')
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({
          componentName: 'DataView',
          packageName: '@patternfly/react-data-view'
        });
        fail('Expected function to throw McpError');
      } catch (error) {
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('@patternfly/react-data-view');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });
  });

  describe('component path resolution', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
    });

    it('should throw McpError when component not found in modules map', async () => {
      mockGetLocalModulesMap.mockResolvedValue({
        'Card': 'lib/Card/index.js',
        'Modal': 'lib/Modal/index.js'
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Component "Button" not found in available modules');
      }
    });

    it('should throw McpError when component path is undefined in modules map', async () => {
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': undefined
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Component "Button" not found in available modules');
      }
    });

    it('should throw McpError when component path is null in modules map', async () => {
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': null
      });

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Component "Button" not found in available modules');
      }
    });
  });

  describe('export scanning', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });
    });

    it('should throw McpError when export source is not found', async () => {
      mockFindExportSource.mockResolvedValue(undefined);

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError, 'Failed to find source file for component "Button"');
      }
    });

    it('should call findExportSource with correct parameters', async () => {
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/Button.tsx',
        kind: 'variable',
        isDefault: false
      });
      mockReadFileAsync.mockResolvedValue('export const Button = () => <button>Test</button>;');

      const [, , toolFunction] = getComponentSourceCode();
      await toolFunction({ componentName: 'Button' });

      expect(mockFindExportSource).toHaveBeenCalledWith('/node_modules/@patternfly/react-core', 'Button');
    });
  });

  describe('source file reading', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/components/Button/Button.tsx',
        kind: 'variable',
        isDefault: false
      });
    });

    it('should throw McpError when source file cannot be read', async () => {
      const fsError = createMockError.fileSystem('ENOENT', 'no such file or directory');

      mockReadFileAsync.mockRejectedValue(fsError);

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError, 'Failed to read source code file for component "Button"');
      }
    });

    it('should handle permission errors when reading source files', async () => {
      const permissionError = createMockError.fileSystem('EACCES', 'permission denied');

      mockReadFileAsync.mockRejectedValue(permissionError);

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError, 'Failed to read source code file for component "Button"');
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('EACCES: permission denied');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should read the file at the path returned by findExportSource', async () => {
      const expectedPath = '/node_modules/@patternfly/react-core/src/components/Button/Button.tsx';
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: expectedPath,
        kind: 'variable',
        isDefault: false
      });
      mockReadFileAsync.mockResolvedValue(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expect(mockReadFileAsync).toHaveBeenCalledWith(expectedPath, 'utf-8');
      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(componentContent);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle getLocalModulesMap errors', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });

      const mapError = createMockError.standard('Failed to load modules map');
      mockGetLocalModulesMap.mockRejectedValue(mapError);

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to load modules map');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle non-Error objects in file reading', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/Button.tsx',
        kind: 'variable',
        isDefault: false
      });

      mockReadFileAsync.mockRejectedValueOnce('String error');

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('String error');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle findExportSource errors', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });

      const scanError = createMockError.standard('Failed to scan exports');
      mockFindExportSource.mockRejectedValue(scanError);

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: 'Button' });
        fail('Expected function to throw error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to scan exports');
        } else {
          fail('Expected error to be Error');
        }
      }
    });
  });

  describe('response format validation', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'Button': 'dist/dynamic/Button'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'Button',
        filePath: '/node_modules/@patternfly/react-core/src/Button.tsx',
        kind: 'variable',
        isDefault: false
      });
    });

    it('should always return content array with text type', async () => {
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
    });

    it('should not include additional properties in response', async () => {
      const componentContent = `export const Button = () => <button>Test</button>;`;

      mockReadFileAsync.mockResolvedValueOnce(componentContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
      const expectedKeys = ['content'];
      expect(Object.keys(result)).toEqual(expectedKeys);
    });

    it('should preserve exact source code content without modification', async () => {
      const specialContent = TEST_DATA.MARKDOWN.WITH_EMOJI + '\n// Component with special chars @#$%^&*()';

      mockReadFileAsync.mockResolvedValueOnce(specialContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'Button' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(specialContent);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very long component names', async () => {
      const longName = 'VeryLong' + 'ComponentName'.repeat(100);

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/test'
      });
      mockGetLocalModulesMap.mockResolvedValue({});

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: longName });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain(longName);
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle component names with special characters', async () => {
      const specialName = 'Component-With_Special@Characters#123';

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/test'
      });
      mockGetLocalModulesMap.mockResolvedValue({});

      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({ componentName: specialName });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain(specialName);
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle missing arguments object', async () => {
      const [, , toolFunction] = getComponentSourceCode();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams);
      }
    });

    it('should handle large source code files', async () => {
      const largeContent = 'const LargeComponent = () => {\n' + '  // '.repeat(10000) + 'Large content\n  return <div>Large</div>;\n};';

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-core'
      });
      mockGetLocalModulesMap.mockResolvedValue({
        'LargeComponent': 'dist/dynamic/LargeComponent'
      });
      mockFindExportSource.mockResolvedValue({
        name: 'LargeComponent',
        filePath: '/node_modules/@patternfly/react-core/src/LargeComponent.tsx',
        kind: 'variable',
        isDefault: false
      });

      mockReadFileAsync.mockResolvedValueOnce(largeContent);

      const [, , toolFunction] = getComponentSourceCode();
      const result = await toolFunction({ componentName: 'LargeComponent' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(largeContent);
      expect(expectMcpTool.getTextContent(result).length).toBeGreaterThan(50000);
    });
  });
});
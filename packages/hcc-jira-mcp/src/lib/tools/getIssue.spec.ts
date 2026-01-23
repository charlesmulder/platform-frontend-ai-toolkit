import { getIssueTool } from './getIssue';
import { JiraContext } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('getIssueTool', () => {
  const mockContext: JiraContext = {
    baseUrl: 'https://issues.redhat.com',
    apiToken: 'test-token-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tool configuration', () => {
    it('should return correct tool name and config', () => {
      const [name, config] = getIssueTool(mockContext);

      expect(name).toBe('search_jira_issues');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('inputSchema');
      expect(config.description).toContain('JQL');
    });
  });

  describe('single issue search', () => {
    it('should return detailed view for single issue', async () => {
      const mockIssue = {
        key: 'RHCLOUD-12345',
        fields: {
          summary: 'Test Issue',
          status: { name: 'Open' },
          assignee: { displayName: 'John Doe' },
          reporter: { displayName: 'Jane Smith' },
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-15T14:30:00.000Z',
          description: 'This is a test issue description',
          issuetype: { name: 'Bug' },
          priority: { name: 'High' },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [mockIssue],
          total: 1,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'issuekey=RHCLOUD-12345', maxResults: 50 });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('RHCLOUD-12345');
      expect(result.content[0].text).toContain('Test Issue');
      expect(result.content[0].text).toContain('**Type:** Bug');
      expect(result.content[0].text).toContain('**Status:** Open');
      expect(result.content[0].text).toContain('**Priority:** High');
      expect(result.content[0].text).toContain('**Assignee:** John Doe');
      expect(result.content[0].text).toContain('**Reporter:** Jane Smith');
      expect(result.content[0].text).toContain('This is a test issue description');
    });

    it('should handle missing optional fields', async () => {
      const mockIssue = {
        key: 'RHCLOUD-12345',
        fields: {
          summary: 'Test Issue',
          status: { name: 'Open' },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [mockIssue],
          total: 1,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'issuekey=RHCLOUD-12345' });

      expect(result.content[0].text).toContain('Unassigned');
      expect(result.content[0].text).toContain('Unknown');
      expect(result.content[0].text).toContain('No description');
    });
  });

  describe('multiple issues search', () => {
    it('should return table format for multiple issues', async () => {
      const mockIssues = [
        {
          key: 'RHCLOUD-1',
          fields: {
            summary: 'First Issue',
            status: { name: 'Open' },
            assignee: { displayName: 'John Doe' },
            priority: { name: 'High' },
            updated: '2024-01-15T10:00:00.000Z',
          },
        },
        {
          key: 'RHCLOUD-2',
          fields: {
            summary: 'Second Issue',
            status: { name: 'Closed' },
            assignee: { displayName: 'Jane Smith' },
            priority: { name: 'Normal' },
            updated: '2024-01-16T11:00:00.000Z',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: mockIssues,
          total: 2,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'assignee=currentUser()', maxResults: 50 });

      expect(result.content[0].text).toContain('| Key | Summary | Status | Assignee | Priority | Updated |');
      expect(result.content[0].text).toContain('RHCLOUD-1');
      expect(result.content[0].text).toContain('First Issue');
      expect(result.content[0].text).toContain('RHCLOUD-2');
      expect(result.content[0].text).toContain('Second Issue');
      expect(result.content[0].text).toContain('**Found:** 2 issue(s)');
    });

    it('should truncate long summaries in table view', async () => {
      const longSummary = 'A'.repeat(100);
      const mockIssue = {
        key: 'RHCLOUD-1',
        fields: {
          summary: longSummary,
          status: { name: 'Open' },
          updated: '2024-01-15T10:00:00.000Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [mockIssue, mockIssue],
          total: 2,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'project=RHCLOUD' });

      const summaryMatch = result.content[0].text.match(/\| [^|]+ \| ([^|]+) \|/);
      expect(summaryMatch).toBeTruthy();
      expect(summaryMatch![1].trim().length).toBeLessThanOrEqual(50);
    });

    it('should indicate when showing partial results', async () => {
      const mockIssues = Array(5).fill(null).map((_, i) => ({
        key: `RHCLOUD-${i}`,
        fields: {
          summary: `Issue ${i}`,
          status: { name: 'Open' },
          updated: '2024-01-15T10:00:00.000Z',
        },
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: mockIssues,
          total: 100, // More than shown
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'project=RHCLOUD' });

      expect(result.content[0].text).toContain('**Found:** 100 issue(s) (showing first 5)');
    });
  });

  describe('maxResults parameter', () => {
    it('should respect maxResults parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      await handler({ jql: 'project=RHCLOUD', maxResults: 25 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxResults=25'),
        expect.any(Object)
      );
    });

    it('should limit maxResults to 100', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      await handler({ jql: 'project=RHCLOUD', maxResults: 500 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxResults=100'),
        expect.any(Object)
      );
    });

    it('should default to 50 results when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      await handler({ jql: 'project=RHCLOUD' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxResults=50'),
        expect.any(Object)
      );
    });
  });

  describe('authentication', () => {
    it('should include correct authentication headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      await handler({ jql: 'project=RHCLOUD' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle no results gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'project=NONEXISTENT' });

      expect(result.content[0].text).toContain('No issues found for JQL query');
      expect(result.isError).toBeUndefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => '{"errorMessages":["Invalid JQL"]}',
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'invalid jql syntax' });

      expect(result.content[0].text).toContain('Failed to search JIRA issues');
      expect(result.content[0].text).toContain('400 Bad Request');
      expect(result.isError).toBe(true);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'project=RHCLOUD' });

      expect(result.content[0].text).toContain('Error searching JIRA issues');
      expect(result.content[0].text).toContain('Network error');
      expect(result.isError).toBe(true);
    });

    it('should handle unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid credentials',
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'project=RHCLOUD' });

      expect(result.content[0].text).toContain('401 Unauthorized');
      expect(result.isError).toBe(true);
    });
  });

  describe('JQL encoding', () => {
    it('should properly encode JQL with special characters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          total: 0,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const jql = 'summary ~ "test & special"';
      await handler({ jql });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain(encodeURIComponent(jql));
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly', async () => {
      const mockIssue = {
        key: 'RHCLOUD-1',
        fields: {
          summary: 'Test',
          created: '2024-01-15T10:30:00.000Z',
          updated: '2024-01-20T15:45:00.000Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [mockIssue],
          total: 1,
        }),
      });

      const [, , handler] = getIssueTool(mockContext);
      const result = await handler({ jql: 'key=RHCLOUD-1' });

      // Dates should be formatted as locale strings
      expect(result.content[0].text).toMatch(/\*\*Created:\*\* \d+\/\d+\/\d+/);
      expect(result.content[0].text).toMatch(/\*\*Updated:\*\* \d+\/\d+\/\d+/);
    });
  });
});

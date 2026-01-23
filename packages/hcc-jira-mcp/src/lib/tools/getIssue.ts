import { z } from "zod";
import { McpTool, JiraContext } from "../types";

const SearchIssuesSchema = z.object({
  jql: z.string().describe("JQL (JIRA Query Language) query string. Examples: 'assignee=currentUser() AND status=Open', 'project=MYPROJ AND created >= -7d', 'issuekey=PROJ-123'"),
  maxResults: z.number().optional().describe("Maximum number of results to return (default: 50, max: 100)")
});

export function getIssueTool(context: JiraContext): McpTool {
  return [
    "search_jira_issues",
    {
      description: "Search for JIRA issues using JQL (JIRA Query Language). Can retrieve a single issue by key or search with complex criteria like assignee, status, date ranges, etc.",
      inputSchema: SearchIssuesSchema
    },
    async (args) => {
      try {
        const { jql, maxResults = 50 } = args as z.infer<typeof SearchIssuesSchema>;

        // Limit maxResults to 100
        const limit = Math.min(maxResults, 100);

        // Fetch issues from JIRA API
        const url = `${context.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}`;
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${context.apiToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            content: [
              {
                type: "text",
                text: `Failed to search JIRA issues: ${response.status} ${response.statusText}\n${errorText}`
              }
            ],
            isError: true
          };
        }

        const searchResult = await response.json() as any;

        // Search endpoint returns { issues: [...], total: number }
        if (!searchResult.issues || searchResult.issues.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No issues found for JQL query: ${jql}`
              }
            ]
          };
        }

        const total = searchResult.total || 0;
        const issues = searchResult.issues;

        // Format results
        let result = `# JIRA Search Results\n\n`;
        result += `**Query:** \`${jql}\`\n`;
        result += `**Found:** ${total} issue(s)`;
        if (total > issues.length) {
          result += ` (showing first ${issues.length})`;
        }
        result += `\n\n`;

        // If only one issue, show full details
        if (issues.length === 1) {
          const issue = issues[0];
          const summary = issue.fields?.summary || 'No summary';
          const status = issue.fields?.status?.name || 'Unknown';
          const assignee = issue.fields?.assignee?.displayName || 'Unassigned';
          const reporter = issue.fields?.reporter?.displayName || 'Unknown';
          const created = issue.fields?.created ? new Date(issue.fields.created).toLocaleDateString() : 'Unknown';
          const updated = issue.fields?.updated ? new Date(issue.fields.updated).toLocaleDateString() : 'Unknown';
          const description = issue.fields?.description || 'No description';
          const issueType = issue.fields?.issuetype?.name || 'Unknown';
          const priority = issue.fields?.priority?.name || 'Unknown';

          result += `## ${issue.key}: ${summary}\n\n`;
          result += `**Type:** ${issueType}\n`;
          result += `**Status:** ${status}\n`;
          result += `**Priority:** ${priority}\n`;
          result += `**Assignee:** ${assignee}\n`;
          result += `**Reporter:** ${reporter}\n`;
          result += `**Created:** ${created}\n`;
          result += `**Updated:** ${updated}\n\n`;
          result += `### Description\n${description}\n\n`;
          result += `**URL:** ${context.baseUrl}/browse/${issue.key}`;
        } else {
          // Multiple issues - show summary table
          result += `| Key | Summary | Status | Assignee | Priority | Updated |\n`;
          result += `|-----|---------|--------|----------|----------|----------|\n`;

          issues.forEach((issue: any) => {
            const key = issue.key || 'N/A';
            const summary = (issue.fields?.summary || 'No summary').substring(0, 50);
            const status = issue.fields?.status?.name || 'Unknown';
            const assignee = issue.fields?.assignee?.displayName || 'Unassigned';
            const priority = issue.fields?.priority?.name || 'Unknown';
            const updated = issue.fields?.updated ? new Date(issue.fields.updated).toLocaleDateString() : 'Unknown';

            result += `| [${key}](${context.baseUrl}/browse/${key}) | ${summary} | ${status} | ${assignee} | ${priority} | ${updated} |\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching JIRA issues: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    }
  ];
}

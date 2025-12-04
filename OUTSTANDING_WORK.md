# Outstanding Work & Future Roadmap

This document tracks outstanding work, planned integrations, and potential future developments for the HCC Frontend AI Toolkit.

## 🚧 In Progress / Priority Work

### MCP Server Integrations

#### 1. Browser Tools MCP Server
- **Repository**: https://github.com/AgentDeskAI/browser-tools-mcp
- **Purpose**: Browser automation, screenshot capture, and web interaction tools
- **Benefits**:
  - Automated testing workflows
  - Visual regression testing
  - Web scraping and content extraction
  - Browser debugging and inspection
- **Status**: 🔄 **To be implemented**
- **Integration Plan**:
  - Add as MCP server configuration in `cursor/mcp-template.json`
  - Create corresponding Claude Code plugin integration
  - Add browser automation agents for frontend testing workflows

#### 2. Figma MCP Server
- **Repository**: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- **Purpose**: Design-to-code workflows and Figma integration
- **Benefits**:
  - Extract design tokens from Figma files
  - Generate component code from Figma designs
  - Sync design system changes
  - Automated design-to-PatternFly component mapping
- **Status**: 🔄 **To be implemented**
- **Integration Plan**:
  - Set up Figma MCP server configuration
  - Create agents for design-to-code workflows
  - Integrate with PatternFly component library
  - Add design token extraction capabilities

#### 3. Playwright Agent with MCP Integration
- **Repository**: https://github.com/microsoft/playwright-mcp (MCP server)
- **Purpose**: E2E testing automation with organizational standards enforcement
- **Benefits**:
  - Automated E2E test generation following Red Hat standards
  - Cross-browser testing workflows with team guidelines compliance
  - Visual testing and comparison with approved patterns
  - Performance testing automation with organizational benchmarks
  - Accessibility testing enforcement per Red Hat requirements
  - Standardized test structure, naming conventions, and best practices
- **Status**: 🔄 **To be implemented**
- **Integration Plan**:
  - Configure existing Microsoft Playwright MCP server
  - **Create custom Red Hat Playwright agent** (`hcc-frontend-playwright-specialist`)
  - Implement organizational standards enforcement in test generation
  - Add Red Hat-specific test patterns and guidelines
  - Integrate with existing Storybook workflows and testing standards
  - Build automated compliance checks for team testing requirements

### Agent Development

#### 4. Scalprum Agent & MCP
- **Repository**: https://github.com/scalprum/scaffolding
- **Purpose**: Micro-frontend scaffolding and architecture support
- **Benefits**:
  - Automated micro-frontend project scaffolding
  - Module federation configuration
  - Scalprum-specific code generation
  - Micro-frontend best practices enforcement
- **Status**: 🔄 **To be designed and implemented**
- **Requirements**:
  - Research Scalprum scaffolding workflows
  - Design agent capabilities for micro-frontend project setup
  - Create MCP tools for Scalprum configuration
  - Add support for module federation patterns

#### 5. Frontend Operator (FEO) Agent & MCP
- **Repository**: https://github.com/RedHatInsights/frontend-operator
- **Purpose**: HCC frontend resource configuration and deployment automation
- **Benefits**:
  - Automated frontend resource config generation (routes, nav, search)
  - Bundle configuration and deployment workflows
  - Navigation structure management
  - Search configuration automation
  - Environment-specific frontend resource management
- **Status**: 🔄 **To be designed and implemented**
- **Requirements**:
  - Research Frontend Operator resource configurations
  - Design agents for route and navigation config generation
  - Create MCP tools for frontend resource management
  - Add support for HCC-specific deployment patterns

#### 6. Data Driven Forms (DDF) Agent & MCP
- **Repository**: https://github.com/data-driven-forms/react-forms
- **Purpose**: Dynamic form generation and management for React applications
- **Benefits**:
  - Automated form schema generation
  - Dynamic form component creation
  - Form validation and submission workflows
  - Integration with PatternFly form components
- **Status**: 🤔 **Under consideration - needs team input**
- **Requirements**:
  - Assess team usage of Data Driven Forms
  - Design form generation workflows
  - Create schema-to-component mapping
  - Integrate with existing PatternFly patterns

## 💡 Team Suggestions & Future Ideas

### Community-Driven Additions
- **Process**: Team members can suggest new integrations and agents
- **Criteria for Addition**:
  - Solves real frontend development pain points
  - Integrates well with existing Red Hat Console workflows
  - Has community support and maintenance
  - Provides clear value proposition over existing tools

### Potential Future Integrations
- **Accessibility Testing**: axe-core MCP integration for automated a11y testing
- **Performance Monitoring**: Web Vitals and Lighthouse integration
- **API Testing**: REST/GraphQL testing and mock generation
- **Documentation**: Automated JSDoc and component documentation generation
- **Security**: Vulnerability scanning and secure coding practices
- **Internationalization**: i18n workflow automation and translation management

## 📋 Implementation Checklist

When implementing new MCP servers or agents, follow this checklist:

### MCP Server Integration
- [ ] Research and test the MCP server locally
- [ ] Add configuration to `cursor/mcp-template.json`
- [ ] Create Claude Code plugin integration in `claude/agents/`
- [ ] Add corresponding Cursor rules via conversion script
- [ ] Update documentation and README
- [ ] Write comprehensive tests for new functionality
- [ ] Add example usage and workflows
- [ ] Update plugin version and publish

### Agent Development
- [ ] Follow [Agent Guidelines](AGENT_GUIDELINES.md)
- [ ] Use `hcc-frontend-` prefix for naming
- [ ] Create focused, single-purpose agents
- [ ] Add proper YAML frontmatter with description and capabilities
- [ ] Test agent functionality thoroughly
- [ ] Convert to Cursor format using `npm run convert-cursor`
- [ ] Verify sync with `npm run check-cursor-sync`
- [ ] Update plugin manifest and version

### Documentation Requirements
- [ ] Update main README with new agents/tools
- [ ] Add usage examples and common workflows
- [ ] Document any setup requirements or dependencies
- [ ] Include troubleshooting guides
- [ ] Update this outstanding work document

## 🎯 Team Prioritization

### Priority Levels
1. **🔥 High Priority**: Browser Tools MCP, Playwright MCP (testing automation), Frontend Operator Agent (deployment automation)
2. **🚀 Medium Priority**: Figma MCP (design workflows), Scalprum Agent (micro-frontend scaffolding)
3. **🤔 Low Priority**: DDF Agent (needs team evaluation), Community suggestions

### Resource Allocation
- **Sprint Planning**: Include MCP/agent work in regular sprint planning
- **Time Boxing**: Allocate specific time for agent development and testing
- **Team Review**: Regular review of outstanding work and priorities
- **Community Input**: Gather team feedback on most valuable additions

## 📞 Getting Involved

### How to Contribute
1. **Suggest New Integrations**: Open an issue with your suggestion
2. **Implement Agents**: Follow the development guidelines and submit PRs
3. **Test and Feedback**: Help test new integrations and provide feedback
4. **Documentation**: Improve documentation and add examples

### Contact and Collaboration
- **GitHub Issues**: Use for tracking work and discussions
- **Pull Requests**: For implementing new features and fixes
- **Team Reviews**: Include in regular team meetings and sprint planning
- **Slack/Teams**: For quick questions and coordination

## 📚 Reference Links

### Key Repositories
- **Browser Tools MCP**: https://github.com/AgentDeskAI/browser-tools-mcp
- **Figma MCP Server**: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- **Playwright MCP**: https://github.com/microsoft/playwright-mcp
- **Scalprum Scaffolding**: https://github.com/scalprum/scaffolding
- **Frontend Operator (FEO)**: https://github.com/RedHatInsights/frontend-operator
- **Data Driven Forms**: https://github.com/data-driven-forms/react-forms

### Internal Documentation
- **Agent Guidelines**: [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)
- **Main README**: [README.md](README.md)
- **MCP Server Documentation**: [packages/hcc-pf-mcp/README.md](packages/hcc-pf-mcp/README.md)

---

*This document is maintained by the Frontend AI Toolkit team. Last updated: December 2024*
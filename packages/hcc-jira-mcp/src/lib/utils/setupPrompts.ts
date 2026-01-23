import prompts from 'prompts';
import { storeCredentials, getCredentials, deleteCredentials, hasCredentials } from './credentialStore.js';

export async function runSetup(isFirstRun: boolean = false): Promise<boolean> {
  if (isFirstRun) {
    console.log('\n🔧 JIRA MCP Server - First Time Setup\n');
    console.log('Welcome! Let\'s configure your JIRA connection.\n');
  } else {
    console.log('\n🔧 HCC JIRA MCP Setup\n');
  }

  // Check if credentials already exist
  const hasExisting = await hasCredentials();
  if (hasExisting && !isFirstRun) {
    const existing = await getCredentials();
    console.log('⚠️  Existing configuration found:');
    console.log(`   JIRA URL: ${existing?.baseUrl}\n`);

    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Do you want to overwrite the existing configuration?',
      initial: false,
    });

    if (!overwrite) {
      console.log('\n✅ Setup cancelled. Existing configuration preserved.');
      return false;
    }

    // Delete existing credentials
    await deleteCredentials();
    console.log('\n🗑️  Existing configuration removed.\n');
  }

  // Prompt for JIRA credentials
  const responses = await prompts([
    {
      type: 'text',
      name: 'baseUrl',
      message: 'JIRA Base URL (e.g., https://your-domain.atlassian.net):',
      validate: (value) => {
        if (!value) return 'JIRA URL is required';
        try {
          new URL(value);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'password',
      name: 'apiToken',
      message: 'JIRA API Token:',
      validate: (value) => {
        if (!value) return 'API Token is required';
        return true;
      },
    },
  ]);

  // Check if user cancelled
  if (!responses.baseUrl || !responses.apiToken) {
    console.log('\n❌ Setup cancelled.');
    return false;
  }

  try {
    // Store credentials
    await storeCredentials({
      baseUrl: responses.baseUrl.trim(),
      apiToken: responses.apiToken,
    });

    console.log('\n✅ Configuration saved successfully!');
    console.log('\n📝 Your JIRA API token has been securely stored in your system keychain.');
    console.log('   - macOS: Keychain Access');
    console.log('   - Windows: Credential Manager');
    console.log('   - Linux: Secret Service API / libsecret\n');

    if (isFirstRun) {
      console.log('🚀 Setup complete! The MCP server will now start...\n');
    } else {
      console.log('You can now use the HCC JIRA MCP server with your AI assistant.\n');
    }

    return true;
  } catch (error) {
    console.error('\n❌ Failed to save configuration:', (error as Error).message);
    return false;
  }
}

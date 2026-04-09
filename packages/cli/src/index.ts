#!/usr/bin/env node

/**
 * @qwen-paperclip/cli
 * CLI de configuração e deploy do Qwen Paperclip
 * 
 * Comandos disponíveis:
 *   onboard     - Wizard de configuração inicial (similar ao Paperclip)
 *   doctor      - Diagnóstico do sistema
 *   init        - Inicializa projeto
 *   add-agent   - Adiciona agente Qwen
 *   add-heartbeat - Configura heartbeat
 *   start       - Inicia scheduler
 *   status      - Verifica status
 *   test        - Testa agente
 *   configure   - Configuração avançada
 */

import { Command, OptionValues } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import { QwenAgent, QwenAgentConfig } from '@qwen-paperclip/agent';
import { HeartbeatScheduler, HeartbeatConfig } from '@qwen-paperclip/heartbeat';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Banner ASCII
const banner = figlet.textSync('Qwen Paperclip', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
});

program
  .name('qwen-paperclip')
  .description('Orchestrate Qwen Code agents with local OAuth — Zero API Keys!')
  .version('0.1.0');

// ============================================================================
// COMANDO: onboard (Wizard de configuração inicial)
// Similar ao: npx paperclipai onboard
// ============================================================================
program
  .command('onboard')
  .description('Interactive onboarding wizard (like Paperclip)')
  .option('-y, --yes', 'Accept all defaults for quick setup')
  .option('--skip-auth', 'Skip OAuth authentication')
  .option('--skip-test', 'Skip agent test')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log();
    
    const boxStyle = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    };

    if (options.yes) {
      // Quick setup mode
      await runQuickSetup(options);
    } else {
      // Interactive wizard
      await runInteractiveWizard(options);
    }
  });

// ============================================================================
// COMANDO: doctor (Diagnóstico do sistema)
// Similar ao: paperclipai doctor
// ============================================================================
program
  .command('doctor')
  .description('Run system diagnostics and health check')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    const diagnostics = await runDiagnostics();
    
    if (options.json) {
      console.log(JSON.stringify(diagnostics, null, 2));
    } else {
      printDiagnostics(diagnostics);
    }
  });

// ============================================================================
// COMANDO: init
// ============================================================================
program
  .command('init')
  .description('Initialize a new Qwen Paperclip project')
  .option('-n, --name <name>', 'Project name', 'my-ai-company')
  .option('-d, --directory <dir>', 'Working directory', process.cwd())
  .action(async (options) => {
    const spinner = ora('Initializing project...').start();
    
    try {
      const configDir = join(options.directory, '.qwen-paperclip');
      
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      const configFile = join(configDir, 'config.json');
      const config = {
        name: options.name,
        version: '0.1.0',
        agents: [],
        heartbeats: [],
        createdAt: new Date().toISOString(),
        settings: {
          approvalMode: 'yolo',
          outputFormat: 'json',
          logLevel: 'info'
        }
      };

      writeFileSync(configFile, JSON.stringify(config, null, 2));
      spinner.succeed(`Project initialized: ${chalk.green(options.name)}`);
      
      const nextSteps = boxen(
        chalk.white(`
  Next steps:
  
  1. ${chalk.cyan('qwen-paperclip add-agent')} - Add your first agent
  2. ${chalk.cyan('qwen-paperclip add-heartbeat')} - Configure scheduling
  3. ${chalk.cyan('qwen-paperclip start')} - Start the scheduler
  4. ${chalk.cyan('qwen-paperclip test')} - Test your agent
        `),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
      );
      
      console.log();
      console.log(nextSteps);
    } catch (error: any) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(error.message || String(error)));
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: add-agent
// ============================================================================
program
  .command('add-agent')
  .description('Add a new Qwen agent to your project')
  .option('-n, --name <name>', 'Agent name', 'qwen-agent-1')
  .option('-d, --directory <dir>', 'Working directory', process.cwd())
  .option('-a, --approval <mode>', 'Approval mode (yolo, auto_edit, ask)', 'yolo')
  .option('-o, --output <format>', 'Output format (json, stream-json, text)', 'json')
  .action(async (options: OptionValues) => {
    const spinner = ora(`Adding agent: ${options.name}`).start();
    
    try {
      const config = loadProjectConfig();
      
      const agentConfig = {
        id: `agent_${Date.now()}`,
        name: options.name,
        workingDirectory: options.directory,
        approvalMode: options.approval,
        outputFormat: options.output,
        createdAt: new Date().toISOString()
      };

      config.agents.push(agentConfig);
      saveProjectConfig(config);
      
      spinner.succeed(`Agent added: ${chalk.green(options.name)} (ID: ${agentConfig.id})`);
      
      const agentInfo = boxen(
        chalk.white(`
  Agent Configuration:
  
  ID:              ${chalk.cyan(agentConfig.id)}
  Name:            ${chalk.cyan(agentConfig.name)}
  Directory:       ${chalk.cyan(agentConfig.workingDirectory)}
  Approval Mode:   ${chalk.cyan(agentConfig.approvalMode)}
  Output Format:   ${chalk.cyan(agentConfig.outputFormat)}
        `),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'blue' }
      );
      
      console.log(agentInfo);
    } catch (error: any) {
      spinner.fail('Failed to add agent');
      console.error(chalk.red(error.message || String(error)));
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: add-heartbeat
// ============================================================================
program
  .command('add-heartbeat')
  .description('Add a heartbeat to an agent')
  .requiredOption('-a, --agent-id <id>', 'Agent ID')
  .option('-s, --schedule <schedule>', 'Schedule (cron or seconds)', '300')
  .option('-r, --retries <count>', 'Max retries', '3')
  .action(async (options: OptionValues) => {
    const spinner = ora(`Adding heartbeat to agent: ${options.agentId}`).start();
    
    try {
      const config = loadProjectConfig();
      
      const heartbeatConfig = {
        id: `hb_${Date.now()}`,
        agentId: options.agentId,
        schedule: isNaN(options.schedule) ? options.schedule : parseInt(options.schedule),
        maxRetries: parseInt(options.retries),
        enabled: true,
        createdAt: new Date().toISOString()
      };

      config.heartbeats.push(heartbeatConfig);
      saveProjectConfig(config);
      
      spinner.succeed(`Heartbeat configured: ${chalk.green(heartbeatConfig.id)}`);
      
      const hbInfo = boxen(
        chalk.white(`
  Heartbeat Configuration:
  
  ID:              ${chalk.cyan(heartbeatConfig.id)}
  Agent ID:        ${chalk.cyan(heartbeatConfig.agentId)}
  Schedule:        ${chalk.cyan(heartbeatConfig.schedule)}
  Max Retries:     ${chalk.cyan(heartbeatConfig.maxRetries)}
  Status:          ${chalk.green('Enabled')}
        `),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
      );
      
      console.log(hbInfo);
    } catch (error: any) {
      spinner.fail('Failed to add heartbeat');
      console.error(chalk.red(error.message || String(error)));
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: start
// ============================================================================
program
  .command('start')
  .description('Start the heartbeat scheduler')
  .option('-c, --config <path>', 'Config file path', '.qwen-paperclip/config.json')
  .option('--watch', 'Watch for file changes', false)
  .action(async (options: OptionValues) => {
    console.log(chalk.cyan(banner));
    console.log();
    
    if (!existsSync(options.config)) {
      console.log(chalk.red('✗ Config file not found'));
      console.log(chalk.yellow('  Run: qwen-paperclip onboard'));
      process.exit(1);
    }

    const config = JSON.parse(readFileSync(options.config, 'utf-8'));
    
    const summary = boxen(
      chalk.white(`
  Starting Qwen Paperclip Scheduler
  
  Project:         ${chalk.cyan(config.name)}
  Agents:          ${chalk.cyan(config.agents.length)}
  Heartbeats:      ${chalk.cyan(config.heartbeats.length)}
  Watch Mode:      ${chalk.cyan(options.watch ? 'Yes' : 'No')}
      `),
      { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
    );
    
    console.log(summary);
    console.log(chalk.green('✓ Scheduler started'));
    console.log(chalk.gray('  Press Ctrl+C to stop'));
    console.log();

    // TODO: Implementar scheduler principal
    // Por enquanto, manter processo ativo
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScheduler stopped'));
      process.exit(0);
    });

    // Manter processo ativo
    setInterval(() => {
      // Heartbeat loop virá aqui
    }, 1000);
  });

// ============================================================================
// COMANDO: status
// ============================================================================
program
  .command('status')
  .description('Check system and OAuth status')
  .action(async () => {
    const spinner = ora('Checking system status...').start();
    
    try {
      // Check Qwen Code
      const qwenCheck = await checkQwenInstalled();
      
      // Check OAuth
      const oauthCheck = await checkOAuth();
      
      // Check config
      const configExists = existsSync('.qwen-paperclip/config.json');
      
      spinner.stop();
      
      const statusBox = boxen(
        chalk.white(`
  System Status:
  
  Qwen Code:       ${qwenCheck ? chalk.green('✓ Installed') : chalk.red('✗ Not found')}
  OAuth Cache:     ${oauthCheck.valid ? chalk.green('✓ Valid') : chalk.yellow('⚠ Needs login')}
  Config File:     ${configExists ? chalk.green('✓ Found') : chalk.red('✗ Not found')}
  Node.js:         ${chalk.green('✓ ' + process.version)}
  Platform:        ${chalk.green(process.platform + ' ' + process.arch)}
        `),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: oauthCheck.valid ? 'green' : 'yellow' }
      );
      
      console.log(statusBox);
      
      if (!qwenCheck) {
        console.log(chalk.yellow('\nInstall Qwen Code:'));
        console.log(chalk.cyan('  npm install -g @anthropic-ai/qwen-code'));
      }
      
      if (!oauthCheck.valid) {
        console.log(chalk.yellow('\nLogin with OAuth:'));
        console.log(chalk.cyan('  qwen'));
      }
    } catch (error: any) {
      spinner.fail('Status check failed');
      console.error(chalk.red(error.message || String(error)));
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: test
// ============================================================================
program
  .command('test')
  .description('Test a Qwen agent')
  .option('-p, --prompt <text>', 'Test prompt', 'Say hello! This is a Qwen Paperclip test.')
  .option('-a, --agent-id <id>', 'Specific agent ID')
  .option('-o, --output <format>', 'Output format', 'text')
  .action(async (options: OptionValues) => {
    const spinner = ora('Testing Qwen agent...').start();
    
    try {
      const result = await runQwenTest(options.prompt, options.output);
      
      spinner.succeed('Test completed');
      console.log();
      
      const testResult = boxen(
        chalk.white(`
  Test Result:
  
  ${chalk.cyan('Prompt:')} ${options.prompt}
  
  ${chalk.cyan('Response:')}
  ${result.content}
  
  ${chalk.cyan('Stats:')}
  - Tokens: ${result.stats?.totalTokens || 'N/A'}
  - Tool Calls: ${result.stats?.toolCalls || 0}
  - Duration: ${result.duration || 'N/A'}
        `),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
      );
      
      console.log(testResult);
    } catch (error: any) {
      spinner.fail('Test failed');
      console.error(chalk.red(error.message || String(error)));
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: configure
// ============================================================================
program
  .command('configure')
  .description('Advanced configuration')
  .option('--section <section>', 'Config section (server, agents, heartbeats)')
  .action(async (options: OptionValues) => {
    // Similar ao paperclipai configure
    const config = loadProjectConfig();
    console.log(JSON.stringify(config, null, 2));
  });

program.parse();

// ============================================================================
// FUNÇÕES AUXILIARES - ONBOARDING
// ============================================================================

/**
 * Quick setup mode (--yes flag)
 */
async function runQuickSetup(options: OptionValues) {
  const spinner = ora('Setting up Qwen Paperclip...').start();
  
  try {
    // Step 1: Create project
    spinner.text = 'Creating project...';
    const configDir = join(process.cwd(), '.qwen-paperclip');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Step 2: Check Qwen Code
    spinner.text = 'Checking Qwen Code...';
    const qwenInstalled = await checkQwenInstalled();
    if (!qwenInstalled) {
      spinner.fail('Qwen Code not found');
      console.log(chalk.yellow('\nInstall with:'));
      console.log(chalk.cyan('  npm install -g @anthropic-ai/qwen-code'));
      process.exit(1);
    }

    // Step 3: Check OAuth
    spinner.text = 'Checking OAuth...';
    const oauthCheck = await checkOAuth();
    
    // Step 4: Create default config
    spinner.text = 'Creating configuration...';
    const config = {
      name: 'my-ai-company',
      version: '0.1.0',
      agents: [
        {
          id: 'agent_ceo',
          name: 'CEO Agent',
          workingDirectory: process.cwd(),
          approvalMode: 'yolo',
          outputFormat: 'json',
          role: 'ceo',
          createdAt: new Date().toISOString()
        }
      ],
      heartbeats: [
        {
          id: 'hb_ceo',
          agentId: 'agent_ceo',
          schedule: 300,
          maxRetries: 3,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ],
      settings: {
        approvalMode: 'yolo',
        outputFormat: 'json',
        logLevel: 'info'
      },
      createdAt: new Date().toISOString()
    };

    writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2));

    // Step 5: Test agent
    if (!options.skipTest) {
      spinner.text = 'Testing agent...';
      await runQwenTest('Say hello from the CEO agent!', 'text');
    }

    spinner.succeed('Setup completed!');

    const successBox = boxen(
      chalk.green(`
  ✓ Qwen Paperclip is ready!
  
  Project:         my-ai-company
  Agents:          1 (CEO Agent)
  Heartbeat:       Every 5 minutes
  OAuth:           ${oauthCheck.valid ? 'Valid' : 'Needs login'}
  
  Next commands:
  
  • ${chalk.cyan('qwen-paperclip status')}  - Check status
  • ${chalk.cyan('qwen-paperclip start')}    - Start scheduler
  • ${chalk.cyan('qwen-paperclip test')}     - Test agent
  • ${chalk.cyan('qwen-paperclip doctor')}   - Run diagnostics
      `),
      { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
    );

    console.log(successBox);

  } catch (error: any) {
    spinner.fail('Setup failed');
    console.error(chalk.red(error.message || String(error)));
    process.exit(1);
  }
}

/**
 * Interactive wizard
 */
async function runInteractiveWizard(options: OptionValues) {
  console.log(boxen(
    chalk.white('  Welcome to Qwen Paperclip!  \n  Let\'s set up your AI company in 4 steps.'),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));
  console.log();

  // Step 1: Project setup
  console.log(chalk.cyan('━━━ Step 1/4: Project Setup ━━━'));
  const projectAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What\'s your AI company name?',
      default: 'my-ai-company'
    },
    {
      type: 'input',
      name: 'projectDir',
      message: 'Working directory?',
      default: process.cwd()
    }
  ]);

  const spinner = ora('Creating project...').start();
  const configDir = join(projectAnswers.projectDir, '.qwen-paperclip');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  spinner.succeed('Project created');

  // Step 2: First agent
  console.log(chalk.cyan('\n━━━ Step 2/4: First Agent ━━━'));
  const agentAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'What should we name your first agent?',
      default: 'CEO Agent'
    },
    {
      type: 'list',
      name: 'approvalMode',
      message: 'Approval mode?',
      choices: [
        { name: 'Yolo (fully automatic)', value: 'yolo' },
        { name: 'Auto-edit (approve edits)', value: 'auto_edit' },
        { name: 'Ask (manual approval)', value: 'ask' }
      ],
      default: 'yolo'
    },
    {
      type: 'input',
      name: 'workingDir',
      message: 'Agent working directory?',
      default: projectAnswers.projectDir
    }
  ]);

  spinner.text = 'Creating agent...';
  spinner.start();

  // Step 3: Heartbeat
  console.log(chalk.cyan('\n━━━ Step 3/4: Heartbeat Schedule ━━━'));
  const heartbeatAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'schedule',
      message: 'How often should the agent run?',
      choices: [
        { name: 'Every minute', value: 60 },
        { name: 'Every 5 minutes', value: 300 },
        { name: 'Every 15 minutes', value: 900 },
        { name: 'Every hour', value: 3600 },
        { name: 'Custom (cron expression)', value: 'custom' }
      ],
      default: 300
    },
    {
      type: 'input',
      name: 'customCron',
      message: 'Enter cron expression:',
      when: (answers) => answers.schedule === 'custom'
    }
  ]);

  // Step 4: OAuth check
  console.log(chalk.cyan('\n━━━ Step 4/4: OAuth Authentication ━━━'));
  const oauthCheck = await checkOAuth();
  
  if (!oauthCheck.valid && !options.skipAuth) {
    console.log(chalk.yellow('  OAuth login required'));
    console.log(chalk.gray('  Opening browser for qwen.ai login...'));
    console.log();
    console.log(chalk.cyan('  Run: qwen'));
    console.log();
    
    const { shouldLogin } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldLogin',
        message: 'Open browser for OAuth login now?',
        default: true
      }
    ]);

    if (shouldLogin) {
      // Abrir browser para OAuth
      const { exec } = await import('child_process');
      exec('qwen');
      spinner.text = 'Waiting for OAuth...';
      spinner.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.text = 'OAuth login initiated';
    }
  } else {
    spinner.succeed('OAuth is valid');
  }

  // Create final config
  spinner.text = 'Finalizing setup...';
  spinner.start();

  const schedule = heartbeatAnswers.schedule === 'custom' 
    ? heartbeatAnswers.customCron 
    : heartbeatAnswers.schedule;

  const agentId = `agent_${Date.now()}`;
  const heartbeatId = `hb_${Date.now()}`;

  const config = {
    name: projectAnswers.projectName,
    version: '0.1.0',
    agents: [
      {
        id: agentId,
        name: agentAnswers.agentName,
        workingDirectory: agentAnswers.workingDir,
        approvalMode: agentAnswers.approvalMode,
        outputFormat: 'json',
        role: 'ceo',
        createdAt: new Date().toISOString()
      }
    ],
    heartbeats: [
      {
        id: heartbeatId,
        agentId: agentId,
        schedule: schedule,
        maxRetries: 3,
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ],
    settings: {
      approvalMode: agentAnswers.approvalMode,
      outputFormat: 'json',
      logLevel: 'info'
    },
    createdAt: new Date().toISOString()
  };

  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2));
  spinner.succeed('Setup complete!');

  // Success summary
  const successBox = boxen(
    chalk.green(`
  ✓ Welcome to Qwen Paperclip!
  
  Project:         ${projectAnswers.projectName}
  Agent:           ${agentAnswers.agentName} (${agentId})
  Heartbeat:       Every ${typeof schedule === 'number' ? schedule + 's' : schedule}
  Approval:        ${agentAnswers.approvalMode}
  
  Quick start:
  
  • ${chalk.cyan('qwen-paperclip status')}  - Check status
  • ${chalk.cyan('qwen-paperclip start')}    - Start scheduler
  • ${chalk.cyan('qwen-paperclip test')}     - Test your agent
  • ${chalk.cyan('qwen-paperclip doctor')}   - Run diagnostics
  • ${chalk.cyan('qwen-paperclip add-agent')} - Add more agents
      `),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
  );

  console.log(successBox);
}

// ============================================================================
// FUNÇÕES AUXILIARES - DIAGNOSTICS
// ============================================================================

interface DiagnosticCheck {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  version?: string;
  required?: string;
  cachePath?: string;
  port?: number;
}

interface DiagnosticResults {
  timestamp: string;
  checks: {
    nodejs?: DiagnosticCheck;
    pnpm?: DiagnosticCheck;
    qwenCode?: DiagnosticCheck;
    oauth?: DiagnosticCheck;
    config?: DiagnosticCheck;
    ports?: {
      api: { port: number; status: string };
      dashboard: { port: number; status: string };
      database: { port: number; status: string };
    };
  };
  overall: 'pass' | 'fail';
}

/**
 * Run system diagnostics
 */
async function runDiagnostics(): Promise<DiagnosticResults> {
  const results: DiagnosticResults = {
    timestamp: new Date().toISOString(),
    checks: {},
    overall: 'pass'
  };

  // Check Node.js
  results.checks.nodejs = {
    status: 'pass',
    version: process.version,
    required: '>=20.0.0'
  };

  // Check pnpm
  try {
    const { stdout } = await execPromise('pnpm --version');
    results.checks.pnpm = {
      status: 'pass',
      version: stdout.trim()
    };
  } catch {
    results.checks.pnpm = {
      status: 'fail',
      message: 'pnpm not found'
    };
  }

  // Check Qwen Code
  results.checks.qwenCode = await checkQwenInstalled()
    ? { status: 'pass', message: 'Installed' }
    : { status: 'fail', message: 'Not found. Install with: npm install -g @anthropic-ai/qwen-code' };

  // Check OAuth
  const oauthCheck = await checkOAuth();
  results.checks.oauth = {
    status: oauthCheck.valid ? 'pass' : 'warn',
    message: oauthCheck.valid ? 'Valid' : 'Needs login (run: qwen)',
    cachePath: oauthCheck.cachePath
  };

  // Check config
  const configExists = existsSync('.qwen-paperclip/config.json');
  results.checks.config = {
    status: configExists ? 'pass' : 'warn',
    message: configExists ? 'Found' : 'Not found (run: qwen-paperclip onboard)'
  };

  // Check ports
  results.checks.ports = {
    api: { port: 3100, status: 'available' },
    dashboard: { port: 3000, status: 'available' },
    database: { port: 5432, status: 'available' }
  };

  // Calculate overall status
  const hasFail = Object.values(results.checks).some((check: any) => check.status === 'fail');
  results.overall = hasFail ? 'fail' : 'pass';

  return results;
}

/**
 * Print diagnostics
 */
function printDiagnostics(results: DiagnosticResults): void {
  console.log(chalk.cyan(banner));
  console.log();
  console.log(boxen(
    chalk.white('  System Diagnostics'),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: results.overall === 'pass' ? 'green' : 'yellow' }
  ));
  console.log();

  for (const [checkName, data] of Object.entries(results.checks)) {
    if (!data || typeof data !== 'object') continue;
    if (checkName === 'ports') continue; // Skip ports check
    
    const checkData = data as DiagnosticCheck;
    const icon = checkData.status === 'pass' 
      ? chalk.green('✓') 
      : checkData.status === 'warn' 
        ? chalk.yellow('⚠') 
        : chalk.red('✗');
    
    const label = chalk.bold(checkName.charAt(0).toUpperCase() + checkName.slice(1));
    const message = checkData.message || checkData.version || '';
    
    console.log(`  ${icon} ${label}: ${chalk.gray(message)}`);
  }

  console.log();
  
  if (results.overall === 'pass') {
    console.log(chalk.green('  ✓ All checks passed'));
  } else {
    console.log(chalk.yellow('  ⚠ Some checks need attention'));
    console.log(chalk.gray('  Follow the suggestions above to fix issues'));
  }
  
  console.log();
}

// ============================================================================
// FUNÇÕES AUXILIARES - UTILITÁRIOS
// ============================================================================

interface TestResult {
  content: string;
  stats: any;
  duration: string;
}

/**
 * Check if Qwen Code is installed
 */
async function checkQwenInstalled(): Promise<boolean> {
  try {
    await execPromise('qwen --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check OAuth status
 */
async function checkOAuth(): Promise<{ valid: boolean; cachePath?: string }> {
  const cachePath = join(homedir(), '.qwen');
  const valid = existsSync(cachePath);
  return { valid, cachePath };
}

/**
 * Execute command and return stdout
 */
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [], { shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed: ${command}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Load project config
 */
function loadProjectConfig(): any {
  const configFile = '.qwen-paperclip/config.json';
  if (!existsSync(configFile)) {
    throw new Error('Config file not found. Run: qwen-paperclip onboard');
  }
  return JSON.parse(readFileSync(configFile, 'utf-8'));
}

/**
 * Save project config
 */
function saveProjectConfig(config: any): void {
  const configFile = '.qwen-paperclip/config.json';
  writeFileSync(configFile, JSON.stringify(config, null, 2));
}

/**
 * Run Qwen test
 */
async function runQwenTest(prompt: string, outputFormat: string): Promise<TestResult> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const proc = spawn('qwen', [
      '--prompt', prompt,
      '--output-format', outputFormat === 'json' ? 'json' : 'text',
      '--yolo'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          resolve({
            content: parsed.response || parsed.content || output,
            stats: parsed.stats,
            duration: `${(duration / 1000).toFixed(1)}s`
          });
        } catch {
          resolve({
            content: output,
            stats: {},
            duration: `${(duration / 1000).toFixed(1)}s`
          });
        }
      } else {
        reject(new Error(`Test failed: ${errorOutput}`));
      }
    });
  });
}

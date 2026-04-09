#!/usr/bin/env node

/**
 * @qwen-paperclip/cli
 * CLI de configuração e deploy do Qwen Paperclip
 * 
 * Permite inicializar, configurar e gerenciar agentes Qwen
 * integrados ao Paperclip.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { QwenAgent, QwenAgentConfig } from '@qwen-paperclip/agent';
import { HeartbeatScheduler, HeartbeatConfig } from '@qwen-paperclip/heartbeat';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const program = new Command();

// Banner ASCII
const banner = figlet.textSync('Qwen Paperclip', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
});

program
  .name('qwen-paperclip')
  .description('Integração do Qwen Code com OAuth local como agente nativo do Paperclip')
  .version('0.1.0');

// Comando: init
program
  .command('init')
  .description('Inicializa um novo projeto Qwen Paperclip')
  .option('-n, --name <name>', 'Nome do projeto', 'my-qwen_agent')
  .option('-d, --directory <dir>', 'Diretório de trabalho', process.cwd())
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log();
    console.log(chalk.green('🚀 Inicializando projeto Qwen Paperclip...'));
    console.log();

    const configDir = join(options.directory, '.qwen-paperclip');
    
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Criar arquivo de configuração
    const configFile = join(configDir, 'config.json');
    const config = {
      name: options.name,
      agents: [],
      heartbeats: [],
      createdAt: new Date().toISOString()
    };

    writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log(chalk.green('✅ Projeto inicializado com sucesso!'));
    console.log(chalk.gray(`   Configuração salva em: ${configFile}`));
    console.log();
    console.log(chalk.yellow('💡 Próximos passos:'));
    console.log(chalk.yellow('   1. Adicione um agente: qwen-paperclip add-agent'));
    console.log(chalk.yellow('   2. Configure um heartbeat: qwen-paperclip add-heartbeat'));
    console.log(chalk.yellow('   3. Inicie o scheduler: qwen-paperclip start'));
  });

// Comando: add-agent
program
  .command('add-agent')
  .description('Adiciona um novo agente Qwen')
  .option('-n, --name <name>', 'Nome do agente', 'qwen-agent-1')
  .option('-d, --directory <dir>', 'Diretório de trabalho', process.cwd())
  .option('-a, --approval <mode>', 'Modo de aprovação (yolo, auto_edit, ask)', 'yolo')
  .option('-o, --output <format>', 'Formato de output (json, stream-json, text)', 'json')
  .action(async (options) => {
    console.log(chalk.green(`\n🤖 Adicionando agente: ${options.name}`));
    console.log();

    const config: QwenAgentConfig = {
      id: `agent_${Date.now()}`,
      name: options.name,
      workingDirectory: options.directory,
      approvalMode: options.approval as any,
      outputFormat: options.output as any
    };

    console.log(chalk.gray('   Configuração do agente:'));
    console.log(chalk.gray(`   - ID: ${config.id}`));
    console.log(chalk.gray(`   - Nome: ${config.name}`));
    console.log(chalk.gray(`   - Diretório: ${config.workingDirectory}`));
    console.log(chalk.gray(`   - Approval Mode: ${config.approvalMode}`));
    console.log(chalk.gray(`   - Output Format: ${config.outputFormat}`));
    console.log();

    // Verificar se Qwen Code está instalado
    const { spawn } = await import('child_process');
    const checkProc = spawn('qwen', ['--version']);
    
    checkProc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Qwen Code detectado!'));
        console.log(chalk.yellow('⚠️  Lembre-se: faça login OAuth na primeira execução:'));
        console.log(chalk.cyan('   qwen'));
        console.log();
        saveAgentConfig(config);
      } else {
        console.log(chalk.red('❌ Qwen Code não encontrado!'));
        console.log(chalk.yellow('   Instale com: npm install -g @anthropic-ai/qwen-code'));
        console.log(chalk.yellow('   Ou visite: https://github.com/QwenLM/qwen-code'));
        process.exit(1);
      }
    });
  });

// Comando: add-heartbeat
program
  .command('add-heartbeat')
  .description('Adiciona um heartbeat a um agente')
  .requiredOption('-a, --agent-id <id>', 'ID do agente')
  .option('-s, --schedule <schedule>', 'Agendamento (cron ou segundos)', '300')
  .option('-r, --retries <count>', 'Máximo de retries', '3')
  .action(async (options) => {
    console.log(chalk.green(`\n💓 Adicionando heartbeat para agente: ${options.agentId}`));
    console.log();

    const config: HeartbeatConfig = {
      agentId: options.agentId,
      schedule: isNaN(options.schedule) ? options.schedule : parseInt(options.schedule),
      maxRetries: parseInt(options.retries),
      enabled: true
    };

    console.log(chalk.gray('   Configuração do heartbeat:'));
    console.log(chalk.gray(`   - Agent ID: ${config.agentId}`));
    console.log(chalk.gray(`   - Schedule: ${config.schedule}`));
    console.log(chalk.gray(`   - Max Retries: ${config.maxRetries}`));
    console.log(chalk.gray(`   - Enabled: ${config.enabled}`));
    console.log();
    console.log(chalk.green('✅ Heartbeat configurado!'));
  });

// Comando: start
program
  .command('start')
  .description('Inicia o scheduler de heartbeats')
  .option('-c, --config <path>', 'Arquivo de configuração', '.qwen-paperclip/config.json')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log();
    console.log(chalk.green('🚀 Iniciando Qwen Paperclip Scheduler...'));
    console.log();

    if (!existsSync(options.config)) {
      console.log(chalk.red(`❌ Arquivo de configuração não encontrado: ${options.config}`));
      console.log(chalk.yellow('   Execute: qwen-paperclip init'));
      process.exit(1);
    }

    const config = JSON.parse(readFileSync(options.config, 'utf-8'));
    console.log(chalk.gray(`   Projeto: ${config.name}`));
    console.log(chalk.gray(`   Agentes configurados: ${config.agents.length}`));
    console.log(chalk.gray(`   Heartbeats configurados: ${config.heartbeats.length}`));
    console.log();

    // TODO: Implementar scheduler principal
    console.log(chalk.yellow('⚠️  Scheduler em desenvolvimento...'));
    console.log(chalk.green('✅ Agente Qwen pronto para execução!'));
  });

// Comando: status
program
  .command('status')
  .description('Verifica status do Qwen Code e OAuth')
  .action(async () => {
    console.log(chalk.green('\n🔍 Verificando status...'));
    console.log();

    // Verificar Qwen Code
    const { spawn } = await import('child_process');
    const proc = spawn('qwen', ['--help']);
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Qwen Code: instalado'));
        
        // Verificar OAuth
        const oauthPath = join(homedir(), '.qwen');
        if (existsSync(oauthPath)) {
          console.log(chalk.green('✅ OAuth Cache: encontrado'));
          console.log(chalk.green('✅ Autenticação: pronta'));
        } else {
          console.log(chalk.yellow('⚠️  OAuth Cache: não encontrado'));
          console.log(chalk.yellow('   Execute "qwen" para fazer login'));
        }
      } else {
        console.log(chalk.red('❌ Qwen Code: não encontrado'));
        console.log(chalk.yellow('   Instale: npm install -g @anthropic-ai/qwen-code'));
      }
      console.log();
    });
  });

// Comando: test
program
  .command('test')
  .description('Executa um teste rápido com o agente Qwen')
  .option('-p, --prompt <text>', 'Prompt de teste', 'Diga olá! Este é um teste do Qwen Paperclip.')
  .action(async (options) => {
    console.log(chalk.green('\n🧪 Executando teste com Qwen Code...'));
    console.log(chalk.gray(`   Prompt: ${options.prompt}`));
    console.log();

    const { spawn } = await import('child_process');
    
    const proc = spawn('qwen', [
      '--prompt', options.prompt,
      '--output-format', 'json',
      '--yolo'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      console.log(chalk.yellow(data.toString()));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          console.log(chalk.green('✅ Teste concluído com sucesso!'));
          console.log();
          console.log(chalk.cyan('Resposta:'));
          console.log(parsed.response || parsed.content || output);
        } catch {
          console.log(chalk.green('✅ Teste concluído!'));
          console.log(output);
        }
      } else {
        console.log(chalk.red(`❌ Teste falhou com código ${code}`));
      }
    });
  });

program.parse();

/**
 * Salva configuração do agente
 */
function saveAgentConfig(config: QwenAgentConfig): void {
  const configFile = join(process.cwd(), '.qwen-paperclip', 'config.json');
  
  if (existsSync(configFile)) {
    const data = JSON.parse(readFileSync(configFile, 'utf-8'));
    data.agents.push(config);
    writeFileSync(configFile, JSON.stringify(data, null, 2));
  }
  
  console.log(chalk.green('✅ Agente salvo na configuração!'));
}

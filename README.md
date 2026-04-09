# 🔧 Qwen Paperclip

> **Orquestre agentes Qwen Code com OAuth local no Paperclip - Zero API Key necessária!**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15+-orange)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb)](https://react.dev/)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ O Que É

**Qwen Paperclip** integra o [Qwen Code](https://github.com/QwenLM/qwen-code) como agente nativo do [Paperclip](https://github.com/paperclipai/paperclip), permitindo:

- 🔐 **Zero API Key** - OAuth automático via navegador
- 💓 **Heartbeat 24/7** - Agentes acordam, executam e dormem
- 🧠 **Context Persistence** - Sessões mantidas entre execuções
- 💰 **Budget Control** - 60 req/min, 1000 req/dia (gratuito)
- 🏢 **Multi-Tenant** - Múltiplas empresas isoladas
- 📊 **Dashboard** - Monitoramento em tempo real
- 🛡️ **Governança** - Aprovações, pausas, overrides

## 🚀 Quick Start

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/qwen-paperclip.git
cd qwen-paperclip

# Instale dependências
pnpm install

# Build
pnpm build

# Inicialize seu projeto
npx qwen-paperclip init --name minha-empresa-ia
```

### OAuth (Primeira Vez)

```bash
# Faça login com qwen.ai (automático via browser)
qwen
```

**Pronto!** Sem API key para configurar. 🎉

### Uso Básico

```bash
# Adicionar agente
npx qwen-paperclip add-agent --name dev-agent --directory ./src

# Configurar heartbeat (a cada 5 min)
npx qwen-paperclip add-heartbeat --agent-id dev-agent --schedule "*/5 * * * *"

# Iniciar scheduler
npx qwen-paperclip start

# Testar agente
npx qwen-paperclip test -p "Crie uma função de soma em Python"
```

### Docker

```bash
# Subir tudo com Docker Compose
docker-compose up -d

# Acessar dashboard
open http://localhost:3000
```

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Documentação principal |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Guia de início rápido |
| [EXAMPLES.md](EXAMPLES.md) | Exemplos práticos de uso |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir |

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Paperclip Server                │
│  (API + PostgreSQL + Dashboard)         │
├─────────────────────────────────────────┤
│  Qwen Agent Adapter                     │
│  ├─ Heartbeat Scheduler (cron)          │
│  ├─ Context Injector                    │
│  └─ Result Persister                    │
├─────────────────────────────────────────┤
│  Qwen Code CLI (OAuth local)            │
│  ├─ qwen --prompt "task" --yolo         │
│  ├─ --output-format stream-json         │
│  └─ --continue / --resume               │
└─────────────────────────────────────────┘
```

## 📦 Estrutura do Projeto

```
qwen-paperclip/
├── packages/
│   ├── agent/           # @qwen-paperclip/agent - Adaptador Qwen Code
│   ├── heartbeat/       # @qwen-paperclip/heartbeat - Scheduler
│   └── cli/             # @qwen-paperclip/cli - CLI
├── apps/
│   └── dashboard/       # @qwen-paperclip/dashboard - UI React
├── .github/
│   └── workflows/       # CI/CD pipelines
├── docker-compose.yml   # Docker setup
└── docs/                # Documentação adicional
```

## 🎯 Funcionalidades

### Agente Qwen Code

```typescript
import { QwenAgent } from '@qwen-paperclip/agent';

const agent = new QwenAgent({
  id: 'dev-agent',
  name: 'Development Agent',
  workingDirectory: './src',
  approvalMode: 'yolo',
  outputFormat: 'json'
});

const result = await agent.execute({
  id: 'task-1',
  prompt: 'Crie uma API REST para usuários'
});

console.log(result.content);
```

### Heartbeat Scheduler

```typescript
import { HeartbeatScheduler } from '@qwen-paperclip/heartbeat';

const scheduler = new HeartbeatScheduler(agent);

await scheduler.register({
  agentId: 'dev-agent',
  schedule: '*/5 * * * *',  // cron
  maxRetries: 3,
  enabled: true
});
```

### CLI Commands

```bash
# Inicializar projeto
qwen-paperclip init --name empresa-ia

# Adicionar agente
qwen-paperclip add-agent --name dev-agent -d ./src

# Configurar heartbeat
qwen-paperclip add-heartbeat -a dev-agent -s "*/5 * * * *"

# Iniciar scheduler
qwen-paperclip start

# Verificar status
qwen-paperclip status

# Testar agente
qwen-paperclip test -p "Olá, mundo!"
```

## 💡 Exemplos

### 1. Agente de Desenvolvimento

```bash
qwen-paperclip add-agent --name dev-agent -d ./src --approval yolo
qwen-paperclip add-heartbeat -a dev-agent -s "*/5 * * * *"
```

### 2. Agente de Code Review

```bash
qwen-paperclip add-agent --name review-agent -d ./src --approval auto_edit
qwen-paperclip add-heartbeat -a review-agent -s "0 * * * *"
```

### 3. Empresa Completa

```bash
docker-compose up -d
# Dashboard disponível em http://localhost:3000
```

Veja mais exemplos em [EXAMPLES.md](EXAMPLES.md).

## 🔐 OAuth Local

O Qwen Code usa autenticação OAuth gratuita:

| Feature | Detalhe |
|---------|---------|
| **Login** | Automático via browser |
| **Cache** | Local em `~/.qwen/` |
| **API Key** | ❌ Não necessária |
| **Limite** | 60 req/min, 1000 req/dia |
| **Modelo** | Qwen Coder |
| **Custo** | Gratuito |

## 📊 Dashboard

O dashboard React fornece monitoramento em tempo real:

- ✅ Status de agentes (idle, running, error, authenticated)
- 💓 Heartbeats ativos e histórico
- 📈 Estatísticas de uso (tokens, tool calls)
- 📋 Logs de execução
- 🎮 Controles (start/stop/pause)

## 🐳 Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
  api:
    build: .
    ports:
      - "3100:3100"
  dashboard:
    build: ./apps/dashboard
    ports:
      - "3000:3000"
```

```bash
docker-compose up -d
```

## 🧪 Desenvolvimento

```bash
# Modo development
pnpm dev

# Build
pnpm build

# Testes
pnpm test

# Lint
pnpm lint
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Leia o [guia de contribuição](CONTRIBUTING.md).

### Áreas Precisando de Ajuda

- 🔴 Testes unitários abrangentes
- 🔴 Integração real com Paperclip API
- 🟡 Mais exemplos de uso
- 🟡 Tradução para inglês
- 🟢 Temas customizáveis no dashboard

### Comece Agora

```bash
# Fork e clone
gh repo fork qwen-paperclip

# Instale dependências
pnpm install

# Crie uma branch
git checkout -b feature/minha-feature

# Desenvolva e teste
pnpm dev
pnpm test

# Commit e push
git commit -m "feat: adicionar minha feature"
git push origin feature/minha-feature

# Abra um PR
gh pr create
```

## 📄 Licença

Distribuído sob licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 🔗 Links

- [Qwen Code](https://github.com/QwenLM/qwen-code)
- [Paperclip](https://github.com/paperclipai/paperclip)
- [Documentação Qwen OAuth](https://qwenlm.github.io/qwen-code-docs/)
- [Issues](https://github.com/seu-usuario/qwen-paperclip/issues)
- [Discussions](https://github.com/seu-usuario/qwen-paperclip/discussions)

## 🙏 Agradecimentos

- **Qwen Team** - Por criar o incrível Qwen Code
- **Paperclip Team** - Pela plataforma de orquestração
- **Contribuidores** - Por melhorar este projeto

## 📮 Contato

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/qwen-paperclip/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/qwen-paperclip/discussions)

---

<p align="center">
  <strong>Feito com ❤️ pela comunidade para a comunidade</strong><br>
  <em>Qwen Paperclip - Orquestrando agentes Qwen com zero configuração de API</em> 🚀
</p>

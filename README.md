# 🔧 Qwen Paperclip

Integração do **Qwen Code** com OAuth local como agente nativo do **Paperclip**, permitindo orquestração de agentes Qwen em empresas operadas por IA com heartbeats, controle de orçamento e dashboard de monitoramento.

## ✨ Funcionalidades

- 🔐 **Zero API Key** - OAuth automático via navegador
- 💓 **Heartbeat 24/7** - Agentes acordam, executam e dormem automaticamente
- 🧠 **Context Persistence** - Sessões mantidas entre execuções
- 💰 **Budget Control** - Limite de requisições por agente (60/min, 1000/dia OAuth gratuito)
- 🏢 **Multi-Tenant** - Múltiplas empresas isoladas
- 📊 **Dashboard** - Monitoramento em tempo real
- 🛡️ **Governança** - Aprovações, pausas, overrides

## 🚀 Instalação

### Pré-requisitos

- Node.js 20+
- pnpm 9.15+
- Qwen Code CLI (instalado globalmente)

### Setup

```bash
# Instalar dependências
pnpm install

# Build do projeto
pnpm build

# Iniciar CLI
npx qwen-paperclip init

# Verificar status
npx qwen-paperclip status
```

## 📖 Uso

### 1. Inicializar Projeto

```bash
npx qwen-paperclip init --name minha-empresa
```

### 2. Adicionar Agente Qwen

```bash
npx qwen-paperclip add-agent --name agente-dev --directory ./meu-projeto
```

### 3. Configurar Heartbeat

```bash
npx qwen-paperclip add-heartbeat --agent-id agent_123 --schedule "*/5 * * * *"
```

### 4. Iniciar Scheduler

```bash
npx qwen-paperclip start
```

### 5. Testar Agente

```bash
npx qwen-paperclip test --prompt "Crie uma função de soma em Python"
```

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
│   ├── agent/           # Adaptador Qwen Code para Paperclip
│   ├── heartbeat/       # Sistema de agendamento e execução
│   └── cli/             # CLI de configuração e deploy
├── apps/
│   └── dashboard/       # UI de monitoramento (React)
└── docker/              # Configuração Docker
```

## 🔐 OAuth Local

O Qwen Code utiliza autenticação OAuth gratuita via conta `qwen.ai`:

1. Na primeira execução, o navegador abre automaticamente
2. Após login, credenciais são cacheadas localmente
3. **Sem API key necessária**
4. Limites: 60 req/min, 1000 req/dia (plano gratuito)

## 💓 Heartbeat System

O sistema de heartbeat permite execução agendada de agentes:

### Exemplo de Configuração

```json
{
  "agentId": "agent_123",
  "schedule": "*/5 * * * *",
  "maxRetries": 3,
  "enabled": true
}
```

### Ciclo de Execução

1. **Scheduler dispara** (intervalo cron)
2. **Inicialização da sessão** (contexto injetado)
3. **Injeção de contexto** (memória, tarefas, eventos)
4. **Raciocínio e Ação** (Qwen executa tarefa)
5. **Persistência de estado** (resultados salvos)
6. **Encerramento** (agente dorme)

## 🎯 Modos de Aprovação

- **`yolo`**: Execução automática sem aprovação
- **`auto_edit`**: Aprovação automática para edições
- **`ask`**: Requer aprovação manual (interativo)

## 🐳 Docker

```bash
# Subir com PostgreSQL embarcado
docker-compose up -d

# Acessar dashboard
open http://localhost:3000
```

## 🧪 Desenvolvimento

```bash
# Modo development
pnpm dev

# Rodar testes
pnpm test

# Lint
pnpm lint
```

## 📊 Dashboard

O dashboard React fornece:

- Status em tempo real dos agentes
- Histórico de heartbeats
- Uso de tokens e tool calls
- Logs de execução
- Controles de iniciar/parar agentes

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Add: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT

## 🔗 Links

- [Qwen Code](https://github.com/QwenLM/qwen-code)
- [Paperclip](https://github.com/paperclipai/paperclip)
- [Documentação Qwen OAuth](https://qwenlm.github.io/qwen-code-docs/)

## 🆘 Suporte

Para dúvidas e issues:

- Abra uma issue no GitHub
- Consulte a documentação oficial do Qwen Code
- Verifique os logs de execução em `~/.qwen/projects/`

---

**Qwen Paperclip** - Orquestrando agentes Qwen com zero configuração de API 🚀

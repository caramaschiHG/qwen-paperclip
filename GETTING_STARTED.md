# 🚀 Guia de Início Rápido

Este guia vai te ajudar a configurar e usar o Qwen Paperclip em menos de 5 minutos.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- **Node.js 20+** instalado
- **pnpm 9.15+** instalado
- **Qwen Code CLI** instalado globalmente
- Uma conta em [qwen.ai](https://qwen.ai) (gratuita)

### Verificando Instalação

```bash
# Verificar Node.js
node --version  # Deve mostrar v20.0.0 ou superior

# Verificar pnpm
pnpm --version  # Deve mostrar 9.15.0 ou superior

# Verificar Qwen Code
qwen --version  # Deve mostrar a versão instalada
```

## ⚡ Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/qwen-paperclip.git
cd qwen-paperclip
```

### 2. Instale Dependências

```bash
pnpm install
```

### 3. Build do Projeto

```bash
pnpm build
```

## 🔐 Configurando OAuth (Primeira Vez)

O Qwen Code usa autenticação OAuth gratuita. Na primeira execução:

```bash
# Executar Qwen Code para login
qwen
```

- O navegador abrirá automaticamente
- Faça login com sua conta `qwen.ai`
- Credenciais são salvas localmente
- **Sem API key necessária!**

### Limites do Plano Gratuito

- ✅ 60 requisições/minuto
- ✅ 1.000 requisições/dia
- ✅ Acesso ao modelo Qwen Coder
- ✅ Sem cartão de crédito

## 🎯 Usando a CLI

### Inicializar Projeto

```bash
# Criar configuração inicial
npx qwen-paperclip init --name minha-empresa-i

# Ou usar diretamente
./packages/cli/dist/index.js init --name meu-projeto
```

### Adicionar Agente

```bash
# Adicionar um agente Qwen
npx qwen-paperclip add-agent \
  --name agente-dev \
  --directory ./meu-projeto \
  --approval yolo

# Opções de aprovação:
#   yolo      - Execução automática (recomendado para automação)
#   auto_edit - Aprova edições automaticamente
#   ask       - Requer aprovação manual
```

### Configurar Heartbeat

```bash
# Heartbeat a cada 5 minutos (cron)
npx qwen-paperclip add-heartbeat \
  --agent-id agent_123 \
  --schedule "*/5 * * * *" \
  --retries 3

# Ou por intervalo em segundos
npx qwen-paperclip add-heartbeat \
  --agent-id agent_123 \
  --schedule 300
```

### Iniciar Scheduler

```bash
# Iniciar todos os heartbeats
npx qwen-paperclip start

# Verificar status
npx qwen-paperclip status
```

### Testar Agente

```bash
# Executar teste rápido
npx qwen-paperclip test --prompt "Crie uma função de soma em Python"

# Teste com prompt customizado
npx qwen-paperclip test -p "Analise este código em busca de bugs"
```

## 🐳 Usando com Docker

### Subir Tudo com Docker Compose

```bash
# Iniciar PostgreSQL + API + Dashboard
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Acessar Dashboard

Abra o navegador em: **http://localhost:3000**

## 💡 Exemplos Práticos

### Exemplo 1: Agente de Desenvolvimento

```bash
# Criar agente para desenvolvimento
npx qwen-paperclip add-agent \
  --name dev-agent \
  --directory ./src \
  --approval yolo

# Heartbeat a cada 10 minutos
npx qwen-paperclip add-heartbeat \
  --agent-id dev-agent \
  --schedule "*/10 * * * *"

# Iniciar
npx qwen-paperclip start
```

### Exemplo 2: Agente de Code Review

```bash
# Criar agente de review
npx qwen-paperclip add-agent \
  --name review-agent \
  --directory ./src \
  --approval auto_edit

# Heartbeat a cada hora
npx qwen-paperclip add-heartbeat \
  --agent-id review-agent \
  --schedule "0 * * * *"
```

### Exemplo 3: Agente de Documentação

```bash
# Criar agente de docs
npx qwen-paperclip add-agent \
  --name docs-agent \
  --directory ./docs \
  --approval yolo

# Heartbeat 2x ao dia
npx qwen-paperclip add-heartbeat \
  --agent-id docs-agent \
  --schedule "0 9,17 * * *"
```

## 📊 Monitorando com Dashboard

O dashboard React fornece:

1. **Status de Agentes**
   - Estado atual (idle, running, error, authenticated, needs-auth)
   - Status do OAuth
   - Última atividade

2. **Heartbeats**
   - Lista de heartbeats configurados
   - Status (ativo/pausado)
   - Último beat executado

3. **Beats Recentes**
   - Histórico de execuções
   - Duração de cada beat
   - Status (sucesso/erro)
   - Número de tentativas

4. **Estatísticas**
   - Total de agentes
   - Heartbeats ativos
   - Beats com sucesso/falha

## 🔧 Configuração Avançada

### Arquivo de Configuração

`.qwen-paperclip/config.json`:

```json
{
  "name": "minha-empresa-ia",
  "agents": [
    {
      "id": "agent_dev_001",
      "name": "Agente de Desenvolvimento",
      "workingDirectory": "./src",
      "approvalMode": "yolo",
      "outputFormat": "json"
    }
  ],
  "heartbeats": [
    {
      "id": "hb_001",
      "agentId": "agent_dev_001",
      "schedule": "*/5 * * * *",
      "maxRetries": 3,
      "enabled": true
    }
  ],
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env

# Editar variáveis
nano .env
```

### Expressões Cron

Exemplos de agendamento:

| Expressão | Descrição |
|-----------|-----------|
| `*/5 * * * *` | A cada 5 minutos |
| `*/15 * * * *` | A cada 15 minutos |
| `0 * * * *` | A cada hora |
| `0 */2 * * *` | A cada 2 horas |
| `0 9 * * *` | Todo dia às 9h |
| `0 9-17 * * *` | Das 9h às 17h, a cada hora |
| `0 9 * * 1-5` | Dias úteis às 9h |
| `0 */4 * * *` | A cada 4 horas |

## 🐛 Solução de Problemas

### Qwen Code Não Encontrado

```bash
# Instalar Qwen Code globalmente
npm install -g @anthropic-ai/qwen-code

# Ou visite: https://github.com/QwenLM/qwen-code
```

### OAuth Inválido

```bash
# Forçar re-autenticação
qwen

# Verificar cache de credenciais
ls -la ~/.qwen/
```

### Build Falhando

```bash
# Limpar builds anteriores
pnpm clean

# Reinstalar dependências
rm -rf node_modules
pnpm install

# Build novamente
pnpm build
```

### Agente Não Executa

```bash
# Verificar logs
npx qwen-paperclip status

# Testar agente manualmente
npx qwen-paperclip test -p "Olá, funcione!"

# Verificar diretório de trabalho
ls -la ./seu-diretorio
```

## 📚 Próximos Passos

1. 📖 Leia a [documentação completa](README.md)
2. 🔧 Explore os [exemplos avançados](examples/)
3. 🤝 Contribua com o projeto
4. 💬 Abra issues para dúvidas ou bugs

## 🆘 Precisa de Ajuda?

- **Issues**: Abra uma issue no GitHub
- **Documentação**: [qwenlm.github.io/qwen-code-docs](https://qwenlm.github.io/qwen-code-docs/)
- **Comunidade**: Participe das discussões no GitHub

---

**Qwen Paperclip** - Orquestrando agentes Qwen com zero configuração de API 🚀

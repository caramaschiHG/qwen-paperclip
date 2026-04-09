# 💡 Exemplos de Uso do Qwen Paperclip

Coleção de exemplos práticos para diferentes cenários de uso.

## 📁 Estrutura de Exemplos

```
examples/
├── 01-simple-agent/          # Agente básico
├── 02-multi-agent/           # Múltiplos agentes
├── 03-code-review/           # Agente de code review
├── 04-doc-generator/         # Gerador de documentação
├── 05-bug-finder/            # Detector de bugs
├── 06-refactor-agent/        # Agente de refatoração
├── 07-test-writer/           # Gerador de testes
└── 08-full-company/          # Empresa completa com Docker
```

---

## 01. Agente Simples

**Cenário**: Um único agente Qwen executando tarefas básicas.

### Configuração

```bash
# Inicializar
npx qwen-paperclip init --name agente-simples

# Adicionar agente
npx qwen-paperclip add-agent \
  --name meu-primeiro-agente \
  --directory . \
  --approval yolo

# Heartbeat a cada minuto
npx qwen-paperclip add-heartbeat \
  --agent-id agent_1 \
  --schedule 60

# Testar
npx qwen-paperclip test -p "Crie uma função hello world em Python"
```

### Use Case

- Prototipagem rápida
- Testes conceituais
- Aprendizado da ferramenta

---

## 02. Múltiplos Agentes

**Cenário**: 3 agentes trabalhando em paralelo (dev, review, docs).

### Configuração

```bash
# Inicializar
npx qwen-paperclip init --name multi-agent

# Agente de desenvolvimento
npx qwen-paperclip add-agent \
  --name dev-agent \
  --directory ./src \
  --approval yolo

# Agente de review
npx qwen-paperclip add-agent \
  --name review-agent \
  --directory ./src \
  --approval auto_edit

# Agente de documentação
npx qwen-paperclip add-agent \
  --name docs-agent \
  --directory ./docs \
  --approval yolo

# Heartbeats
npx qwen-paperclip add-heartbeat --agent-id dev-agent --schedule "*/5 * * * *"
npx qwen-paperclip add-heartbeat --agent-id review-agent --schedule "*/10 * * * *"
npx qwen-paperclip add-heartbeat --agent-id docs-agent --schedule "0 */2 * * *"

# Iniciar todos
npx qwen-paperclip start
```

### Fluxo de Trabalho

1. **Dev Agent** cria código a cada 5 min
2. **Review Agent** analisa código a cada 10 min
3. **Docs Agent** gera documentação a cada 2 horas

---

## 03. Agente de Code Review

**Cenário**: Agente que revisa PRs automaticamente.

### Configuração

```bash
# Criar agente de review
npx qwen-paperclip add-agent \
  --name code-reviewer \
  --directory ./src \
  --approval auto_edit

# Configurar para rodar a cada hora durante expediente
npx qwen-paperclip add-heartbeat \
  --agent-id code-reviewer \
  --schedule "0 9-18 * * 1-5" \
  --retries 2
```

### Tarefa Personalizada

Edite `.qwen-paperclip/config.json`:

```json
{
  "agents": [
    {
      "id": "code-reviewer",
      "name": "Code Review Agent",
      "workingDirectory": "./src",
      "approvalMode": "auto_edit",
      "outputFormat": "json",
      "customTask": "Revise todo código novo no último commit e sugira melhorias"
    }
  ]
}
```

---

## 04. Gerador de Documentação

**Cenário**: Agente que gera docs automaticamente.

### Configuração

```bash
# Criar agente
npx qwen-paperclip add-agent \
  --name doc-generator \
  --directory ./src \
  --approval yolo

# Heartbeat 2x ao dia
npx qwen-paperclip add-heartbeat \
  --agent-id doc-generator \
  --schedule "0 12,18 * * *"
```

### Prompt Customizado

```bash
# Testar geração de docs
npx qwen-paperclip test \
  -p "Gere documentação completa para todas as funções em src/"
```

---

## 05. Detector de Bugs

**Cenário**: Agente que procura bugs no código.

### Configuração

```bash
# Criar agente
npx qwen-paperclip add-agent \
  --name bug-hunter \
  --directory ./src \
  --approval yolo

# Rodar a cada 4 horas
npx qwen-paperclip add-heartbeat \
  --agent-id bug-hunter \
  --schedule "0 */4 * * *"
```

### Script de Verificação

```bash
#!/bin/bash
# scripts/run-bug-check.sh

echo "🔍 Executando verificação de bugs..."

npx qwen-paperclip test \
  -p "Analise todo código em src/ em busca de bugs potenciais, memory leaks, e problemas de segurança" \
  --output-format json > results/bug-report-$(date +%Y%m%d-%H%M%S).json

echo "✅ Verificação concluída!"
```

### Cron Job

```bash
# Adicionar ao crontab
0 */4 * * * cd /path/to/project && bash scripts/run-bug-check.sh
```

---

## 06. Agente de Refatoração

**Cenário**: Agente que refatora código automaticamente.

### Configuração

```bash
# Criar agente (com aprovação manual para segurança)
npx qwen-paperclip add-agent \
  --name refactoring-agent \
  --directory ./src \
  --approval ask

# Rodar diariamente às 2am
npx qwen-paperclip add-heartbeat \
  --agent-id refactoring-agent \
  --schedule "0 2 * * *"
```

### Tarefas de Refatoração

O agente pode:
- Simplificar funções complexas
- Aplicar design patterns
- Melhorar legibilidade
- Otimizar performance
- Remover código duplicado

---

## 07. Gerador de Testes

**Cenário**: Agente que cria testes unitários.

### Configuração

```bash
# Criar agente
npx qwen-paperclip add-agent \
  --name test-writer \
  --directory ./src \
  --approval yolo

# Rodar a cada 3 horas
npx qwen-paperclip add-heartbeat \
  --agent-id test-writer \
  --schedule "0 */3 * * *"
```

### Execução Manual

```bash
# Gerar testes para arquivo específico
npx qwen-paperclip test \
  -p "Crie testes unitários completos para src/utils/calculator.ts"
```

---

## 08. Empresa Completa (Docker)

**Cenário**: Configuração completa com Docker Compose.

### docker-compose.company.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: company_db
      POSTGRES_USER: company
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  dev-agent:
    build:
      context: .
      dockerfile: Dockerfile.agent
    environment:
      AGENT_NAME: dev-agent
      WORKING_DIR: /workspace/src
      APPROVAL_MODE: yolo
      HEARTBEAT_SCHEDULE: "*/5 * * * *"
    volumes:
      - ./src:/workspace/src
      - qwen_cache:/root/.qwen

  review-agent:
    build:
      context: .
      dockerfile: Dockerfile.agent
    environment:
      AGENT_NAME: review-agent
      WORKING_DIR: /workspace/src
      APPROVAL_MODE: auto_edit
      HEARTBEAT_SCHEDULE: "*/10 * * * *"
    volumes:
      - ./src:/workspace/src
      - qwen_cache:/root/.qwen

  docs-agent:
    build:
      context: .
      dockerfile: Dockerfile.agent
    environment:
      AGENT_NAME: docs-agent
      WORKING_DIR: /workspace/docs
      APPROVAL_MODE: yolo
      HEARTBEAT_SCHEDULE: "0 */2 * * *"
    volumes:
      - ./docs:/workspace/docs
      - qwen_cache:/root/.qwen

  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.dashboard
    ports:
      - "3000:3000"
    environment:
      API_URL: http://api:3100
    depends_on:
      - dev-agent
      - review-agent
      - docs-agent

volumes:
  postgres_data:
  qwen_cache:
```

### Iniciar Tudo

```bash
# Subir todos os serviços
docker-compose -f docker-compose.company.yml up -d

# Ver logs
docker-compose -f docker-compose.company.yml logs -f

# Parar
docker-compose -f docker-compose.company.yml down
```

### Acessar Dashboard

```bash
open http://localhost:3000
```

---

## 🎯 Dicas e Boas Práticas

### 1. Escolha o Modo de Aprovação Certo

| Modo | Quando Usar |
|------|-------------|
| `yolo` | Tarefas de baixo risco, prototipagem |
| `auto_edit` | Code review, refatoração segura |
| `ask` | Mudanças críticas em produção |

### 2. Ajuste Heartbeats Inteligentemente

- **Dev Agent**: Frequente (5-15 min)
- **Review Agent**: Moderado (30-60 min)
- **Docs Agent**: Raro (2-4 horas)
- **Bug Hunter**: Diário ou 2x ao dia

### 3. Monitore Uso de Tokens

```bash
# Verificar uso no dashboard
open http://localhost:3000

# Ou via CLI
npx qwen-paperclip status
```

### 4. Mantenha Contexto entre Sessões

```bash
# Usar --continue para manter histórico
qwen --continue -p "Continue a refatoração iniciada ontem"

# Ou retomar sessão específica
qwen --resume <session-id> -p "Termine a tarefa"
```

### 5. Use Include Directories

```bash
# Adicionar múltiplos diretórios ao contexto
npx qwen-paperclip add-agent \
  --name full-stack-agent \
  --directory . \
  --include-directories src,tests,docs
```

---

## 🚀 Próximos Passos

1. Adapte os exemplos ao seu caso de uso
2. Crie seus próprios agentes customizados
3. Contribua com novos exemplos para a comunidade

---

**Qwen Paperclip** - Orquestrando agentes Qwen com zero configuração de API 🚀

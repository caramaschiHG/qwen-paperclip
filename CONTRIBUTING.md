# 🤝 Guia de Contribuição

Obrigado por seu interesse em contribuir com o **Qwen Paperclip**! Este guia vai te ajudar a começar.

## 📋 Código de Conduta

- Seja respeitoso com todos os contribuidores
- Valorize diversidade de opiniões e experiências
- Aceite críticas construtivas de boa vontade
- Foque no que é melhor para a comunidade

## 🚀 Começando

### 1. Fork o Repositório

```bash
# Clique em "Fork" no GitHub
# Ou use GitHub CLI
gh repo fork qwen-paperclip
```

### 2. Clone seu Fork

```bash
git clone https://github.com/seu-usuario/qwen-paperclip.git
cd qwen-paperclip
```

### 3. Configure Upstream

```bash
git remote add upstream https://github.com/original/qwen-paperclip.git
git fetch upstream
```

### 4. Instale Dependências

```bash
pnpm install
pnpm build
```

## 🛠️ Fluxo de Trabalho de Desenvolvimento

### Criar Branch

```bash
# Crie uma branch descritiva
git checkout -b feature/adicionar-dashboard-WebSocket
git checkout -b fix/corrigir-timeout-heartbeat
git checkout -b docs/atualizar-readme
```

### Desenvolver

```bash
# Modo development (watch mode)
pnpm dev

# Build para verificar
pnpm build

# Rodar testes
pnpm test

# Lint
pnpm lint
```

### Commit

```bash
# Commits atômicos e descritivos
git add .
git commit -m "feat: adicionar WebSocket ao dashboard"
git commit -m "fix: corrigir timeout no heartbeat scheduler"
git commit -m "docs: atualizar seção de exemplos no README"
```

### Push e Pull Request

```bash
# Push para seu fork
git push origin feature/sua-feature

# Crie PR via GitHub ou CLI
gh pr create \
  --base main \
  --head feature/sua-feature \
  --title "feat: adicionar WebSocket ao dashboard" \
  --body "Descrição detalhada das mudanças..."
```

## 📝 Convenções de Código

### TypeScript

- Use tipos explícitos em interfaces públicas
- Prefira `interface` sobre `type` quando possível
- Use `async/await` sobre promises chain
- Sempre trate erros com `try/catch`

### Nomenclatura

```typescript
// Classes: PascalCase
class QwenAgent { }

// Interfaces: PascalCase, prefixo com 'I' opcional
interface QwenAgentConfig { }

// Funções: camelCase
function executeTask() { }

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Variáveis: camelCase
const agentStatus = 'idle';
```

### Estrutura de Arquivos

```
packages/
├── agent/
│   ├── src/
│   │   ├── index.ts          # Export público
│   │   ├── QwenAgent.ts      # Implementação principal
│   │   ├── session.ts        # Gerenciamento de sessão
│   │   └── types.ts          # Tipagens
│   └── tests/
│       ├── QwenAgent.test.ts
│       └── session.test.ts
```

### Estilo

- Use 2 espaços para indentação
- Máximo de 100 caracteres por linha
- Aspas simples para strings
- Ponto e vírgula obrigatório
- trailing commas em objetos multi-line

## 🧪 Testes

### Escrevendo Testes

```typescript
// packages/agent/tests/QwenAgent.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { QwenAgent } from '../src/QwenAgent';

describe('QwenAgent', () => {
  let agent: QwenAgent;

  beforeEach(() => {
    agent = new QwenAgent({
      id: 'test-agent',
      name: 'Test Agent',
      workingDirectory: '/tmp/test',
      approvalMode: 'yolo',
      outputFormat: 'json'
    });
  });

  it('should create agent with valid config', () => {
    const config = agent.getConfig();
    expect(config.id).toBe('test-agent');
    expect(config.approvalMode).toBe('yolo');
  });

  it('should execute task and return result', async () => {
    const result = await agent.execute({
      id: 'task-1',
      prompt: 'Diga olá'
    });

    expect(result.sessionId).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });
});
```

### Rodando Testes

```bash
# Todos os testes
pnpm test

# Testes de um pacote específico
pnpm --filter @qwen-paperclip/agent test

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

## 📖 Documentação

### Adicionando Documentação

- Atualize README.md para mudanças de alto nível
- Adicione JSDoc a funções públicas
- Crie guias para features novas
- Inclua exemplos de uso

### JSDoc

```typescript
/**
 * Executa uma tarefa usando o Qwen Code CLI em modo headless
 * 
 * @param task - Tarefa a ser executada
 * @returns Resultado da execução com conteúdo e estatísticas
 * @throws Error se Qwen Code não estiver instalado
 * 
 * @example
 * ```typescript
 * const result = await agent.execute({
 *   id: 'task-1',
 *   prompt: 'Crie uma função de soma'
 * });
 * console.log(result.content);
 * ```
 */
async execute(task: Task): Promise<TaskResult> {
  // implementação
}
```

## 🔍 Pull Requests

### Checklist de PR

Antes de submeter:

- [ ] Código segue convenções do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Build passando (`pnpm build`)
- [ ] Lints passando (`pnpm lint`)
- [ ] Mensagem de commit clara e descritiva

### Review Process

1. Um mantenedor irá revisar seu PR
2. Feedback será dado em até 48 horas
3. Após aprovação, PR será mergido
4. Seu código estará na próxima release!

## 📦 Releases

### Versionamento Semântico

Seguimos [SemVer](https://semver.org/lang/pt-BR/):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Features novas compatíveis
- **PATCH**: Bug fixes compatíveis

### Exemplo

```
0.1.0 → 0.2.0  (feature nova)
0.2.0 → 0.2.1  (bug fix)
0.2.1 → 1.0.0  (primeira release estável)
```

## 🐛 Reportando Bugs

### Template de Issue

```markdown
**Descreva o bug**
Uma descrição clara do que é o bug.

**Para reproduzir**
Passos para reproduzir:
1. Executar '...'
2. Clicar em '....'
3. Ver erro

**Comportamento esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: Ubuntu 22.04
- Node: 20.11.0
- pnpm: 9.15.0
- Qwen Code: 0.x.x
```

## 💡 Sugestões de Features

### Template de Feature Request

```markdown
**Sua feature está relacionada a um problema?**
Uma descrição clara do problema.

**Descreva a solução desejada**
Uma descrição clara do que você quer que aconteça.

**Descreva alternativas consideradas**
Alternativas que você considerou.

**Contexto adicional**
Qualquer outro contexto ou screenshots.
```

## 🎯 Áreas Precisando de Ajuda

### Prioridade Alta 🔴

- [ ] Testes unitários abrangentes
- [ ] Integração real com Paperclip API
- [ ] Dockerfiles funcionais
- [ ] WebSocket para tempo real no dashboard

### Prioridade Média 🟡

- [ ] Mais exemplos de uso
- [ ] Tradução para inglês
- [ ] Integração com CI/CD (GitHub Actions)
- [ ] Benchmarks de performance

### Prioridade Baixa 🟢

- [ ] Temas customizáveis no dashboard
- [ ] Plugins e extensões
- [ ] Suporte a outros agentes de IA
- [ ] CLI mais interativa

## 📞 Contato

- **Issues**: GitHub Issues
- **Discussões**: GitHub Discussions
- **Email**: maintainer@example.com

## 🙏 Agradecimentos

Contribuidores que fazem este projeto melhor:

- [@seu-usuario](https://github.com/seu-usuario) - Criador
- [Seu nome aqui] - Contribua!

---

**Obrigado por contribuir com Qwen Paperclip!** 🚀

Juntos estamos construindo o futuro da orquestração de agentes IA.

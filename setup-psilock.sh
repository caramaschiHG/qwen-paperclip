#!/bin/bash

# ╔═══════════════════════════════════════════════════════════╗
# ║   PsiLock Company Setup - Qwen Paperclip                  ║
# ║   Cria empresa completa com time de IA                    ║
# ╚═══════════════════════════════════════════════════════════╝

API="http://localhost:3100/api"
PSILOCK_DIR="/home/caramaschi/Área de trabalho/Projetos/PsiLock"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🏢  PsiLock Company Setup                               ║"
echo "║   Criando empresa com time completo de IA                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Create Company ──
echo "📋 Step 1/4: Criando empresa PsiLock..."
COMPANY=$(curl -s -X POST "$API/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PsiLock",
    "mission": "Construir a melhor plataforma de seguranca e gerenciamento digital",
    "status": "active"
  }')

COMPANY_ID=$(echo "$COMPANY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
  echo "❌ Erro ao criar empresa"
  echo "$COMPANY"
  exit 1
fi

echo "✅ Empresa criada: $COMPANY_ID"
echo ""

# ── Step 2: Create Agents ──
echo "🤖 Step 2/4: Criando agentes do time..."

# CEO
CEO=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"CEO\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"ceo\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
CEO_ID=$(echo "$CEO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ CEO: $CEO_ID"

# CTO
CTO=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"CTO\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"cto\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
CTO_ID=$(echo "$CTO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ CTO: $CTO_ID"

# Senior Developer
DEV1=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Senior Dev\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"senior-developer\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
DEV1_ID=$(echo "$DEV1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ Senior Dev: $DEV1_ID"

# Frontend Developer
DEV2=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Frontend Dev\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"frontend-developer\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
DEV2_ID=$(echo "$DEV2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ Frontend Dev: $DEV2_ID"

# QA Engineer
QA=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"QA Engineer\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"qa-engineer\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
QA_ID=$(echo "$QA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ QA Engineer: $QA_ID"

# DevOps Engineer
DEVOPS=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"DevOps\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"devops\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
DEVOPS_ID=$(echo "$DEVOPS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ DevOps: $DEVOPS_ID"

# Marketing Manager
MKT=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Marketing Lead\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"marketing\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
MKT_ID=$(echo "$MKT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ Marketing Lead: $MKT_ID"

# Product Manager
PM=$(curl -s -X POST "$API/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Product Manager\",
    \"companyId\": \"$COMPANY_ID\",
    \"role\": \"product-manager\",
    \"status\": \"idle\",
    \"approvalMode\": \"yolo\",
    \"outputFormat\": \"json\"
  }")
PM_ID=$(echo "$PM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✅ Product Manager: $PM_ID"

echo ""

# ── Step 3: Create Heartbeats ──
echo "💓 Step 3/4: Configurando heartbeats..."

# CEO - a cada 5 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$CEO_ID\",\"schedule\":300,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ CEO heartbeat: 5 min"

# CTO - a cada 5 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$CTO_ID\",\"schedule\":300,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ CTO heartbeat: 5 min"

# Senior Dev - a cada 3 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$DEV1_ID\",\"schedule\":180,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ Senior Dev heartbeat: 3 min"

# Frontend Dev - a cada 3 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$DEV2_ID\",\"schedule\":180,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ Frontend Dev heartbeat: 3 min"

# QA - a cada 10 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$QA_ID\",\"schedule\":600,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ QA heartbeat: 10 min"

# DevOps - a cada 15 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$DEVOPS_ID\",\"schedule\":900,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ DevOps heartbeat: 15 min"

# Marketing - a cada 30 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$MKT_ID\",\"schedule\":1800,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ Marketing heartbeat: 30 min"

# Product Manager - a cada 15 min
curl -s -X POST "$API/heartbeats" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$PM_ID\",\"schedule\":900,\"maxRetries\":3,\"enabled\":true}" > /dev/null
echo "  ✅ Product Manager heartbeat: 15 min"

echo ""

# ── Step 4: Create Initial Tasks ──
echo "📋 Step 4/4: Criando tarefas iniciais..."

curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Revisar arquitetura do PsiLock\",
    \"description\": \"Analisar estrutura Next.js, Prisma, Supabase e sugerir melhorias\",
    \"companyId\": \"$COMPANY_ID\",
    \"agentId\": \"$CTO_ID\",
    \"priority\": \"high\",
    \"status\": \"pending\"
  }" > /dev/null
echo "  ✅ Task: Revisar arquitetura (CTO)"

curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Implementar melhorias de UI/UX\",
    \"description\": \"Otimizar componentes React, responsividade e performance\",
    \"companyId\": \"$COMPANY_ID\",
    \"agentId\": \"$DEV2_ID\",
    \"priority\": \"medium\",
    \"status\": \"pending\"
  }" > /dev/null
echo "  ✅ Task: Melhorias UI/UX (Frontend Dev)"

curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Criar suite de testes E2E\",
    \"description\": \"Implementar testes Playwright para fluxos criticos\",
    \"companyId\": \"$COMPANY_ID\",
    \"agentId\": \"$QA_ID\",
    \"priority\": \"high\",
    \"status\": \"pending\"
  }" > /dev/null
echo "  ✅ Task: Suite de testes E2E (QA)"

curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Criar estrategia de marketing digital\",
    \"description\": \"Plano de marketing para lancamento do PsiLock\",
    \"companyId\": \"$COMPANY_ID\",
    \"agentId\": \"$MKT_ID\",
    \"priority\": \"medium\",
    \"status\": \"pending\"
  }" > /dev/null
echo "  ✅ Task: Estrategia de marketing (Marketing Lead)"

curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Definir roadmap de produto\",
    \"description\": \"Criar roadmap Q2/Q3 com features prioritarias\",
    \"companyId\": \"$COMPANY_ID\",
    \"agentId\": \"$PM_ID\",
    \"priority\": \"high\",
    \"status\": \"pending\"
  }" > /dev/null
echo "  ✅ Task: Roadmap de produto (Product Manager)"

echo ""

# ── Summary ──
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   ✅  PsiLock Company Setup Complete!                     ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║   Empresa:    PsiLock                                     ║"
echo "║   Diretorio:  $PSILOCK_DIR"
echo "║                                                           ║"
echo "║   Agentes:    8                                           ║"
echo "║     • CEO                                                 ║"
echo "║     • CTO                                                 ║"
echo "║     • Senior Developer                                    ║"
echo "║     • Frontend Developer                                  ║"
echo "║     • QA Engineer                                         ║"
echo "║     • DevOps                                              ║"
echo "║     • Marketing Lead                                      ║"
echo "║     • Product Manager                                     ║"
echo "║                                                           ║"
echo "║   Tarefas:    5 iniciais                                  ║"
echo "║                                                           ║"
echo "║   Acesse: http://localhost:3100                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

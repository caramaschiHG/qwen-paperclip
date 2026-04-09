#!/bin/bash

# 🚀 Qwen Paperclip - Script de Demonstração
# Este script apresenta o projeto de forma interativa

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << 'EOF'
 ██████╗ ██╗   ██╗██╗    ██╗██╗  ██╗██████╗ ██╗   ██╗████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗
██╔═══██╗██║   ██║██║    ██║╚██╗██╔╝██╔══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║
██║   ██║██║   ██║██║ █╗ ██║ ╚███╔╝ ██████╔╝██║   ██║   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║
██║▄▄ ██║██║   ██║██║███╗██║ ██╔██╗ ██╔══██╗██║   ██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║
╚██████╔╝╚██████╔╝╚███╔███╔╝██╔╝ ██╗██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║
 ╚══▀▀═╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝
EOF
echo -e "${NC}"

echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Qwen Paperclip - Demonstração Interativa${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# Função de pausa
pause() {
    echo -e "${YELLOW}Pressione [ENTER] para continuar...${NC}"
    read
}

# Seção 1: Sobre o Projeto
echo -e "${MAGENTA}📖 O QUE É QWEN PAPERCLIP?${NC}"
echo -e "${NC}"
echo -e "  ✅ Integra Qwen Code como agente nativo do Paperclip"
echo -e "  ✅ Zero API Key - OAuth automático via navegador"
echo -e "  ✅ Heartbeat 24/7 - Agentes trabalham sem supervisão"
echo -e "  ✅ Context Persistence - Memória entre execuções"
echo -e "  ✅ Budget Control - 60 req/min, 1000 req/dia (gratuito)"
echo -e "  ✅ Multi-Tenant - Múltiplas empresas isoladas"
echo -e "  ✅ Dashboard - Monitoramento em tempo real"
echo ""
pause

# Seção 2: Estrutura do Projeto
echo -e "${MAGENTA}📁 ESTRUTURA DO PROJETO${NC}"
echo -e "${NC}"
echo -e "  📦 packages/"
echo -e "     ├── agent/           Adaptador Qwen Code para Paperclip"
echo -e "     ├── heartbeat/       Sistema de heartbeat com cron"
echo -e "     └── cli/             CLI de configuração e deploy"
echo -e "  📱 apps/"
echo -e "     └── dashboard/       UI de monitoramento React"
echo -e "  🐳 docker-compose.yml  Setup completo com PostgreSQL"
echo ""
pause

# Seção 3: Verificar Build
echo -e "${MAGENTA}🔧 VERIFICANDO BUILD${NC}"
echo -e "${NC}"

if command -v pnpm &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} pnpm instalado"
    PNPM_VERSION=$(pnpm --version)
    echo -e "  ${GREEN}✓${NC} Versão pnpm: $PNPM_VERSION"
else
    echo -e "  ${RED}✗${NC} pnpm não encontrado. Instale com: npm install -g pnpm"
fi

if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Dependências instaladas"
else
    echo -e "  ${YELLOW}!${NC} Dependências não instaladas"
    echo -e "     Execute: pnpm install"
fi

if [ -d "packages/agent/dist" ]; then
    echo -e "  ${GREEN}✓${NC} Build realizado"
else
    echo -e "  ${YELLOW}!${NC} Build não realizado"
    echo -e "     Execute: pnpm build"
fi

echo ""
pause

# Seção 4: Funcionalidades Principais
echo -e "${MAGENTA}⚡ FUNCIONALIDADES PRINCIPAIS${NC}"
echo -e "${NC}"
echo -e "  ${CYAN}1.${NC} Agente Qwen Code com OAuth local"
echo -e "     └─ Executa: qwen --prompt \"task\" --yolo"
echo -e "     └─ Output: JSON com resultado e estatísticas"
echo -e "     └─ Sem API key necessária!"
echo ""
echo -e "  ${CYAN}2.${NC} Heartbeat Scheduler"
echo -e "     └─ Agendamento com expressões cron"
echo -e "     └─ Injeção automática de contexto"
echo -e "     └─ Retry e tolerância a falhas"
echo ""
echo -e "  ${CYAN}3.${NC] CLI Interativa"
echo -e "     └─ Comandos: init, add-agent, add-heartbeat, start"
echo -e "     └─ Setup em minutos"
echo ""
echo -e "  ${CYAN}4.${NC} Dashboard React"
echo -e "     └─ Status de agentes em tempo real"
echo -e "     └─ Histórico de heartbeats"
echo -e "     └─ Estatísticas de uso"
echo ""
pause

# Seção 5: Demo Rápido
echo -e "${MAGENTA}🚀 DEMO RÁPIDO${NC}"
echo -e "${NC}"
echo -e "  Veja o projeto em ação:"
echo -e ""
echo -e "  ${BLUE}1.${NC} Inicializar projeto"
echo -e "     ${YELLOW}npx qwen-paperclip init --name demo${NC}"
echo -e ""
echo -e "  ${BLUE}2.${NC} Adicionar agente"
echo -e "     ${YELLOW}npx qwen-paperclip add-agent --name dev -d ./src${NC}"
echo -e ""
echo -e "  ${BLUE}3.${NC} Configurar heartbeat"
echo -e "     ${YELLOW}npx qwen-paperclip add-heartbeat -a dev -s '*/5 * * * *'${NC}"
echo -e ""
echo -e "  ${BLUE}4.${NC} Iniciar scheduler"
echo -e "     ${YELLOW}npx qwen-paperclip start${NC}"
echo -e ""
echo -e "  ${BLUE}5.${NC} Testar agente"
echo -e "     ${YELLOW}npx qwen-paperclip test -p \"Olá, mundo!\"${NC}"
echo ""
pause

# Seção 6: Docker
echo -e "${MAGENTA}🐳 USAR COM DOCKER${NC}"
echo -e "${NC}"
echo -e "  Suba tudo com um comando:"
echo -e ""
echo -e "  ${YELLOW}docker-compose up -d${NC}"
echo -e ""
echo -e "  Serviços incluídos:"
echo -e "  ✅ PostgreSQL 16 (embarcado)"
echo -e "  ✅ API Server (porta 3100)"
echo -e "  ✅ Dashboard React (porta 3000)"
echo -e "  ✅ Qwen Cache (volume persistente)"
echo -e ""
echo -e "  Acesse: ${CYAN}http://localhost:3000${NC}"
echo ""
pause

# Seção 7: Próximos Passos
echo -e "${MAGENTA}🎯 PRÓXIMOS PASSOS${NC}"
echo -e "${NC}"
echo -e "  ${GREEN}1.${NC} Leia o guia de início rápido:"
echo -e "     ${YELLOW}cat GETTING_STARTED.md${NC}"
echo -e ""
echo -e "  ${GREEN}2.${NC} Explore exemplos:"
echo -e "     ${YELLOW}cat EXAMPLES.md${NC}"
echo -e ""
echo -e "  ${GREEN}3.${NC} Contribua com o projeto:"
echo -e "     ${YELLOW}cat CONTRIBUTING.md${NC}"
echo -e ""
echo -e "  ${GREEN}4.${NC} Fork e clone:"
echo -e "     ${YELLOW}gh repo fork qwen-paperclip${NC}"
echo -e ""
echo -e "  ${GREEN}5.${NC} Instale e build:"
echo -e "     ${YELLOW}pnpm install && pnpm build${NC}"
echo ""
pause

# Seção 8: Links Úteis
echo -e "${MAGENTA}🔗 LINKS ÚTEIS${NC}"
echo -e "${NC}"
echo -e "  📦 Qwen Code:        ${CYAN}https://github.com/QwenLM/qwen-code${NC}"
echo -e "  📎 Paperclip:        ${CYAN}https://github.com/paperclipai/paperclip${NC}"
echo -e "  📖 Qwen OAuth Docs:  ${CYAN}https://qwenlm.github.io/qwen-code-docs/${NC}"
echo -e "  🐛 Issues:           ${CYAN}https://github.com/seu-usuario/qwen-paperclip/issues${NC}"
echo -e "  💬 Discussions:      ${CYAN}https://github.com/seu-usuario/qwen-paperclip/discussions${NC}"
echo ""
pause

# Encerramento
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✨ Qwen Paperclip - Pronto para Uso!${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${NC}"
echo -e "  ${MAGENTA}Orquestrando agentes Qwen com zero configuração de API${NC} 🚀"
echo -e ""
echo -e "  ${YELLOW}Dúvidas? Abra uma issue ou participe das discussões!${NC}"
echo -e ""

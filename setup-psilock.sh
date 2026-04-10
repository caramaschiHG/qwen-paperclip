#!/bin/bash
# Setup script for PsiLock company
# Ensures PsiLock has correct workingDirectory configured

PSILOCK_DIR="/home/caramaschi/Área de trabalho/Projetos/PsiLock"
API="http://localhost:3100"

echo "=== PsiLock Setup ==="
echo "Target directory: $PSILOCK_DIR"

# Check if directory exists
if [ ! -d "$PSILOCK_DIR" ]; then
  echo "ERROR: PsiLock directory not found at $PSILOCK_DIR"
  exit 1
fi

# Check if server is running
HEALTH=$(curl -s "$API/api/health" 2>/dev/null)
if [ -z "$HEALTH" ]; then
  echo "ERROR: Server is not running on $API"
  echo "Start with: cd apps/web && tsx src/server/index.ts"
  exit 1
fi
echo "Server: OK"

# Check if PsiLock company exists
COMPANY_ID=$(curl -s "$API/api/companies" | python3 -c "
import sys, json
data = json.load(sys.stdin)
companies = data.get('data', [])
psilock = [c for c in companies if c['name'] == 'PsiLock']
if psilock:
    print(psilock[0]['id'])
" 2>/dev/null)

if [ -z "$COMPANY_ID" ]; then
  echo "PsiLock company not found. Creating..."
  RESPONSE=$(curl -s -X POST "$API/api/companies" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"PsiLock\",
      \"description\": \"Plataforma de seguranca digital\",
      \"workingDirectory\": \"$PSILOCK_DIR\"
    }")
  COMPANY_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
  echo "Created PsiLock: $COMPANY_ID"
else
  echo "PsiLock found: $COMPANY_ID"

  # Update working directory
  echo "Updating working directory..."
  curl -s -X PUT "$API/api/companies/$COMPANY_ID" \
    -H "Content-Type: application/json" \
    -d "{\"workingDirectory\": \"$PSILOCK_DIR\"}" > /dev/null
fi

# Verify
VERIFY=$(curl -s "$API/api/companies/$COMPANY_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
wd = d.get('workingDirectory')
if wd:
    print(f'OK: {wd}')
else:
    print('FAIL: workingDirectory not set')
    sys.exit(1)
")

echo "Working Directory: $VERIFY"

# Check for existing agents
AGENT_COUNT=$(curl -s "$API/api/agents" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
echo "Agents: $AGENT_COUNT"

if [ "$AGENT_COUNT" -eq 0 ]; then
  echo "Creating team..."
  # Create CEO
  curl -s -X POST "$API/api/agents" -H "Content-Type: application/json" \
    -d "{\"name\":\"CEO\",\"companyId\":\"$COMPANY_ID\",\"role\":\"ceo\",\"status\":\"idle\",\"approvalMode\":\"yolo\"}" > /dev/null
  # Create CTO
  curl -s -X POST "$API/api/agents" -H "Content-Type: application/json" \
    -d "{\"name\":\"CTO\",\"companyId\":\"$COMPANY_ID\",\"role\":\"cto\",\"status\":\"idle\",\"approvalMode\":\"yolo\"}" > /dev/null
  # Create Senior Dev
  curl -s -X POST "$API/api/agents" -H "Content-Type: application/json" \
    -d "{\"name\":\"Senior Dev\",\"companyId\":\"$COMPANY_ID\",\"role\":\"senior-dev\",\"status\":\"idle\",\"approvalMode\":\"yolo\"}" > /dev/null
  echo "Team created: CEO, CTO, Senior Dev"
fi

echo ""
echo "=== PsiLock Ready ==="
echo "Open: http://localhost:3100"

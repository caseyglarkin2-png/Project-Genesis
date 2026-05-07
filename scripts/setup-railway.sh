#!/usr/bin/env bash
# Setup script for Project Genesis on Railway + Vercel.
# Run from the repo root: bash scripts/setup-railway.sh
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "${RED}✗${NC} $*"; exit 1; }
header() { echo -e "\n${BOLD}$*${NC}"; }

# ── 1. Check Railway CLI ─────────────────────────────────────────────────────
header "1/5  Railway CLI"
if ! command -v railway &>/dev/null; then
  warn "Railway CLI not found — installing..."
  curl -fsSL https://install.railway.app | sh
  export PATH="$HOME/.railway/bin:$PATH"
fi
ok "railway CLI: $(railway --version 2>/dev/null || echo 'installed')"

# ── 2. Auth + link project ───────────────────────────────────────────────────
header "2/5  Railway auth & project link"
if ! railway whoami &>/dev/null; then
  warn "Not logged in — opening browser auth..."
  railway login
fi
ok "Logged in as $(railway whoami)"

echo ""
echo "Link this repo to your Railway backend service."
echo "If you don't have one yet, Railway will prompt you to create it."
railway link

# ── 3. Collect secrets ───────────────────────────────────────────────────────
header "3/5  Collecting credentials"

collect() {
  local varname="$1" prompt="$2" current
  current=$(railway variables get "$varname" 2>/dev/null || true)
  if [[ -n "$current" ]]; then
    ok "$varname already set — skipping"
  else
    echo -e "${YELLOW}?${NC} $prompt"
    read -r -p "  → " value
    if [[ -n "$value" ]]; then
      railway variables set "$varname=$value"
      ok "$varname set"
    else
      warn "$varname skipped (empty)"
    fi
  fi
}

collect "MAPBOX_TOKEN" \
  "Mapbox token  (mapbox.com → Account → Access Tokens):"

collect "HUBSPOT_PRIVATE_APP_TOKEN" \
  "HubSpot private app token  (HubSpot → Settings → Integrations → Private Apps):"

echo ""
echo -e "${YELLOW}?${NC} Google service account JSON"
echo "  Paste the entire JSON on ONE line (or press Enter to skip):"
echo "  (GCP Console → IAM & Admin → Service Accounts → your account → Keys → Add Key → JSON)"
read -r -p "  → " sa_json
if [[ -n "$sa_json" ]]; then
  railway variables set "GENESIS_SHEETS_SERVICE_ACCOUNT_JSON=$sa_json"
  ok "GENESIS_SHEETS_SERVICE_ACCOUNT_JSON set"
else
  warn "Google Sheets writeback skipped — set GENESIS_SHEETS_SERVICE_ACCOUNT_JSON later to enable --push-drive"
fi

# ── 4. Set non-secret config vars ────────────────────────────────────────────
header "4/5  Config vars"
railway variables set "PORT=8080" 2>/dev/null && ok "PORT=8080" || true
railway variables set "PYTHON_VERSION=3.12" 2>/dev/null && ok "PYTHON_VERSION=3.12" || true

# ── 5. Deploy + print URL ────────────────────────────────────────────────────
header "5/5  Deploy"
echo "Triggering Railway deploy from current branch..."
railway up --detach

BACKEND_URL=$(railway status 2>/dev/null | grep -oP 'https://[^ ]+railway\.app[^ ]*' | head -1 || true)

echo ""
ok "Backend deploying on Railway."
if [[ -n "$BACKEND_URL" ]]; then
  echo ""
  echo -e "${BOLD}Backend URL:${NC} $BACKEND_URL"
  echo ""
  echo "──────────────────────────────────────────────────────"
  echo -e "${BOLD}Next: set these 2 vars in Vercel${NC}  (vercel.com → project-genesis → Settings → Environment Variables)"
  echo ""
  echo "  NEXT_PUBLIC_API_URL       = $BACKEND_URL"
  echo "  NEXT_PUBLIC_MAPBOX_TOKEN  = <your Mapbox token>"
  echo "──────────────────────────────────────────────────────"
else
  echo ""
  echo "──────────────────────────────────────────────────────"
  echo -e "${BOLD}Next: once Railway shows your backend URL${NC}"
  echo "  Set in Vercel → project-genesis → Settings → Env Vars:"
  echo "    NEXT_PUBLIC_API_URL      = https://your-backend.up.railway.app"
  echo "    NEXT_PUBLIC_MAPBOX_TOKEN = <your Mapbox token>"
  echo "──────────────────────────────────────────────────────"
fi

echo ""
ok "Done. Run 'railway logs' to watch the deploy."

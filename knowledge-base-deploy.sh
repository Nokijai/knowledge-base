#!/bin/bash
# ── knowledge-base-deploy (runs on remote server) ──
#
# Pulls the latest GHCR image and restarts the container.
# Designed to run standalone (systemd timer, cron, or SSH trigger).
#
# Config: /etc/knowledge-base/knowledge-base.env
# Required vars: GHCR_TOKEN, LLM_API_KEY
# Optional: SENTRY_DSN, SENTRY_AUTH_TOKEN, NEXT_PUBLIC_AXIOM_TOKEN

set -euo pipefail

CONFIG="/etc/knowledge-base/knowledge-base.env"
CONTAINER="knowledge-base"
IMAGE="ghcr.io/nokijai/knowledge-base:latest"

if [ ! -f "$CONFIG" ]; then
  echo "ERROR: $CONFIG not found. Create it first."
  exit 1
fi

source "$CONFIG"

: "${GHCR_TOKEN:?must be set}"
: "${LLM_API_KEY:?must be set}"

echo "[$(date)] Deploying $IMAGE..."

echo "$GHCR_TOKEN" | docker login ghcr.io -u nokijai --password-stdin >/dev/null 2>&1
docker pull "$IMAGE" >/dev/null 2>&1

docker stop "$CONTAINER" 2>/dev/null || true
docker rm "$CONTAINER" 2>/dev/null || true

for i in $(seq 1 15); do
  ss -tlnp | grep -q ':3001 ' || break
  sleep 1
done

docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p 3001:3000 \
  -v /apps/knowledge-base/content:/app/content:ro \
  -e LLM_PROVIDER="${LLM_PROVIDER:-openai}" \
  -e LLM_MODEL="${LLM_MODEL:-glm-5.2}" \
  -e OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://yuanyuaicloud.cn/v1}" \
  -e LLM_API_KEY=*** \
  -e SENTRY_DSN="${SENTRY_DSN:-}" \
  -e NEXT_PUBLIC_SENTRY_DSN="${SENTRY_DSN:-}" \
  -e SENTRY_AUTH_TOKEN=*** \
  -e NEXT_PUBLIC_AXIOM_TOKEN=*** \
  -e NEXT_PUBLIC_AXIOM_DATASET="${NEXT_PUBLIC_AXIOM_DATASET:-knowledge-base}" \
  "$IMAGE" >/dev/null 2>&1

docker image prune -f >/dev/null 2>&1

sleep 3
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
  echo "[$(date)] Deploy OK"
else
  echo "[$(date)] Health check failed"
fi
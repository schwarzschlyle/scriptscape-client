#!/usr/bin/env sh
set -eu

# This container supports two runtime configs:
# - HTTP-only (to allow initial certbot issuance)
# - HTTPS (requires Let's Encrypt certs to exist on mounted volume)

DOMAIN="${DOMAIN:-app.scriptscape.tools}"

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
CERT_FILE="${CERT_DIR}/fullchain.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"

TEMPLATES_DIR="/etc/nginx/templates"
OUT_CONF="/etc/nginx/conf.d/default.conf"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "[scriptscape-client] SSL certs found for ${DOMAIN}. Using HTTPS nginx config."
  cp "${TEMPLATES_DIR}/default.https.conf" "$OUT_CONF"
else
  echo "[scriptscape-client] SSL certs missing for ${DOMAIN}. Using HTTP-only nginx config."
  cp "${TEMPLATES_DIR}/default.http.conf" "$OUT_CONF"
fi


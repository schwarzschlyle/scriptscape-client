#!/usr/bin/env sh
set -eu

# Choose HTTPS config only if Let's Encrypt certs exist.
# This prevents nginx from crash-looping on first deploy.

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


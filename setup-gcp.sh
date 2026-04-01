#!/usr/bin/env bash
set -euo pipefail

# setup-gcp.sh — One-time GCP setup for hosting henden.com.au
#
# Creates a Cloud Storage bucket configured for static website hosting
# with a load balancer and SSL certificate for the custom domain.
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - A GCP project selected (gcloud config set project <PROJECT_ID>)
#   - DNS for henden.com.au pointed to the load balancer IP (done after this script)

DOMAIN="henden.com.au"
BUCKET="gs://${DOMAIN}"
PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"

if [ -z "${PROJECT_ID}" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project <PROJECT_ID>" >&2
  exit 1
fi

echo "==> Setting up static hosting for ${DOMAIN} in project ${PROJECT_ID}"

# 1. Create the bucket
echo "--- Creating bucket ${BUCKET}"
gsutil mb -l us-central1 "${BUCKET}" 2>/dev/null || echo "    Bucket already exists"

# 2. Make it publicly readable
echo "--- Setting public access"
gsutil iam ch allUsers:objectViewer "${BUCKET}"

# 3. Configure as a static website
echo "--- Configuring website serving"
gsutil web set -m index.html -e index.html "${BUCKET}"

# 4. Reserve a static external IP
## Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/addresses/henden-com-au-ip].
echo "--- Reserving static IP"
gcloud compute addresses create "${DOMAIN//./-}-ip" \
  --global \
  --ip-version IPV4 2>/dev/null || echo "    IP already reserved"

## 34.149.253.243
IP=$(gcloud compute addresses describe "${DOMAIN//./-}-ip" --global --format='get(address)')
echo "    Static IP: ${IP}"

# 5. Create a managed SSL certificate
# Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/sslCertificates/henden-com-au-cert].
# NAME                TYPE     CREATION_TIMESTAMP             EXPIRE_TIME  MANAGED_STATUS
# henden-com-au-cert  MANAGED  2026-04-01T12:08:49.725-07:00               PROVISIONING
#     henden.com.au: PROVISIONING

echo "--- Creating SSL certificate"
gcloud compute ssl-certificates create "${DOMAIN//./-}-cert" \
  --domains="${DOMAIN}" \
  --global 2>/dev/null || echo "    Certificate already exists"

# 6. Create a backend bucket
# Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/backendBuckets/henden-com-au-backend].
# NAME                   GCS_BUCKET_NAME  ENABLE_CDN
# henden-com-au-backend  henden.com.au    True
echo "--- Creating backend bucket"
gcloud compute backend-buckets create "${DOMAIN//./-}-backend" \
  --gcs-bucket-name="${DOMAIN}" \
  --enable-cdn 2>/dev/null || echo "    Backend bucket already exists"

# 7. Create URL map
# Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/urlMaps/henden-com-au-urlmap].
# NAME                  DEFAULT_SERVICE
# henden-com-au-urlmap  backendBuckets/henden-com-au-backend
echo "--- Creating URL map"
gcloud compute url-maps create "${DOMAIN//./-}-urlmap" \
  --default-backend-bucket="${DOMAIN//./-}-backend" 2>/dev/null || echo "    URL map already exists"

# 8. Create HTTPS proxy
# Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/targetHttpsProxies/henden-com-au-proxy].
# NAME                 SSL_CERTIFICATES    URL_MAP
# henden-com-au-proxy  henden-com-au-cert  henden-com-au-urlmap
echo "--- Creating HTTPS proxy"
gcloud compute target-https-proxies create "${DOMAIN//./-}-proxy" \
  --url-map="${DOMAIN//./-}-urlmap" \
  --ssl-certificates="${DOMAIN//./-}-cert" 2>/dev/null || echo "    Proxy already exists"

# 9. Create forwarding rule
# Created [https://www.googleapis.com/compute/v1/projects/elevated-column-491000-t1/global/forwardingRules/henden-com-au-https-rule]
echo "--- Creating forwarding rule"
gcloud compute forwarding-rules create "${DOMAIN//./-}-https-rule" \
  --global \
  --target-https-proxy="${DOMAIN//./-}-proxy" \
  --address="${DOMAIN//./-}-ip" \
  --ports=443 2>/dev/null || echo "    Forwarding rule already exists"

echo ""
echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Point DNS A record for ${DOMAIN} to ${IP}"
echo "  2. Wait for SSL certificate provisioning (can take up to 24h)"
echo "  3. Run ./deploy.sh to upload the site"
echo "  4. Visit https://${DOMAIN}"

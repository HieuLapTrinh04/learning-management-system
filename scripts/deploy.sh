#!/bin/bash
set -e

# Usage: ./scripts/deploy.sh <image_tag>
# Example: ./scripts/deploy.sh sha-1234567

IMAGE_TAG=${1:-latest}
echo "Deploying version: $IMAGE_TAG"

# Export variables for docker-compose
export IMAGE_TAG=$IMAGE_TAG
# Fallback to local repository name if not provided by CI
export GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-HieuLapTrinh04/learning-management-system}

echo "1. Logging into GHCR (Assuming server is already authenticated or image is public)"
# Note: If repository is private, you need `echo $GHCR_PAT | docker login ghcr.io -u USERNAME --password-stdin`

echo "2. Pulling new images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitor.yml --env-file .env.production pull backend frontend

echo "3. Restarting services with Zero-Downtime deployment (if supported by swarm/compose)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitor.yml --env-file .env.production up -d --no-deps backend frontend

echo "4. Pruning old images to save disk space..."
docker image prune -f

echo "Deployment of $IMAGE_TAG completed successfully!"

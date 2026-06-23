#!/bin/bash
set -e

# Usage: ./scripts/rollback.sh <image_tag>
# Example: ./scripts/rollback.sh sha-abcdef1

if [ -z "$1" ]; then
  echo "Error: You must provide the image tag to rollback to."
  echo "Usage: ./scripts/rollback.sh <image_tag>"
  exit 1
fi

export IMAGE_TAG=$1
export GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-HieuLapTrinh04/learning-management-system}

echo "🚨 INITIATING ROLLBACK TO VERSION: $IMAGE_TAG 🚨"

echo "1. Pulling rollback images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitor.yml --env-file .env.production pull backend frontend

echo "2. Restarting services with previous stable version..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitor.yml --env-file .env.production up -d --no-deps backend frontend

echo "✅ Rollback to $IMAGE_TAG completed successfully!"

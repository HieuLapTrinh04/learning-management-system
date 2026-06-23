#!/bin/bash
set -e

# ==============================================================================
# LMS Database Restore Script
# Usage: ./scripts/restore.sh <backup_tar_gz_file>
# Example: ./scripts/restore.sh /var/backups/lms/lms_backup_20260620_020000.tar.gz
# ==============================================================================

if [ -z "$1" ]; then
  echo "Error: You must provide the path to the backup tar.gz file."
  echo "Usage: ./scripts/restore.sh <backup_tar_gz_file>"
  exit 1
fi

BACKUP_FILE=$1
DB_CONTAINER="lms_db_prod"
REDIS_CONTAINER="lms_redis_prod"
BACKUP_BASENAME=$(basename "$BACKUP_FILE" .tar.gz)
TEMP_DIR="/tmp/lms_restore_$BACKUP_BASENAME"

echo "========================================="
echo "🚨 INITIATING LMS DISASTER RECOVERY 🚨"
echo "Restoring from: $BACKUP_FILE"
echo "========================================="

# 1. Extract the backup bundle
echo "1. Extracting backup bundle to $TEMP_DIR..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Note: The extracted folder inside TEMP_DIR will be named after BACKUP_BASENAME
EXTRACTED_FOLDER="$TEMP_DIR/$BACKUP_BASENAME"

# 2. Restore MySQL Database
echo "2. Restoring MySQL database..."
if [ -f "$EXTRACTED_FOLDER/mysql_dump.sql.gz" ]; then
    # Unzip on the fly and pipe to mysql container
    gunzip -c "$EXTRACTED_FOLDER/mysql_dump.sql.gz" | docker exec -i "$DB_CONTAINER" sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
    echo "   [SUCCESS] MySQL database restored."
else
    echo "   [WARNING] MySQL dump not found in the backup bundle."
fi

# 3. Restore Redis Cache
echo "3. Restoring Redis Cache..."
if [ -f "$EXTRACTED_FOLDER/redis_snapshot.rdb" ]; then
    # Copy RDB file into container
    docker cp "$EXTRACTED_FOLDER/redis_snapshot.rdb" "$REDIS_CONTAINER":/data/dump.rdb
    
    # Restart Redis container to load the new RDB file into memory
    echo "   Restarting Redis container to load snapshot..."
    docker restart "$REDIS_CONTAINER"
    echo "   [SUCCESS] Redis cache restored."
else
    echo "   [WARNING] Redis snapshot not found in the backup bundle."
fi

# 4. Restore Uploads
echo "4. Restoring User Uploads..."
if [ -f "$EXTRACTED_FOLDER/uploads_archive.tar.gz" ]; then
    # Extract the uploads tarball directly into the backend container
    cat "$EXTRACTED_FOLDER/uploads_archive.tar.gz" | docker exec -i lms_backend_prod tar -xzf - -C /
    echo "   [SUCCESS] User uploads restored."
else
    echo "   [WARNING] Uploads archive not found in the backup bundle."
fi

# 5. Cleanup
echo "5. Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "========================================="
echo "✅ LMS Restoration Completed Successfully!"
echo "Please verify the application state at your domain."
echo "========================================="

#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/lms"
RETENTION_DAYS=30
DATE=$(date +"%Y%m%d_%H%M%S")

# Container Names (from docker-compose.yml)
DB_CONTAINER="lms_db_prod"
REDIS_CONTAINER="lms_redis_prod"
BACKUP_NAME="lms_backup_$DATE"

# Ensure backup directories exist
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

echo "========================================="
echo "Starting LMS Automated Production Backup: $DATE"
echo "========================================="

# 1. Backup MySQL Database
echo "1. Exporting MySQL database..."
if docker exec "$DB_CONTAINER" sh -c 'exec mysqldump --all-databases -uroot -p"$MYSQL_ROOT_PASSWORD"' > "$BACKUP_DIR/$BACKUP_NAME/mysql_dump.sql" 2>/dev/null; then
    gzip "$BACKUP_DIR/$BACKUP_NAME/mysql_dump.sql"
    echo "   [SUCCESS] MySQL backup saved: mysql_dump.sql.gz"
else
    echo "   [ERROR] Failed to export MySQL database"
fi

# 2. Backup Redis Cache (RDB Snapshot)
echo "2. Copying Redis RDB snapshot..."
# Trigger Redis background save first to ensure we have the latest state on disk
docker exec "$REDIS_CONTAINER" redis-cli -a "secret_redis_prod_pass" save >/dev/null 2>&1
# Copy RDB snapshot from host mounted volume path (assumed stored under docker-compose volume mapping)
# Alternatively, copy from inside container if host volume path differs
if docker cp "$REDIS_CONTAINER":/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_snapshot.rdb" 2>/dev/null; then
    echo "   [SUCCESS] Redis snapshot saved: redis_snapshot.rdb"
else
    echo "   [ERROR] Failed to copy Redis snapshot file"
fi

# 3. Backup User Uploads Folder (Certificates, Assignments)
echo "3. Archiving user upload files..."
# Locate uploads relative directory or docker volume path.
# In docker-compose, uploads are stored inside container /app/uploads mapped to volume uploads_prod_data
# We can archive it directly from the backend container to ensure correct permission mappings
if docker exec lms_backend_prod tar -czf - /app/uploads > "$BACKUP_DIR/$BACKUP_NAME/uploads_archive.tar.gz" 2>/dev/null; then
    echo "   [SUCCESS] Uploads archive saved: uploads_archive.tar.gz"
else
    echo "   [ERROR] Failed to archive uploads folder"
fi

# 4. Create final compressed tarball of the current backup run
echo "4. Creating unified backup bundle..."
cd "$BACKUP_DIR" || exit
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"
echo "   [SUCCESS] Unified backup file created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# 5. Offsite Remote Backup (AWS S3)
echo "5. Syncing backup to AWS S3 (Offsite Disaster Recovery)..."
# Make sure AWS CLI is configured on the host server
# aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://your-lms-backup-bucket/
echo "   [INFO] S3 Sync is currently commented out. Configure AWS CLI and uncomment to enable."

# 6. Housekeeping (Delete backups older than RETENTION_DAYS)
echo "6. Performing rotation housekeeping (cleaning backups older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "lms_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "   [SUCCESS] Housekeeping finished."

echo "========================================="
echo "LMS Backup Completed Successfully at $(date)"
echo "========================================="

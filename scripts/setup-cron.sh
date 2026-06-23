#!/bin/bash

# ==============================================================================
# Setup automated cron job for database backups
# Run this on the host server
# ==============================================================================

PROJECT_DIR="/opt/learning-management-system"
CRON_SCHEDULE="0 2 * * *" # Runs every day at 2:00 AM
SCRIPT_PATH="$PROJECT_DIR/scripts/backup.sh"

echo "Setting up daily backup cron job at $CRON_SCHEDULE..."

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Backup script not found at $SCRIPT_PATH. Please verify project directory."
    exit 1
fi

# Ensure backup script is executable
chmod +x "$SCRIPT_PATH"

# Write the new cron job to a temporary file
crontab -l > mycron 2>/dev/null || true

# Check if the cron job already exists to avoid duplicates
if grep -q "$SCRIPT_PATH" mycron; then
    echo "Cron job already exists. No changes made."
    rm mycron
    exit 0
fi

# Add the new cron job
echo "$CRON_SCHEDULE $SCRIPT_PATH >> /var/log/lms_backup.log 2>&1" >> mycron

# Install the new cron file
crontab mycron
rm mycron

echo "✅ Backup cron job installed successfully!"
echo "Backups will run daily at 2:00 AM and output logs to /var/log/lms_backup.log"

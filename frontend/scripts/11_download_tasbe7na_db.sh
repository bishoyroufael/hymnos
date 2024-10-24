#!/bin/bash

# Define the URL and destination paths
URL="https://tasbe7na.com/tasbe7naDB.zip"
DEST_DIR="assets/tasbe7nadb"

# Create the destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Get the current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Download the zip file to a temporary location
ZIP_FILE="/tmp/tasbe7naDB.zip"
curl -L "$URL" -o "$ZIP_FILE"

# Calculate the SHA-256 checksum of the downloaded file
SHA=$(sha256sum "$ZIP_FILE" | awk '{ print $1 }')

# Define the name of the folder with the timestamp and SHA
EXTRACT_DIR="$DEST_DIR/tasbe7nadb_${TIMESTAMP}_${SHA}"

# Extract the zip file to the destination folder
unzip "$ZIP_FILE" -d "$EXTRACT_DIR"

# Clean up by removing the downloaded zip file
rm "$ZIP_FILE"

echo "File downloaded and extracted to $EXTRACT_DIR"
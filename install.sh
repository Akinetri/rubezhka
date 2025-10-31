'#!/bin/bash

# Check for Git
if ! command -v git &> /dev/null
then
    echo "Git could not be found. Please install Git to proceed."
    exit 1
fi

# Check for ImageMagick
if ! command -v magick &> /dev/null
then
    echo "ImageMagick could not be found. Please install ImageMagick to proceed."
    exit 1
fi

# Clone or update the repository
REPO_URL="https://github.com/Akinetri/rubezhka.git"
TARGET_DIR="rubezhka"

if [ -d "$TARGET_DIR" ]; then
    echo "Updating the repository..."
    cd "$TARGET_DIR" || exit
    git pull origin main
else
    echo "Cloning the repository..."
    git clone "$REPO_URL"
    cd "$TARGET_DIR" || exit
fi

# Create icon
echo "Creating icon..."
magick convert icon.png -resize 128x128 icon@128.png

# Copy to clipboard (Linux specific, requires xclip)
if command -v xclip &> /dev/null
then
    echo "Copying installation instructions to clipboard..."
    echo "To install the Chrome extension, follow these steps:" | xclip -selection clipboard
    echo "1. Open Chrome and navigate to chrome://extensions/"
    echo "2. Enable 'Developer mode'."
    echo "3. Click 'Load unpacked' and select the directory of the cloned repository."
else
    echo "xclip not found. Please copy the following instructions manually:"
    echo "To install the Chrome extension, follow these steps:"
    echo "1. Open Chrome and navigate to chrome://extensions/"
    echo "2. Enable 'Developer mode'."
    echo "3. Click 'Load unpacked' and select the directory of the cloned repository."
fi

echo "Installation script completed."
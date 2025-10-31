#!/bin/bash

# Clone the repository
git clone https://github.com/Akinetri/rubezhka.git
cd rubezhka

# Create icons using ImageMagick
convert -size 128x128 xc:white icon.png
convert -size 64x64 xc:white icon-64.png
convert -size 32x32 xc:white icon-32.png

# Setup instructions

echo "Setup Instructions:"
echo "1. Navigate to the rubezhka directory."
echo "2. Run the application using the command: ./run.sh"
echo "3. Follow the on-screen instructions to complete the setup."
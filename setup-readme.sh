#!/bin/bash

# Netify README Setup Script
# Run this script after cloning the repository to set up the appropriate README

# Display welcome message
echo "🎵 Setting up Netify README..."
echo "This script will detect your system configuration and display the appropriate README."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "⚠️ Node.js is not installed. Using bash-only fallback method."
  
  # Bash-only fallback for system detection
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS detection
    if [[ "$(defaults read -g AppleLocale 2>/dev/null || echo "en_US")" == *"zh"* ]]; then
      cp README.zh.md README.md
      echo "✅ Set up Chinese README for macOS."
    else
      cp README.en.md README.md
      echo "✅ Set up English README for macOS."
    fi
  else
    # Default to English for other systems
    cp README.en.md README.md
    echo "✅ Set up English README for your system."
  fi
else
  # Use the comprehensive Node.js script
  echo "🔍 Detecting your system configuration..."
  node generate-readme.js
  echo "✅ README setup complete!"
fi

# Make scripts executable
chmod +x language-detector.js
chmod +x os-specific-readme.js
chmod +x generate-readme.js
chmod +x update-readme.sh

echo ""
echo "📝 Available README commands:"
echo "  npm run readme       - Smart README (OS + language detection)"
echo "  npm run readme:lang  - Language detection only"
echo "  npm run readme:os    - OS detection only"
echo ""
echo "🎉 Netify README setup complete! Enjoy using Netify!" 
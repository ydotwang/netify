#!/bin/bash

# Script to update README.md based on system language

# Detect system language
if [[ $(uname) == "Darwin" ]]; then
    # macOS
    LANG=$(defaults read -g AppleLocale 2>/dev/null || echo "en_US")
elif [[ $(uname) == "Linux" ]]; then
    # Linux
    LANG=${LANG:-en_US.UTF-8}
else
    # Windows or other
    LANG=${LANG:-en_US.UTF-8}
fi

# Check if README files exist
if [ ! -f "README.en.md" ] || [ ! -f "README.zh.md" ]; then
    echo "Error: README.en.md or README.zh.md missing. Please run language-detector.js first."
    exit 1
fi

# Select the appropriate README based on language
if [[ $LANG == *"zh"* ]] || [[ $LANG == *"CN"* ]] || [[ $LANG == *"cn"* ]]; then
    echo "Detected Chinese language: $LANG"
    cp README.zh.md README.md
    echo "Updated README.md with Chinese version."
else
    echo "Using English language: $LANG"
    cp README.en.md README.md
    echo "Updated README.md with English version."
fi

echo "Done! README.md has been updated." 
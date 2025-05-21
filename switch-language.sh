#!/bin/bash

# Netify Language Switcher
# This script allows switching between Chinese and English READMEs

# Default to auto-detection if no language specified
LANGUAGE=${1:-auto}

# Display header
echo "🌐 Netify README Language Switcher"
echo "-----------------------------------"

# Function to switch to English README
switch_to_english() {
    if [ -f "README.en.md" ]; then
        cp README.en.md README.md
        echo "✅ Switched to English README"
    else
        echo "❌ Error: README.en.md not found!"
        exit 1
    fi
}

# Function to switch to Chinese README
switch_to_chinese() {
    if [ -f "README.zh.md" ]; then
        cp README.zh.md README.md
        echo "✅ 已切换至中文版 README"
    else
        echo "❌ 错误: README.zh.md 文件不存在!"
        exit 1
    fi
}

# Function to auto-detect language
auto_detect_language() {
    echo "🔍 Auto-detecting system language..."
    
    # Detect system language
    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS
        LANG_SETTING=$(defaults read -g AppleLocale 2>/dev/null || echo "en_US")
    else 
        # Linux and others - use LANG environment variable
        LANG_SETTING=${LANG:-en_US.UTF-8}
    fi

    echo "🌍 Detected language setting: $LANG_SETTING"

    # Check if Chinese
    if [[ "$LANG_SETTING" == *"zh"* ]] || [[ "$LANG_SETTING" == *"cn"* ]] || [[ "$LANG_SETTING" == *"CN"* ]]; then
        switch_to_chinese
    else
        switch_to_english
    fi
}

# Check if Node.js is available for more accurate detection
check_node_detection() {
    if command -v node &> /dev/null; then
        echo "🟢 Using Node.js for more accurate language detection..."
        node language-detector.js
    else
        echo "⚠️ Node.js not found, using basic detection..."
        auto_detect_language
    fi
}

# Process command line argument
case "$LANGUAGE" in
    "en"|"english"|"English")
        switch_to_english
        ;;
    "zh"|"chinese"|"Chinese"|"中文")
        switch_to_chinese
        ;;
    "auto"|"detect")
        check_node_detection
        ;;
    *)
        # Show usage information
        echo "Usage: ./switch-language.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  en, english, English     Switch to English README"
        echo "  zh, chinese, Chinese, 中文  Switch to Chinese README"
        echo "  auto, detect             Auto-detect system language (default)"
        echo ""
        echo "Examples:"
        echo "  ./switch-language.sh en  # Switch to English"
        echo "  ./switch-language.sh zh  # Switch to Chinese"
        echo "  ./switch-language.sh     # Auto-detect language"
        ;;
esac 
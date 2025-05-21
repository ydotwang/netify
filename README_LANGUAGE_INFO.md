# Netify - Smart README Features

This project includes two smart features for README display:

1. **Language Detection**: Shows you the README in your preferred language (Chinese or English)
2. **OS-Specific Content**: Shows content optimized for your operating system (macOS, Windows, or Linux)

## Language Detection

There are two methods provided for language detection:

### 1. JavaScript-based Detection (Browser)

When viewing the README.md on platforms that support embedded JavaScript (like local markdown viewers), the system will detect your browser's language setting and display either English or Chinese content automatically.

### 2. Shell-based Detection (Command Line)

For command-line usage, we provide two scripts:

- **update-readme.sh**: A bash script that detects your system language and updates the README.md file accordingly
  ```bash
  # Run this script to update README.md based on your system language
  ./update-readme.sh
  ```

- **language-detector.js**: A Node.js script that does the same thing
  ```bash
  # Alternative method using Node.js
  node language-detector.js
  # or
  npm run update-readme
  ```

## Manual Selection

If you prefer to manually select a language:

- For English: `cp README.en.md README.md`
- For Chinese: `cp README.zh.md README.md`

## Default Language

If the system cannot detect your language or if your language is not Chinese, the README will default to English.

## OS-Specific README

The project also includes content that is tailored to your operating system:

### How It Works

Run one of these commands to get a README optimized for your operating system:

```bash
# Using Node.js
node os-specific-readme.js

# Or using npm script
npm run os-readme
```

### Features

- **macOS Version**: Includes macOS-specific keyboard shortcuts, Spotlight integration, and Apple Music compatibility
- **Windows Version**: Includes Windows-specific keyboard shortcuts, browser recommendations, and firewall settings
- **Linux Version**: Includes terminal integration instructions and system requirements for Linux distributions

### Manual Selection

If you want to manually select an OS-specific README:

- For macOS: `cp README.macos.md README.md`
- For Windows: `cp README.windows.md README.md`
- For Linux: `cp README.linux.md README.md`

---

感谢您使用 Netify！如有任何问题，请随时提出。  
Thank you for using Netify! If you have any questions, please feel free to ask. 
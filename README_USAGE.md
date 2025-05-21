# Netify Smart README System

This project features a smart README system that adapts to your preferences:

## Available README Options

This project includes the following README variations:

1. **Language-specific READMEs**:
   - `README.en.md` - English version
   - `README.zh.md` - Chinese version

2. **OS-specific READMEs**:
   - `README.macos.md` - Optimized for macOS users
   - `README.windows.md` - Optimized for Windows users
   - `README.linux.md` - Optimized for Linux users

3. **Combined READMEs**:
   - Automatically combines both OS and language detection

## Quick Commands

Use these npm scripts to display different README versions:

```bash
# Smart README - detects both language and OS
npm run readme

# Language-specific only (English or Chinese)
npm run readme:lang

# OS-specific only (macOS, Windows, or Linux)
npm run readme:os

# Legacy commands
npm run update-readme  # Original language detection
npm run os-readme      # Original OS detection
```

## How to Use

1. **Automatic Detection**: Just run `npm run readme` and the system will detect your OS and language
2. **Manual Selection**: Copy any specific README file to README.md
   ```bash
   # Example: Select Chinese README
   cp README.zh.md README.md
   
   # Example: Select macOS README
   cp README.macos.md README.md
   ```

## How It Works

- **Language Detection**: Uses system locale settings to detect Chinese or English preference
- **OS Detection**: Identifies if you're using macOS, Windows, or Linux
- **Combined Mode**: Provides OS-specific instructions in your preferred language

---

感谢您使用 Netify！如有任何问题，请随时提出。  
Thank you for using Netify! If you have any questions, please feel free to ask. 
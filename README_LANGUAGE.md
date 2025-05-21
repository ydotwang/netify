# Netify - Language Switching

This project supports both Chinese and English README files. You can easily switch between languages.

## Available Languages

- **English**: `README.en.md`
- **Chinese**: `README.zh.md`

## How to Switch Languages

### Using npm Scripts

```bash
# Auto-detect your system language
npm run readme:auto

# Switch to English
npm run readme:en

# Switch to Chinese 
npm run readme:zh
```

### Using Command Line

```bash
# Auto-detect your system language
./switch-language.sh

# Switch to English
./switch-language.sh en

# Switch to Chinese
./switch-language.sh zh
```

### Manual Switching

You can also manually copy the language file you want:

```bash
# For English
cp README.en.md README.md

# For Chinese
cp README.zh.md README.md
```

## How It Works

The language detection system checks your system locale settings to determine whether to display Chinese or English content. If it detects a Chinese locale (`zh`, `CN`, etc.), it will display the Chinese README; otherwise, it defaults to English.

---

# Netify - 语言切换

本项目支持中文和英文两种 README 文件。您可以轻松地在语言之间切换。

## 可用语言

- **英文**: `README.en.md`
- **中文**: `README.zh.md`

## 如何切换语言

### 使用 npm 脚本

```bash
# 自动检测您的系统语言
npm run readme:auto

# 切换至英文
npm run readme:en

# 切换至中文
npm run readme:zh
```

### 使用命令行

```bash
# 自动检测您的系统语言
./switch-language.sh

# 切换至英文
./switch-language.sh en

# 切换至中文
./switch-language.sh zh
```

### 手动切换

您也可以手动复制您想要的语言文件：

```bash
# 英文版
cp README.en.md README.md

# 中文版
cp README.zh.md README.md
```

## 工作原理

语言检测系统会检查您的系统语言设置，以确定显示中文还是英文内容。如果检测到中文语言环境（`zh`、`CN` 等），将显示中文 README；否则，默认为英文。 
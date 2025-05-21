#!/usr/bin/env node

/**
 * Netify README Generator
 * 
 * This script generates the appropriate README file based on:
 * 1. The user's system language (Chinese or English)
 * 2. The user's operating system (macOS, Windows, or Linux)
 * 
 * Usage:
 *   node generate-readme.js                 - Use both language and OS detection
 *   node generate-readme.js --language-only - Use only language detection
 *   node generate-readme.js --os-only       - Use only OS detection
 */

const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const languageOnly = args.includes('--language-only');
const osOnly = args.includes('--os-only');

// Default to using both if no specific flag is provided
const useBoth = !languageOnly && !osOnly;

// Function to create the language-specific READMEs
const createLanguageReadmes = () => {
  // English README
  const englishReadme = `# Netify: Transfer NetEase Cloud Music playlists to Spotify 🎧

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now</strong></a>
  </p>
</div>

<hr/>

## 🌟 Features

- **Simple One-Click Process**: Just log in with Spotify, paste a NetEase playlist link, and click Transfer
- **Full Playlist Import**: Transfer entire playlists including tracks, name, and cover art
- **Smart Matching**: Advanced algorithm to find the best matches on Spotify
- **Large Playlist Support**: Can handle up to 10,000 tracks
- **Progress Tracking**: See detailed progress as your music transfers
- **Missing Tracks Report**: Get a detailed report of any songs that couldn't be found

<hr/>

## 📱 Demo

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="screenshot-home.png" width="400px" alt="Home Screen"/>
        <br/>
        <em>Home Screen</em>
      </td>
      <td align="center">
        <img src="screenshot-transfer.png" width="400px" alt="Transfer Process"/>
        <br/>
        <em>Transfer Process</em>
      </td>
    </tr>
  </table>
</div>

## 🔍 How to use

1. Visit [Netify Web App](https://netify-five.vercel.app/) and click **Log in with Spotify**
2. Authorize the application (requires Spotify account which is the email you use)
3. Copy a NetEase Cloud Music playlist link, for example:
   \`\`\`
   https://y.music.163.com/m/playlist?id=123456
   \`\`\`
4. Paste the link into the input box and click **Transfer to Spotify**
5. Wait for the process to complete - you'll see a progress bar
6. When finished, click "Open playlist in Spotify" to view your new playlist

<hr/>

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, Tailwind CSS, React
- **Backend**: FastAPI (Python), hosted on Fly.io
- **APIs**: Spotify Web API, NetEase Cloud Music API
- **Deployment**: Vercel (frontend), Fly.io (backend)

## 💻 Development

### Prerequisites

1. Node.js 18+ for the frontend
2. Python 3.9+ for the backend API
3. A Spotify Developer account and registered application

### Environment Setup

Create a \`.env.local\` file in the root directory:
\`\`\`
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
\`\`\`

For the backend, create a \`.env\` file in the \`api\` directory:
\`\`\`
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
\`\`\`

### Running Locally

Frontend:
\`\`\`bash
# Install frontend dependencies
npm install

# Run the frontend
npm run dev
\`\`\`

Backend:
\`\`\`bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install backend dependencies
cd api
pip install -r requirements.txt

# Run the backend
uvicorn backend.main:app --reload --port 8080
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the necessary environment variables:
   - \`NEXT_PUBLIC_BACKEND_URL\`: URL of your deployed backend API
   - \`NEXT_PUBLIC_SPOTIFY_CLIENT_ID\`: Your Spotify app's client ID
   - \`NEXT_PUBLIC_SPOTIFY_REDIRECT_URI\`: Your deployed app's callback URL

### Backend (Fly.io)

1. Install the [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Log in to Fly.io: \`flyctl auth login\`
3. Deploy the API:
   \`\`\`bash
   flyctl deploy
   \`\`\`
4. Set environment secrets:
   \`\`\`bash
   flyctl secrets set SPOTIFY_CLIENT_ID=your_client_id
   flyctl secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
   flyctl secrets set SPOTIFY_REDIRECT_URI=https://your-deployed-frontend.com/callback
   \`\`\`

## 📝 License

This project is [MIT licensed](LICENSE).
`;

  // Chinese README
  const chineseReadme = `# Netify: 网易云音乐歌单迁移至Spotify工具 🎧

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 立即体验</strong></a>
  </p>
</div>

<hr/>

## 🌟 主要功能

- **简单一键操作**: 只需用Spotify登录，粘贴网易云歌单链接，然后点击转移
- **完整歌单导入**: 转移整个歌单，包括歌曲、名称和封面图片
- **智能匹配**: 高级算法为您在Spotify上找到最佳匹配
- **大型歌单支持**: 可处理多达10,000首歌曲
- **进度追踪**: 实时查看音乐转移的详细进度
- **缺失歌曲报告**: 获取无法找到的歌曲的详细报告

<hr/>

## 📱 演示

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="screenshot-home.png" width="400px" alt="主页界面"/>
        <br/>
        <em>主页界面</em>
      </td>
      <td align="center">
        <img src="screenshot-transfer.png" width="400px" alt="转移过程"/>
        <br/>
        <em>转移过程</em>
      </td>
    </tr>
  </table>
</div>

## 🔍 使用指南

1. 访问 [Netify 网页应用](https://netify-five.vercel.app/)，点击 **Log in with Spotify** 按钮
2. 授权应用程序（需要 Spotify 账号注册邮箱）
3. 复制网易云音乐歌单分享链接，例如：
   \`\`\`
   https://y.music.163.com/m/playlist?id=123456
   \`\`\`
4. 将链接粘贴到输入框中，点击 **Transfer to Spotify** 按钮
5. 等待处理完成 - 您将看到进度条
6. 完成后，点击"Open playlist in Spotify"查看您的新歌单

<hr/>

## 🛠️ 技术栈

- **前端**: Next.js 14, Tailwind CSS, React
- **后端**: FastAPI (Python), 托管于 Fly.io
- **API**: Spotify Web API, 网易云音乐 API
- **部署**: Vercel (前端), Fly.io (后端)

## 💻 开发

### 前提条件

1. Node.js 18+ 用于前端
2. Python 3.9+ 用于后端 API
3. Spotify 开发者账号和注册的应用

### 环境设置

在根目录创建 \`.env.local\` 文件:
\`\`\`
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=你的_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
\`\`\`

对于后端，在 \`api\` 目录创建 \`.env\` 文件:
\`\`\`
SPOTIFY_CLIENT_ID=你的_spotify_client_id
SPOTIFY_CLIENT_SECRET=你的_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
\`\`\`

### 本地运行

前端:
\`\`\`bash
# 安装前端依赖
npm install

# 运行前端
npm run dev
\`\`\`

后端:
\`\`\`bash
# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows上: .venv\\Scripts\\activate

# 安装后端依赖
cd api
pip install -r requirements.txt

# 运行后端
uvicorn backend.main:app --reload --port 8080
\`\`\`

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 🚀 部署

### 前端 (Vercel)

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 添加必要的环境变量:
   - \`NEXT_PUBLIC_BACKEND_URL\`: 已部署后端 API 的 URL
   - \`NEXT_PUBLIC_SPOTIFY_CLIENT_ID\`: 您的 Spotify 应用的 client ID
   - \`NEXT_PUBLIC_SPOTIFY_REDIRECT_URI\`: 您已部署应用的回调 URL

### 后端 (Fly.io)

1. 安装 [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. 登录 Fly.io: \`flyctl auth login\`
3. 部署 API:
   \`\`\`bash
   flyctl deploy
   \`\`\`
4. 设置环境密钥:
   \`\`\`bash
   flyctl secrets set SPOTIFY_CLIENT_ID=你的_client_id
   flyctl secrets set SPOTIFY_CLIENT_SECRET=你的_client_secret
   flyctl secrets set SPOTIFY_REDIRECT_URI=https://你的已部署前端.com/callback
   \`\`\`

## 📝 许可证

本项目采用 [MIT 许可](LICENSE)。
`;

  // Write the files if they don't exist
  if (!fs.existsSync(path.join(__dirname, 'README.en.md'))) {
    fs.writeFileSync(path.join(__dirname, 'README.en.md'), englishReadme);
  }
  
  if (!fs.existsSync(path.join(__dirname, 'README.zh.md'))) {
    fs.writeFileSync(path.join(__dirname, 'README.zh.md'), chineseReadme);
  }

  console.log("Language-specific README files prepared.");
};

// Function to create OS-specific READMEs
const createOsReadmes = () => {
  // Check if we already have the required language files
  if (!fs.existsSync(path.join(__dirname, 'README.en.md'))) {
    createLanguageReadmes();
  }

  // macOS README
  const macOsReadme = `# Netify for macOS

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now on macOS</strong></a>
  </p>
</div>

## macOS-Specific Instructions

This version is optimized for macOS ${os.release()}.

### Installation on macOS

\`\`\`bash
# Install dependencies
npm install

# Run the application
npm run dev
\`\`\`

### macOS Keyboard Shortcuts

- **⌘ + R**: Refresh the application
- **⌘ + L**: Focus on the playlist URL input
- **⌘ + Enter**: Submit the transfer request

### Using Spotlight to Open

You can quickly access Netify in your browser using Spotlight:
1. Press **⌘ + Space**
2. Type "netify"
3. Press Enter when your bookmark appears

### Using with Apple Music

If you're migrating from NetEase and also use Apple Music, you can use Netify alongside with these steps:
1. Transfer your playlist to Spotify using Netify
2. Use Spotify to Apple Music transfer tools to complete the migration

## Standard Features

${fs.readFileSync(path.join(__dirname, 'README.en.md'), 'utf8').split('## 🌟 Features')[1].split('<hr/>')[0]}

For more information, visit our [website](https://netify-five.vercel.app/).
`;

  // Windows README
  const windowsReadme = `# Netify for Windows

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now on Windows</strong></a>
  </p>
</div>

## Windows-Specific Instructions

This version is optimized for Windows.

### Installation on Windows

\`\`\`bash
# Install dependencies
npm install

# Run the application
npm run dev
\`\`\`

### Windows Keyboard Shortcuts

- **Ctrl + R**: Refresh the application
- **Ctrl + L**: Focus on the playlist URL input
- **Ctrl + Enter**: Submit the transfer request

### Windows Integration

Netify works seamlessly with Microsoft Edge and Internet Explorer. For the best experience, we recommend using Chrome or Firefox.

### Firewall Settings

If you're having connection issues, please check your Windows Firewall settings and ensure the application has network access.

## Standard Features

${fs.readFileSync(path.join(__dirname, 'README.en.md'), 'utf8').split('## 🌟 Features')[1].split('<hr/>')[0]}

For more information, visit our [website](https://netify-five.vercel.app/).
`;

  // Linux README
  const linuxReadme = `# Netify for Linux

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now on Linux</strong></a>
  </p>
</div>

## Linux-Specific Instructions

This version is optimized for Linux distributions.

### Installation on Linux

\`\`\`bash
# Install dependencies
npm install

# Run the application
npm run dev
\`\`\`

### Linux Terminal Integration

You can create an alias in your shell configuration (.bashrc, .zshrc, etc.) for quick access:

\`\`\`bash
echo 'alias netify="cd /path/to/netify && npm run dev"' >> ~/.bashrc
source ~/.bashrc
\`\`\`

### System Requirements

- Node.js 18+ (install via your distribution's package manager)
- Modern browser like Firefox or Chrome
- Python 3.9+ for the backend API

## Standard Features

${fs.readFileSync(path.join(__dirname, 'README.en.md'), 'utf8').split('## 🌟 Features')[1].split('<hr/>')[0]}

For more information, visit our [website](https://netify-five.vercel.app/).
`;

  // Write the files
  fs.writeFileSync(path.join(__dirname, 'README.macos.md'), macOsReadme);
  fs.writeFileSync(path.join(__dirname, 'README.windows.md'), windowsReadme);
  fs.writeFileSync(path.join(__dirname, 'README.linux.md'), linuxReadme);

  console.log("OS-specific README files prepared.");
};

// Function to detect language
const detectLanguage = (callback) => {
  if (process.platform === 'darwin') {
    // macOS
    exec('defaults read -g AppleLocale', (error, stdout) => {
      if (!error) {
        const systemLanguage = stdout.trim();
        callback(systemLanguage);
      } else {
        // Fallback to LANG environment variable
        const systemLanguage = process.env.LANG || '';
        callback(systemLanguage);
      }
    });
  } else if (process.platform === 'win32') {
    // Windows
    exec('powershell -command "[System.Globalization.CultureInfo]::CurrentUICulture.Name"', (error, stdout) => {
      if (!error) {
        const systemLanguage = stdout.trim();
        callback(systemLanguage);
      } else {
        // Fallback
        const systemLanguage = process.env.LANG || '';
        callback(systemLanguage);
      }
    });
  } else {
    // Linux and others - use LANG environment variable
    const systemLanguage = process.env.LANG || '';
    callback(systemLanguage);
  }
};

// Function to select language README
const selectLanguageReadme = (language) => {
  // Make sure language READMEs exist
  createLanguageReadmes();
  
  const isChinese = language.toLowerCase().includes('zh') || 
                    language.toLowerCase().includes('cn');
  
  const readmePath = isChinese ? 'README.zh.md' : 'README.en.md';
  const content = fs.readFileSync(path.join(__dirname, readmePath), 'utf8');
  
  // Create or update the main README
  fs.writeFileSync(path.join(__dirname, 'README.md'), content);
  
  console.log(`System language detected: ${language}`);
  console.log(`Set README to ${isChinese ? 'Chinese' : 'English'} version.`);

  return isChinese;
};

// Function to select OS README
const selectOsReadme = () => {
  // Make sure OS READMEs exist
  createOsReadmes();
  
  // Detect the operating system
  const platform = os.platform();
  
  let osType = '';
  if (platform === 'darwin') {
    osType = 'macos';
  } else if (platform === 'win32') {
    osType = 'windows';
  } else {
    osType = 'linux';
  }

  // Read the appropriate README
  const readmePath = `README.${osType}.md`;
  const content = fs.readFileSync(path.join(__dirname, readmePath), 'utf8');
  
  // Create or update the main README
  fs.writeFileSync(path.join(__dirname, 'README.md'), content);
  
  console.log(`Operating system detected: ${platform}`);
  console.log(`Set README to ${osType.toUpperCase()} version.`);
};

// Function to generate a combined OS and language specific README
const generateCombinedReadme = (language) => {
  // Make sure all READMEs exist
  createLanguageReadmes();
  createOsReadmes();
  
  // Determine language
  const isChinese = language.toLowerCase().includes('zh') || 
                    language.toLowerCase().includes('cn');
                    
  // Determine OS
  const platform = os.platform();
  let osType = '';
  if (platform === 'darwin') {
    osType = 'macos';
  } else if (platform === 'win32') {
    osType = 'windows';
  } else {
    osType = 'linux';
  }

  // Read the appropriate OS-specific README
  const osReadmePath = `README.${osType}.md`;
  let osContent = fs.readFileSync(path.join(__dirname, osReadmePath), 'utf8');
  
  // If Chinese, translate the OS-specific parts
  if (isChinese) {
    // For MacOS
    if (osType === 'macos') {
      osContent = osContent
        .replace('# Netify for macOS', '# Netify 针对 macOS 的版本')
        .replace('Try it now on macOS', '立即在 macOS 上体验')
        .replace('## macOS-Specific Instructions', '## macOS 专属说明')
        .replace('This version is optimized for macOS', '此版本针对 macOS 进行了优化')
        .replace('### Installation on macOS', '### 在 macOS 上安装')
        .replace('Install dependencies', '安装依赖项')
        .replace('Run the application', '运行应用程序')
        .replace('### macOS Keyboard Shortcuts', '### macOS 键盘快捷键')
        .replace('Refresh the application', '刷新应用程序')
        .replace('Focus on the playlist URL input', '聚焦于歌单 URL 输入框')
        .replace('Submit the transfer request', '提交转移请求')
        .replace('### Using Spotlight to Open', '### 使用 Spotlight 快速打开')
        .replace('You can quickly access Netify in your browser using Spotlight:', '您可以使用 Spotlight 快速在浏览器中访问 Netify:')
        .replace('Type "netify"', '输入 "netify"')
        .replace('Press Enter when your bookmark appears', '当您的书签出现时按回车键')
        .replace('### Using with Apple Music', '### 与 Apple Music 一起使用')
        .replace('If you\'re migrating from NetEase and also use Apple Music, you can use Netify alongside with these steps:', '如果您正在从网易云音乐迁移，并且也使用 Apple Music，您可以通过以下步骤一起使用 Netify:')
        .replace('Transfer your playlist to Spotify using Netify', '使用 Netify 将您的歌单转移到 Spotify')
        .replace('Use Spotify to Apple Music transfer tools to complete the migration', '使用 Spotify 到 Apple Music 的转移工具完成迁移')
        .replace('## Standard Features', '## 标准功能')
        .replace('For more information, visit our', '欲了解更多信息，请访问我们的')
        .replace('website', '网站');
    }
    // For Windows
    else if (osType === 'windows') {
      osContent = osContent
        .replace('# Netify for Windows', '# Netify 针对 Windows 的版本')
        .replace('Try it now on Windows', '立即在 Windows 上体验')
        .replace('## Windows-Specific Instructions', '## Windows 专属说明')
        .replace('This version is optimized for Windows', '此版本针对 Windows 进行了优化')
        .replace('### Installation on Windows', '### 在 Windows 上安装')
        .replace('Install dependencies', '安装依赖项')
        .replace('Run the application', '运行应用程序')
        .replace('### Windows Keyboard Shortcuts', '### Windows 键盘快捷键')
        .replace('Refresh the application', '刷新应用程序')
        .replace('Focus on the playlist URL input', '聚焦于歌单 URL 输入框')
        .replace('Submit the transfer request', '提交转移请求')
        .replace('### Windows Integration', '### Windows 集成')
        .replace('Netify works seamlessly with Microsoft Edge and Internet Explorer. For the best experience, we recommend using Chrome or Firefox.', 'Netify 与 Microsoft Edge 和 Internet Explorer 无缝协作。为获得最佳体验，我们建议使用 Chrome 或 Firefox。')
        .replace('### Firewall Settings', '### 防火墙设置')
        .replace('If you\'re having connection issues, please check your Windows Firewall settings and ensure the application has network access.', '如果您遇到连接问题，请检查您的 Windows 防火墙设置，确保应用程序有网络访问权限。')
        .replace('## Standard Features', '## 标准功能')
        .replace('For more information, visit our', '欲了解更多信息，请访问我们的')
        .replace('website', '网站');
    }
    // For Linux
    else {
      osContent = osContent
        .replace('# Netify for Linux', '# Netify 针对 Linux 的版本')
        .replace('Try it now on Linux', '立即在 Linux 上体验')
        .replace('## Linux-Specific Instructions', '## Linux 专属说明')
        .replace('This version is optimized for Linux distributions', '此版本针对 Linux 发行版进行了优化')
        .replace('### Installation on Linux', '### 在 Linux 上安装')
        .replace('Install dependencies', '安装依赖项')
        .replace('Run the application', '运行应用程序')
        .replace('### Linux Terminal Integration', '### Linux 终端集成')
        .replace('You can create an alias in your shell configuration (.bashrc, .zshrc, etc.) for quick access:', '您可以在 shell 配置文件（.bashrc, .zshrc 等）中创建别名，以便快速访问:')
        .replace('### System Requirements', '### 系统要求')
        .replace('Node.js 18+ (install via your distribution\'s package manager)', 'Node.js 18+（通过您的发行版软件包管理器安装）')
        .replace('Modern browser like Firefox or Chrome', '现代浏览器，如 Firefox 或 Chrome')
        .replace('Python 3.9+ for the backend API', '后端 API 需要 Python 3.9+')
        .replace('## Standard Features', '## 标准功能')
        .replace('For more information, visit our', '欲了解更多信息，请访问我们的')
        .replace('website', '网站');
    }
    
    // Replace English features with Chinese features
    const chineseContent = fs.readFileSync(path.join(__dirname, 'README.zh.md'), 'utf8');
    const chineseFeatures = chineseContent.split('## 🌟 主要功能')[1].split('<hr/>')[0];
    
    osContent = osContent.replace(
      /- \*\*Simple One-Click Process[^]+ report of any songs that couldn't be found/,
      chineseFeatures.trim()
    );
  }
  
  // Create or update the main README
  fs.writeFileSync(path.join(__dirname, 'README.md'), osContent);
  
  console.log(`Operating system detected: ${platform}`);
  console.log(`System language detected: ${language}`);
  console.log(`Set README to ${osType.toUpperCase()} version in ${isChinese ? 'Chinese' : 'English'}.`);
};

// Main function
const main = () => {
  if (languageOnly) {
    // Language-only mode
    detectLanguage((language) => selectLanguageReadme(language));
  } 
  else if (osOnly) {
    // OS-only mode
    selectOsReadme();
  }
  else {
    // Combined mode (default)
    detectLanguage((language) => generateCombinedReadme(language));
  }
};

// Run the script
main(); 
#!/usr/bin/env node

/**
 * A simple Node.js script to detect the system language and open the appropriate README
 * Run with: node language-detector.js
 */

const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create the README files if they don't exist yet
const createReadmeFiles = () => {
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

  // Write the files
  fs.writeFileSync(path.join(__dirname, 'README.en.md'), englishReadme);
  fs.writeFileSync(path.join(__dirname, 'README.zh.md'), chineseReadme);
};

// Function to detect system language and open the appropriate README
const detectLanguageAndOpenReadme = () => {
  // Create README files if they don't exist
  createReadmeFiles();
  
  // Get system language
  let systemLanguage = '';
  
  // Different ways to detect system language based on OS
  if (process.platform === 'darwin') {
    // macOS
    exec('defaults read -g AppleLocale', (error, stdout) => {
      if (!error) {
        systemLanguage = stdout.trim();
        selectReadme(systemLanguage);
      } else {
        // Fallback to LANG environment variable
        systemLanguage = process.env.LANG || '';
        selectReadme(systemLanguage);
      }
    });
  } else if (process.platform === 'win32') {
    // Windows
    exec('powershell -command "[System.Globalization.CultureInfo]::CurrentUICulture.Name"', (error, stdout) => {
      if (!error) {
        systemLanguage = stdout.trim();
        selectReadme(systemLanguage);
      } else {
        // Fallback
        systemLanguage = process.env.LANG || '';
        selectReadme(systemLanguage);
      }
    });
  } else {
    // Linux and others - use LANG environment variable
    systemLanguage = process.env.LANG || '';
    selectReadme(systemLanguage);
  }
};

// Function to select and display the appropriate README
const selectReadme = (language) => {
  const isChinese = language.toLowerCase().includes('zh') || 
                    language.toLowerCase().includes('cn');
  
  const readmePath = isChinese ? 'README.zh.md' : 'README.en.md';
  const content = fs.readFileSync(path.join(__dirname, readmePath), 'utf8');
  
  // Create or update the main README
  fs.writeFileSync(path.join(__dirname, 'README.md'), content);
  
  console.log(`System language detected: ${language}`);
  console.log(`Displaying ${isChinese ? 'Chinese' : 'English'} README`);
};

// Run the script
detectLanguageAndOpenReadme(); 
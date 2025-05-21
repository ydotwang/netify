# Netify: 网易云音乐歌单迁移至Spotify工具 🎧

> 简体中文 | [English](README.md)

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 立即体验</strong></a>
  </p>
</div>

<hr/>

## 🌟 特点

- **一键式流程**：只需用Spotify登录，粘贴网易云歌单链接，点击转移即可
- **完整歌单导入**：转移整个歌单，包括歌曲、名称和封面
- **智能匹配**：先进的算法在Spotify上找到最佳匹配
- **大型歌单支持**：可处理多达10,000首歌曲
- **进度追踪**：查看音乐传输的详细进度
- **缺失歌曲报告**：获取无法找到的歌曲的详细报告

<hr/>

## 📱 演示

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="screenshot-home.png" width="400px" alt="主页面"/>
        <br/>
        <em>主页面</em>
      </td>
      <td align="center">
        <img src="screenshot-transfer.png" width="400px" alt="转移流程"/>
        <br/>
        <em>转移流程</em>
      </td>
    </tr>
  </table>
</div>


## 🔍 使用指南

1. 访问 [Netify 网页应用](https://netify-five.vercel.app/)，点击 **Log in with Spotify** 按钮
2. 授权应用程序（需要 Spotify 账号注册邮箱）
3. 复制网易云音乐歌单分享链接，例如：
   ```
   https://y.music.163.com/m/playlist?id=123456
   ```
4. 将链接粘贴到输入框中，点击 **Transfer to Spotify** 按钮
5. 等待处理完成 - 您将看到进度条
6. 完成后，点击"Open playlist in Spotify"查看您的新歌单

<hr/>

## 🛠️ 技术栈

- **前端**：Next.js 14, Tailwind CSS, React
- **后端**：FastAPI (Python)，部署在Fly.io
- **API**：Spotify Web API, 网易云音乐API
- **部署**：Vercel (前端), Fly.io (后端)

## 💻 开发指南

### 前提条件

1. Node.js 18+ 用于前端
2. Python 3.9+ 用于后端API
3. Spotify开发者账户和注册应用

### 环境设置

在根目录创建 `.env.local` 文件：
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

对于后端，在 `api` 目录中创建 `.env` 文件：
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

### 本地运行

前端：
```bash
# 安装前端依赖
npm install

# 运行前端
npm run dev
```

后端：
```bash
# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # 在Windows上: .venv\Scripts\activate

# 安装后端依赖
cd api
pip install -r requirements.txt

# 运行后端
uvicorn backend.main:app --reload --port 8080
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 🚀 部署

### 前端 (Vercel)

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 添加必要的环境变量：
   - `NEXT_PUBLIC_BACKEND_URL`：已部署后端API的URL
   - `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`：您的Spotify应用程序的客户端ID
   - `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`：您已部署应用程序的回调URL

### 后端 (Fly.io)

1. 安装 [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. 登录Fly.io: `flyctl auth login`
3. 部署API：
   ```bash
   flyctl deploy
   ```
4. 设置环境密钥：
   ```bash
   flyctl secrets set SPOTIFY_CLIENT_ID=your_client_id
   flyctl secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
   flyctl secrets set SPOTIFY_REDIRECT_URI=https://your-deployed-frontend.com/callback
   ```

## 📝 许可证

本项目采用 [MIT 许可证](LICENSE)。 
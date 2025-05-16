# Netify – Transfer NetEase Cloud Music playlists to Spotify 🎧 网易云歌单转Spotify

<p align="center">
  <img src="public/netify.jpg" alt="Netify logo" width="200" />
</p>

Netify is a Next.js 14 + Tailwind + FastAPI application that lets you log in with Spotify and import any public NetEase Cloud Music playlist—tracks, name and cover art—with a single click.  
Simply paste the NetEase share-link, hit **Transfer to Spotify**, and Netify creates a new private playlist in your account (up to 10 000 tracks) while showing progress and missing songs.

Netify 是一个基于 Next.js 14、Tailwind 和 FastAPI 的应用程序，支持使用 Spotify 登录，并可一键导入任意公开的网易云音乐歌单——包括歌曲、名称和封面。
你只需粘贴网易云的分享链接，点击 Transfer to Spotify（转移到 Spotify），Netify 就会在你的账号中创建一个新的私人歌单（最多支持 10,000 首歌曲），并显示导入进度及缺失的歌曲。
---

## Live demo

👉 https://netify-five.vercel.app/

### How to use (English)
1. Open the live demo link above and click **Log in with Spotify**.
2. Authorise Netify – the callback will return you to the site.
3. Copy a NetEase playlist link, e.g. `https://y.music.163.com/m/playlist?id=123456`.
4. Paste it into the input box and press **Transfer to Spotify**.
5. Wait until the progress bar reaches 100 %; a link to the new playlist will appear.

### 使用指南 (中文)
1. 访问上面的演示地址，点击 **Log in with Spotify** 并授权。
2. 授权成功后返回网站。
3. 复制网易云歌单分享链接，例如 `https://y.music.163.com/m/playlist?id=123456`。
4. 粘贴到输入框，点击 **Transfer to Spotify**（转到 Spotify）。
5. 等待进度条完成，页面会显示新的 Spotify 歌单链接。

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

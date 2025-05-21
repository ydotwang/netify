#!/usr/bin/env node

/**
 * A script to show OS-specific README based on user's platform
 * Run with: node os-specific-readme.js
 */

const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Generate OS-specific READMEs if they don't exist
const createOsSpecificReadmes = () => {
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

  console.log("OS-specific README files created successfully!");
};

// Function to detect OS and display the appropriate README
const detectOsAndShowReadme = () => {
  // Create README files if they don't exist
  createOsSpecificReadmes();
  
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
  console.log(`Displaying ${osType.toUpperCase()} README`);
};

// Run the script
detectOsAndShowReadme(); 
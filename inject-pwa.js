/**
 * PWA 标签批量注入脚本
 * 扫描 tools/ 下所有 .html 文件，注入 PWA 所需的 meta 标签和脚本引用
 * 运行方式：node inject-pwa.js
 * NOTE: 此脚本为一次性工具，运行后可删除
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, 'tools');

// 需要注入到 <head> 中的 PWA 标签（放在 </head> 之前）
const PWA_HEAD_TAGS = `    <!-- PWA 支持 -->
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="/icon.png">
    <meta name="theme-color" content="#000000">`;

// 需要注入到 </body> 前的注册脚本
const PWA_REGISTER_SCRIPT = `    <!-- PWA 注册 -->
    <script src="../../assets/js/pwa-register.js"></script>`;

let processedCount = 0;
let skippedCount = 0;
let errorCount = 0;

/**
 * 递归获取目录下所有 .html 文件
 */
function getHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 node_modules
      if (entry.name === 'node_modules') continue;
      results.push(...getHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * 处理单个 HTML 文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 幂等检查：如果已包含 manifest 引用则跳过
  if (content.includes('manifest.json')) {
    skippedCount++;
    return;
  }

  // 1. 修改 viewport 标签添加缩放限制
  content = content.replace(
    /(<meta\s+name="viewport"\s+content="[^"]*?)(")/i,
    (match, prefix, suffix) => {
      // 如果已经包含 user-scalable 则不重复添加
      if (prefix.includes('user-scalable')) return match;
      return `${prefix}, maximum-scale=1.0, user-scalable=no${suffix}`;
    }
  );

  // 2. 在 </head> 前注入 PWA head 标签
  content = content.replace(
    '</head>',
    `${PWA_HEAD_TAGS}\n</head>`
  );

  // 3. 在 </body> 前注入注册脚本
  content = content.replace(
    '</body>',
    `${PWA_REGISTER_SCRIPT}\n</body>`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  processedCount++;
}

// 执行
console.log('开始批量注入 PWA 标签...');
console.log(`扫描目录: ${TOOLS_DIR}\n`);

const htmlFiles = getHtmlFiles(TOOLS_DIR);
console.log(`找到 ${htmlFiles.length} 个 HTML 文件\n`);

for (const file of htmlFiles) {
  try {
    processFile(file);
  } catch (err) {
    console.error(`[错误] ${file}: ${err.message}`);
    errorCount++;
  }
}

console.log(`\n===== 注入完成 =====`);
console.log(`成功注入: ${processedCount} 个文件`);
console.log(`已跳过（已存在）: ${skippedCount} 个文件`);
console.log(`错误: ${errorCount} 个文件`);
console.log(`总计: ${htmlFiles.length} 个文件`);

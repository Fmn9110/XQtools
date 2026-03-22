# XQtools

XQtools 是一个功能丰富的纯前端在线工具合集，旨在为用户提供便捷、高效的日常工具箱。该项目包含了众多实用工具，无需后端即可在浏览器中运行。

## 功能特性

本项目涵盖了多个类别的在线工具，主要包括（但不限于）：

* **文本处理工具**（Text Tools）：JSON/XML 格式化、URL 编解码、正则表达式测试、文字统计、摘要生成等。
* **学习与效率工具**（Study & Productivity Tools）：专注时钟（番茄钟）、背单词工具、学习打卡、思维导图、白噪音、阅读速度测试等。
* **图像与多媒体工具**（Image Tools）：各类图片处理与转换工具。
* **开发与站长工具**（Developer & Webmaster Tools）：哈希计算（MD5, SHA256）、密码生成、Base64 编码、CSS/JS 格式化工具。

## 技术栈

* HTML5
* CSS3 (涵盖了原生 CSS 及部分 TailwindCSS 等样式)
* Vanilla JavaScript (原生 JavaScript 进行 DOM 操作与逻辑处理)

## 如何使用

本项目为纯前端静态页面，无需配置复杂的运行环境。有两种使用方式：

1. **直接打开**：下载项目后，直接双击 `index.html` 在浏览器中运行。
2. **本地服务器调试**：通过任意本地静态文件服务器进行预览（例如 Live Server，或者 Python 的 `python -m http.server`），以获得最佳体验（部分功能可能依赖 `file://` 跨域限制，建议使用 HTTP 环境）。

## 目录结构说明

- `tools/text/` - 文本与字符串处理相关工具
- `tools/study/` - 学习效率类工具集
- `assets/` - 项目依赖的公共 CSS 样式、JavaScript 脚本、图片及字体等资源

## 贡献

欢迎提交 Issue 和 Pull Request，共同完善这个工具箱！

## 许可

本项目源代码遵循 MIT 许可证。

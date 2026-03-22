const fs = require('fs');
const path = require('path');

// 读取 data.js 的内容并抓取工具列表
const dataContent = fs.readFileSync('assets/js/data.js', 'utf8');
const toolMatches = [...dataContent.matchAll(/\[(\d+),\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)];

const template = (name, desc, slug, cat) => {
    return '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '    <meta charset="UTF-8">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '    <title>' + name + ' - 小Q工具箱</title>\n' +
    '    <script src="https://cdn.tailwindcss.com"></script>\n' +
    '    <link rel="stylesheet" href="../../assets/css/main.css">\n' +
    '    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">\n' +
    '</head>\n' +
    '<body class="bg-[#fff5f7]">\n' +
    '    <nav class="sticky top-0 z-50 py-4 px-6 mb-8 bg-white/80 backdrop-blur-md border-b border-pink-50">\n' +
    '        <div class="container mx-auto flex justify-between items-center">\n' +
    '            <div class="flex items-center space-x-2 cursor-pointer" onclick="location.href=\'../../index.html\'">\n' +
    '                <div class="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">Q</div>\n' +
    '                <span class="text-2xl font-bold gradient-text">小Q工具箱</span>\n' +
    '            </div>\n' +
    '            <a href="../../tools.html" class="text-gray-500 hover:text-pink-500 font-semibold text-sm transition-colors">返回列表</a>\n' +
    '        </div>\n' +
    '    </nav>\n' +
    '\n' +
    '    <main class="container mx-auto py-8 px-4 max-w-4xl">\n' +
    '        <header class="text-center mb-12">\n' +
    '            <h1 class="text-4xl font-extrabold text-gray-800 mb-4">' + name + '</h1>\n' +
    '            <p class="text-gray-500">' + desc + '</p>\n' +
    '        </header>\n' +
    '\n' +
    '        <section class="cute-card p-8 mb-12 bg-white min-h-[400px] flex flex-col items-center justify-center">\n' +
    '            <div id="app-container" class="w-full text-center">\n' +
    '                <div class="p-12 border-4 border-dashed border-pink-100 rounded-3xl mb-8 group hover:border-pink-300 transition-colors">\n' +
    '                    <p class="text-gray-400 italic mb-4">正在为 ' + name + ' 填充交互功能...</p>\n' +
    '                    <div class="animate-spin inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full"></div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </section>\n' +
    '\n' +
    '        <div class="grid md:grid-cols-2 gap-8 mb-12">\n' +
    '            <section>\n' +
    '                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">\n' +
    '                    <span class="w-8 h-8 bg-pink-100 text-pink-500 rounded-lg flex items-center justify-center mr-3 text-lg font-bold">!</span>\n' +
    '                    使用说明\n' +
    '                </h2>\n' +
    '                <div class="bg-white rounded-2xl p-6 shadow-sm border border-pink-50">\n' +
    '                    <ul class="space-y-4 text-gray-600 list-disc list-inside">\n' +
    '                        <li>点击上传区域选择文件。</li>\n' +
    '                        <li>在工具区调整您需要的参数。</li>\n' +
    '                        <li>确认无误后点击“执行”或“下载”。</li>\n' +
    '                    </ul>\n' +
    '                </div>\n' +
    '            </section>\n' +
    '\n' +
    '            <section>\n' +
    '                <h2 class="text-2xl font-bold text-gray-800 mb-6">常见问题</h2>\n' +
    '                <div class="space-y-4">\n' +
    '                    <div class="bg-white p-4 rounded-xl border border-pink-50">\n' +
    '                        <div class="font-bold text-gray-700 mb-1">隐私性如何？</div>\n' +
    '                        <div class="text-gray-500 text-sm">所有操作均为本地处理，不经过任何服务器。</div>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </section>\n' +
    '        </div>\n' +
    '    </main>\n' +
    '\n' +
    '    <footer class="py-12 text-center text-gray-300 text-xs">\n' +
    '        © 2026 小Q工具箱 · 纯前端离线实验室\n' +
    '    </footer>\n' +
    '\n' +
    '    <script src="../../assets/js/utils.js"></script>\n' +
    '</body>\n' +
    '</html>';
};

toolMatches.forEach(match => {
    const [_, id, name, cat, slug, desc] = match;
    const dir = path.join('tools', cat);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, slug + '.html');
    if (!fs.existsSync(dest)) {
        fs.writeFileSync(dest, template(name, desc, slug, cat));
    }
});

console.log('Successfully generated ' + toolMatches.length + ' tools.');

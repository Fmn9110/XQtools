/**
 * 通用工具函数
 */
const Utils = {
    /**
     * 生成并下载文件
     */
    downloadFile(content, fileName, contentType) {
        let file;
        if (typeof content === 'string' && content.startsWith('data:')) {
            const arr = content.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            file = new Blob([u8arr], {type: mime});
        } else if (typeof content === 'string' && content.startsWith('blob:')) {
            // NOTE: 兼容调用方传入 blob URL 字符串的场景，直接使用该 URL 下载
            const a = document.createElement("a");
            a.href = content;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(content);
            }, 100);
            return;
        } else if (content instanceof Blob) {
            file = content;
        } else {
            file = new Blob([content], { type: contentType });
        }
        const a = document.createElement("a");
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * 格式化文件大小
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 简单的 Toast 提示
     */
    toast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `px-6 py-3 rounded-full shadow-lg transition-all duration-300 pointer-events-auto bg-white border-2 flex items-center animate-fade-in`;
        
        // 根据类型设置颜色
        const colors = {
            info: '#ffc3a0',    // 橙粉
            success: '#4ade80', // 绿色
            error: '#ff758c',   // 深粉
            warning: '#fbbf24'  // 黄色
        };
        const icons = {
            info: '💡',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        toast.style.borderColor = colors[type] || colors.info;
        toast.innerHTML = `<span class="mr-2">${icons[type] || icons.info}</span><span class="font-bold text-gray-700">${message}</span>`;
        
        container.appendChild(toast);

        // 3秒后开始消失动画
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
                if (container.childNodes.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3000);
    },

    /**
     * 读取文件并返回 DataURL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    /**
     * 格式化日期
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    /**
     * 搜索工具核心逻辑
     * @param {string} query 搜索关键词
     * @param {Array} data 工具数据源
     * @returns {Array} 排序后的搜索结果
     */
    searchTools(query, data) {
        if (!query) return [];
        const q = query.toLowerCase().trim();
        const results = data.map(tool => {
            let score = 0;
            const name = tool.name.toLowerCase();
            const desc = tool.desc.toLowerCase();
            
            // 1. 名称完全匹配
            if (name === q) score += 100;
            // 2. 名称开头匹配
            else if (name.startsWith(q)) score += 80;
            // 3. 名称包含匹配
            else if (name.includes(q)) score += 60;
            
            // 4. 拼音匹配 (使用 PinyinMatch 库)
            if (window.PinyinMatch && window.PinyinMatch.match(tool.name, query)) {
                score += 50;
            }
            
            // 5. 描述包含匹配
            if (desc.includes(q)) score += 20;
            
            return { ...tool, score };
        });

        return results
            .filter(t => t.score > 0)
            .sort((a, b) => b.score - a.score || a.name.length - b.name.length);
    },

    /**
     * 初始化导航栏搜索逻辑
     */
    initNavSearch(inputId, btnId, resultsId, onSearch) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        let results = document.getElementById(resultsId);
        
        if (!input || !btn) return;

        // 如果没有传入 resultsId，尝试在父容器找或者创建一个
        if (!results) {
            results = document.createElement('div');
            results.className = 'nav-search-results hidden';
            input.parentNode.appendChild(results);
        }

        const handleSearch = (val) => {
            if (!val) {
                results.classList.add('hidden');
                if (onSearch) onSearch(val, results, []);
                return;
            }
            
            const filtered = this.searchTools(val, window.toolsData || []);
            
            // 始终显示下拉预览逻辑
            if (filtered.length > 0) {
                results.innerHTML = filtered.slice(0, 8).map(t => `
                    <div class="nav-search-item" onclick="location.href='${this.getToolPath(t)}'">
                        <span class="nav-search-icon">${t.icon || '🔧'}</span>
                        <div class="nav-search-info">
                            <div class="nav-search-name">${t.name}</div>
                            <div class="nav-search-desc">${t.desc}</div>
                        </div>
                    </div>
                `).join('');
                results.classList.remove('hidden');
            } else {
                results.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">未找到相关工具</div>';
                results.classList.remove('hidden');
            }

            // 如果有自定义回调，则执行（用于页面内容的联动过滤）
            if (onSearch) {
                onSearch(val, results, filtered);
            }
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = input.classList.contains('active');
            if (!isActive) {
                input.classList.add('active');
                input.focus();
            } else {
                if (!input.value.trim()) {
                    input.classList.remove('active');
                    results.classList.add('hidden');
                } else {
                    handleSearch(input.value.trim());
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                const filtered = this.searchTools(val, window.toolsData || []);
                if (filtered.length > 0) {
                    location.href = this.getToolPath(filtered[0]);
                }
            }
            if (e.key === 'Escape') {
                input.classList.remove('active');
                results.classList.add('hidden');
                input.blur();
            }
        });

        input.addEventListener('input', (e) => {
            handleSearch(e.target.value.trim());
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !btn.contains(e.target)) {
                if (results && !results.contains(e.target)) {
                    if (!input.value.trim()) {
                        input.classList.remove('active');
                    }
                    results.classList.add('hidden');
                }
            }
        });
    },

    /**
     * 获取工具的正确路径
     */
    getToolPath(tool) {
        const isSubPage = window.location.pathname.includes('/tools/') || window.location.pathname.includes('/categories.html');
        const prefix = isSubPage ? '' : ''; // 逻辑需要根据当前位置判断
        
        // 简单粗暴点：根据当前页面是否有 index.html 链接判断
        const isAtRoot = document.querySelector('a[href="index.html"]') !== null || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
        
        if (isAtRoot) {
            return `tools/${tool.category}/${tool.slug}.html`;
        } else {
            // 如果在子目录，代码逻辑可能需要更复杂或者工具路径统一使用绝对路径/相对于根路径
            // 这里假设所有工具路径都是相对根目录的，我们可以通过计算 ../ 的数量来修正
            const depth = window.location.pathname.split('/').filter(p => p).length;
            // 如果在 /tools/category/tool.html 深度是 3
            // 如果在 /index.html 深度是 1
            // 注意：这取决于部署环境，本地路径 c:\Users\... 深度很大
            
            // 更实用的方法：检测当前页面是否在 tools 目录下
            if (window.location.pathname.includes('/tools/')) {
                return `../../tools/${tool.category}/${tool.slug}.html`;
            } else if (window.location.pathname.includes('categories.html') || window.location.pathname.includes('tools.html')) {
                return `tools/${tool.category}/${tool.slug}.html`;
            }
            return `tools/${tool.category}/${tool.slug}.html`;
        }
    }
};

window.Utils = Utils;

// --- 自动加载 Parallax 视差集成 (方案 B) ---
(function() {
    // 确保在主页面和工具页面都能正确找到 assets 路径
    const scripts = document.getElementsByTagName('script');
    let utilsPath = '';
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src && src.indexOf('utils.js') !== -1) {
            utilsPath = src;
            break;
        }
    }
    
    // 从 utils.js 的路径推导 assets 根目录
    // 例如: .../assets/js/utils.js -> .../assets/
    const assetsPath = utilsPath.replace('js/utils.js', '');

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    };

    // 顺序加载：先库后逻辑
    // Parallax.js CDN
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/parallax/3.1.0/parallax.min.js')
        .then(() => {
            // Global Parallax 逻辑 (本地路径)
            return loadScript(assetsPath + 'js/global-parallax.js');
        })
        .catch(err => {
            console.warn('[Parallax Load Error]', err);
        });
})();

// ===== 全局拖拽文件上传拦截与代理 =====
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('fileInput');

    if (uploadArea && fileInput) {
        // 当文件被拖入区域
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#f472b6';
            uploadArea.style.backgroundColor = '#fdf2f8';
            uploadArea.style.transform = 'scale(1.02)';
        });

        // 当文件被拖出区域
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.backgroundColor = '';
            uploadArea.style.transform = '';
        });

        // 当文件松手放下
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            // 恢复 UI 样式
            uploadArea.style.borderColor = '';
            uploadArea.style.backgroundColor = '';
            uploadArea.style.transform = '';
            
            // 劫持文件并强行塞入底层的 file input 中，随后模拟一次真实的点击变动事件
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        });
    }
});

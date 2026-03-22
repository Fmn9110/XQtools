/**
 * Global Parallax Integration for "小Q工具箱"
 * Handles dynamic scene injection, iOS permissions, and mobile/desktop adaptation.
 */
(function() {
    let parallaxInstance = null;
    let sceneBuffer = null;

    // --- 配置项 ---
    const CONFIG = {
        enabled: true,
        layers: [
            { emoji: '💖', depth: 0.1, top: '10%', left: '5%', size: '1.5rem', opacity: 0.4 },
            { emoji: '✨', depth: 0.2, top: '20%', right: '10%', size: '1.2rem', opacity: 0.5 },
            { emoji: '🍬', depth: 0.4, top: '60%', left: '8%', size: '2rem', opacity: 0.3 },
            { emoji: '☁️', depth: 0.15, bottom: '15%', right: '15%', size: '2.5rem', opacity: 0.2 },
            { emoji: '🌟', depth: 0.3, top: '40%', right: '5%', size: '1.8rem', opacity: 0.4 },
            { emoji: '🎈', depth: 0.5, bottom: '25%', left: '12%', size: '1.4rem', opacity: 0.4 }
        ],
        mobileMinSize: 768
    };

    /**
     * 检测是否为移动端
     */
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= CONFIG.mobileMinSize;
    };

    /**
     * 创建并注入视差场景容器
     */
    const injectParallaxScene = () => {
        if (document.getElementById('global-parallax-scene')) return;
        if (!document.body) {
            console.warn('[Parallax] document.body 不可用，无法注入场景');
            return null;
        }

        const scene = document.createElement('div');
        scene.id = 'global-parallax-scene';
        // 设置为 fixed 铺满底层，不阻碍点击
        Object.assign(scene.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '-1',
            pointerEvents: 'none',
            overflow: 'hidden'
        });

        CONFIG.layers.forEach((layerData, index) => {
            const layer = document.createElement('div');
            layer.setAttribute('data-depth', layerData.depth);
            Object.assign(layer.style, {
                position: 'absolute',
                width: '100%',
                height: '100%'
            });

            const element = document.createElement('div');
            element.textContent = layerData.emoji;
            Object.assign(element.style, {
                position: 'absolute',
                top: layerData.top || 'auto',
                bottom: layerData.bottom || 'auto',
                left: layerData.left || 'auto',
                right: layerData.right || 'auto',
                fontSize: layerData.size,
                opacity: layerData.opacity,
                filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.05))',
                userSelect: 'none'
            });

            layer.appendChild(element);
            scene.appendChild(layer);
        });

        document.body.prepend(scene);
        sceneBuffer = scene;
        return scene;
    };

    /**
     * 初始化 Parallax.js 实效
     */
    const initParallax = () => {
        if (!window.Parallax || parallaxInstance) return;

        const scene = injectParallaxScene();
        if (!scene) return;

        // NOTE: 判空保护，防止 document.body 不可用
        if (!document.body) return;

        parallaxInstance = new Parallax(scene, {
            relativeInput: !isMobile(), // 移动端禁用触摸输入，仅依赖陀螺仪，防止干扰滚动
            clipRelativeInput: false,
            hoverOnly: !isMobile(), // 电脑端仅鼠标悬停触发
            pointerEvents: !isMobile(), // 关键修复：禁止 Parallax.js 在移动端绑定 touchmove 并调用 preventDefault
            inputElement: document.body,
            scalarX: isMobile() ? 5 : 10,
            scalarY: isMobile() ? 5 : 10,
            frictionX: 0.1,
            frictionY: 0.1
        });

        console.log('[Parallax] Initialized successfully.');
    };

    /**
     * 处理 iOS 权限授权
     */
    const handleIOSPermission = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ 需要点击授权
            const requestPermission = () => {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            initParallax();
                            // 授权成功后移除全局监听
                            document.removeEventListener('click', requestPermission);
                            document.removeEventListener('touchstart', requestPermission);
                        }
                    })
                    .catch(console.error);
            };

            document.addEventListener('click', requestPermission, { once: true });
            document.addEventListener('touchstart', requestPermission, { once: true });
            
            console.log('[Parallax] iOS permission request pending on first interaction.');
        } else {
            // 非 iOS 13+ 或不支持 requestPermission 的环境直接初始化
            initParallax();
        }
    };

    /**
     * 性能优化：页面隐藏时暂停，可见时恢复，并针对电量/性能进行判断
     */
    const setupPerformanceOptimization = () => {
        if (!parallaxInstance) return;

        // 使用交互观察器
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    parallaxInstance.enable();
                } else {
                    parallaxInstance.disable();
                }
            });
        }, { threshold: 0.1 });

        if (sceneBuffer) observer.observe(sceneBuffer);

        // 监听页面可见性 API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                parallaxInstance.disable();
            } else {
                parallaxInstance.enable();
            }
        });
    };

    // 页面 DOM 加载完成后开始初始化流程
    window.addEventListener('DOMContentLoaded', () => {
        try {
            if (isMobile()) {
                handleIOSPermission();
            } else {
                initParallax();
            }
            
            setupPerformanceOptimization();
        } catch (error) {
            console.error('[Parallax] 初始化失败:', error);
        }
    });

    // 销毁实例防止内存泄漏
    window.addEventListener('beforeunload', () => {
        if (parallaxInstance) {
            parallaxInstance.destroy();
            parallaxInstance = null;
        }
    });

})();

/**
 * PWA Service Worker 全局注册脚本
 * 在所有页面中引用此脚本，统一注册 Service Worker
 * NOTE: 使用 IIFE + try-catch 完全隔离，确保不受其他脚本报错影响
 * 使用绝对路径 /sw.js 确保任何层级的页面都能正确注册
 */
(function () {
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('DOMContentLoaded', function () {
        navigator.serviceWorker.register('/sw.js')
          .then(function (registration) {
            console.log('[PWA] Service Worker 注册成功，作用域:', registration.scope);
          })
          .catch(function (error) {
            console.warn('[PWA] Service Worker 注册失败:', error);
          });
      });
    }
  } catch (error) {
    console.warn('[PWA] 注册脚本执行异常:', error);
  }
})();

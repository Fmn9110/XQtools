/**
 * Service Worker - XQ工具箱
 * 采用 Cache-First 策略，优先从缓存返回资源以提升加载速度
 * 缓存未命中时走网络请求并将结果写入缓存
 */

const CACHE_NAME = 'xq-toolbox-v1';

// NOTE: 预缓存的核心资源列表，确保离线时主页面可用
const PRE_CACHE_URLS = [
  '/index.html',
  '/categories.html',
  '/tools.html',
  '/assets/css/main.css',
  '/assets/js/data.js',
  '/assets/js/utils.js',
  '/assets/js/pwa-register.js',
  '/icon.png',
  '/manifest.json'
];

// install 事件：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS);
    })
  );
  // 跳过等待，立即激活新版本
  self.skipWaiting();
});

// activate 事件：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 立即控制所有客户端页面
  self.clients.claim();
});

// fetch 事件：Cache-First 策略
self.addEventListener('fetch', (event) => {
  // 仅处理 GET 请求
  if (event.request.method !== 'GET') return;

  // 跳过 CDN 和外部资源的缓存（如 tailwindcss、Google Fonts 等）
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // 仅缓存成功的响应
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

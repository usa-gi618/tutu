// 항상 최신 파일로: GitHub Pages는 파일을 10분 동안 캐시해서, 새로 올려도 예전 화면이 보인다.
// 이 서비스 워커는 앱 파일을 받을 때마다 서버에 "바뀌었는지" 확인한다 (안 바뀌었으면 304로 금방 끝남).
// 오프라인 저장은 하지 않는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/__livereload')) return;
  // 페이지 이동 요청은 옵션을 덧붙여 다시 만들 수 없어서 주소로 받는다
  e.respondWith(req.mode === 'navigate'
    ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    : fetch(req, { cache: 'no-cache' }));
});

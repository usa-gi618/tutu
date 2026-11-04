// 상태바(시계·배터리) 뒤 색. 홈 화면 앱에서 iOS는 theme-color로 상태바 뒤를 칠한다.
// 화면 맨 위 색과 맞춰서 앱 배경(노란 그라데이션 등)이 상태바 밑까지 이어져 보이게 한다.
const TOP = {
  onboarding: '#ffffff',
  home: '#ffffe2',
  quickcheck: '#ffffe2',
  result: '#ffffe2',
  library: '#ffffe2',
  lecture: '#fefee1',
  player: '#f1f1f1',
  review: '#f5f5f5',
  teacher: '#ffffff',
};
const meta = document.querySelector('meta[name="theme-color"]');

export function setTopColor(color) {
  meta.setAttribute('content', color);
  document.documentElement.style.background = color; // 브라우저에서 화면 위로 끌어당겼을 때도 같은 색
}
export const topColorOf = (screen) => TOP[screen] ?? '#ffffff';

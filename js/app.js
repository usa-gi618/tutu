// 화면 전환 담당: go('home') 처럼 이름으로 이동한다.
// 각 화면 모듈은 { render(): html, mount(el, go): cleanup? } 형태.
import onboarding from '../screens/onboarding/onboarding.js';
import home from '../screens/home/home.js';
import quickcheck from '../screens/quickcheck/quickcheck.js';
import result from '../screens/result/result.js';
import library from '../screens/library/library.js';
import lecture from '../screens/lecture/lecture.js';
import player from '../screens/player/player.js';
import review from '../screens/review/review.js';
import teacher from '../screens/teacher/teacher.js';
import { setTopColor, topColorOf } from './theme.js';

const screens = { onboarding, home, quickcheck, result, library, lecture, player, review, teacher };
const stage = document.getElementById('stage');
const DURATION = 380;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
let current = null; // { el, cleanup }

// 전환 방식
//   push: 새 화면이 오른쪽에서 밀려 들어옴 (앞으로 가기, 기본값)
//   pop : 이전 화면이 오른쪽으로 빠지며 뒤 화면이 드러남 (뒤로 가기)
//   fade: 새 화면이 서서히 나타남
const TRANSITIONS = {
  push: { under: 'prev', prev: ['none', 'translateX(-30%)'], next: ['translateX(100%)', 'none'] },
  pop: { under: 'next', prev: ['none', 'translateX(100%)'], next: ['translateX(-30%)', 'none'] },
  fade: { under: 'prev', prev: null, next: null },
};

function go(name, { transition = 'push' } = {}) {
  const screen = screens[name];
  const el = document.createElement('section');
  el.className = `screen screen-${name}`;
  el.innerHTML = screen.render();
  setTopColor(topColorOf(name));

  const prev = current;
  const t = TRANSITIONS[transition];
  if (prev && t.under === 'next') stage.insertBefore(el, prev.el);
  else stage.append(el);
  current = { el, cleanup: screen.mount?.(el, go) };

  if (!prev) return;
  stage.classList.add('busy');
  const opts = { duration: DURATION, easing: EASING };
  const anims = transition === 'fade'
    ? [el.animate([{ opacity: 0 }, { opacity: 1 }], opts)]
    : [
        prev.el.animate(t.prev.map((transform) => ({ transform })), opts),
        el.animate(t.next.map((transform) => ({ transform })), opts),
      ];
  Promise.all(anims.map((a) => a.finished)).then(() => {
    prev.cleanup?.();
    prev.el.remove();
    stage.classList.remove('busy');
  });
}

// 개발용: 주소 끝에 #home, #player 처럼 붙이면 그 화면에서 바로 시작
const start = location.hash.slice(1);
go(screens[start] ? start : 'onboarding');

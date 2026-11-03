// Figma 11565:3790 (Up next), 카드 11565:4239
// 과목 카드가 둥근 드럼 위에 세워져 있다. 위아래 드래그로 무한 회전.
// 카드를 탭하면 선택: 초록색으로 위로 뽑히고, 나머지는 아래로 밀리며 흐려진다.
// 같은 카드를 다시 탭하거나, 빈 곳을 탭하거나, 드래그하면 선택 해제(모두 회색).
import { TODAY } from '../../data/lectures.js';

const DAYS = [
  { num: 19, dow: 'Mon', state: 'done', numX: 20, dowX: 17 },
  { num: 20, dow: 'Tue', state: 'done', numX: 19, dowX: 19 },
  { num: 20, dow: 'Wed', state: 'done', numX: 21, dowX: 17 },
  { num: 21, dow: 'Thu', state: 'today', numX: 21, dowX: 19 },
  { num: 22, dow: 'Fri', state: '', numX: 21, dowX: 23 },
  { num: 23, dow: 'Sat', state: '', numX: 21, dowX: 21 },
];

// 드럼: 카드가 반지름 R인 원호를 따라 지나간다. 카드는 눕지 않고 똑바로 선 채,
// 위(뒤)로 갈수록 작아지고 간격이 좁아져 원근감이 생긴다.
// 0번 칸(맨 위, 가장 뒤)이 -60°, 칸마다 20°씩 앞으로 내려온다. 0° = 맨 앞.
const R = 483;
const FIRST_DEG = -60;
const STEP_DEG = 20;
const TOP_Y = 262;       // 0번 칸 카드 윗변 y
const DEPTH = 0.36;      // 가장 뒤 카드가 줄어드는 정도
const PX_PER_SLOT = 130; // 이만큼 드래그하면 한 칸 이동
const TAP_SLOP = 8;

const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// q: 칸 위치(실수). -0.5 ~ n-0.5 범위
function slotStyle(q, n) {
  const deg = FIRST_DEG + q * STEP_DEG;
  const y = TOP_Y + R * (Math.sin(rad(deg)) - Math.sin(rad(FIRST_DEG)));
  const scale = 1 - DEPTH * (1 - Math.cos(rad(deg)));

  let opacity = 1;
  if (q < 0) opacity = (q + 0.5) / 0.5;
  else if (q > n - 1) opacity = 1 - (q - (n - 1)) / 0.5;

  return { y, scale, opacity: Math.max(0, Math.min(1, opacity)) };
}

export default {
  render() {
    return `
      <div class="deck"></div>

      <div class="abs cy heading">Up next</div>
      <div class="abs cy summary"><b>${TODAY.length} lectures left </b>to watch today</div>
      <button class="library-btn" type="button" aria-label="Library"><img class="fill" src="assets/icon-book.svg" alt="" /></button>

      <div class="days">
        ${DAYS.map((d) => `
          <div class="day ${d.state}">
            <span class="num" style="left:${d.numX}px">${d.num}</span>
            <span class="dow" style="left:${d.dowX}px">${d.dow}</span>
          </div>`).join('')}
      </div>

      <div class="fade"></div>
      <button class="cta" type="button">Quick Check</button>
    `;
  },

  mount(el, go) {
    const deck = el.querySelector('.deck');
    const n = TODAY.length;

    const cards = TODAY.map((c, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.index = i;
      card.innerHTML = `
        <div class="card-lift">
          <div class="card-globe"><img class="fill" src="assets/globe.svg" alt="" /></div>
          <div class="abs cy subject">${c.subject}</div>
          <div class="abs cy title">${c.title}</div>
          <div class="abs cy period">${c.period}</div>
          <p class="description">${c.description}</p>
        </div>`;
      deck.append(card);
      return card;
    });

    let offset = 0;     // 드럼 회전량(칸 단위). 카드 i의 칸 = i - offset
    let pressed = -1;   // 선택(뽑힌) 카드
    let anim = null;

    function draw() {
      cards.forEach((card, i) => {
        // 무한 반복: -0.5 ~ n-0.5 범위로 감싼다
        const q = ((((i - offset) + 0.5) % n) + n) % n - 0.5;
        const s = slotStyle(q, n);
        card.style.transform = `translateY(${s.y}px) scale(${s.scale})`;
        card.style.opacity = s.opacity;
        card.style.zIndex = i === pressed ? 100 : Math.round((q + 1) * 10);
        card.classList.toggle('pressed', i === pressed);
      });
      deck.classList.toggle('has-pressed', pressed !== -1);
    }

    function setPressed(i) {
      if (pressed === i) return;
      pressed = i;
      draw();
    }

    function animateTo(target, duration = 500) {
      cancelAnimationFrame(anim);
      const from = offset;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        offset = lerp(from, target, easeOutCubic(t));
        draw();
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    // 누르기 / 드래그
    let drag = null;
    function onDown(e) {
      cancelAnimationFrame(anim);
      deck.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, startY: e.clientY, startOffset: offset, moved: false, lastY: e.clientY, lastT: e.timeStamp, v: 0, card: e.target.closest?.('.card') };
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.abs(dy) > TAP_SLOP) {
        drag.moved = true;
        setPressed(-1);
      }
      if (!drag.moved) return;
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.v = lerp(drag.v, (e.clientY - drag.lastY) / dt, 0.6);
      drag.lastY = e.clientY;
      drag.lastT = e.timeStamp;
      offset = drag.startOffset - dy / PX_PER_SLOT;
      draw();
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const { moved, v, card } = drag;
      drag = null;
      if (!moved) {
        // 탭: 카드면 선택/해제 토글, 빈 곳이면 해제
        const i = card ? Number(card.dataset.index) : -1;
        setPressed(i === pressed ? -1 : i);
        return;
      }
      // 관성: 손 뗀 속도만큼 더 굴러간 뒤 가장 가까운 칸에 멈춤
      const fling = (-v * 180) / PX_PER_SLOT;
      animateTo(Math.round(offset + fling));
    }

    deck.addEventListener('pointerdown', onDown);
    deck.addEventListener('pointermove', onMove);
    deck.addEventListener('pointerup', onUp);
    deck.addEventListener('pointercancel', onUp);

    el.querySelector('.library-btn').addEventListener('click', () => go('library'));
    el.querySelector('.cta').addEventListener('click', () => go('quickcheck'));

    draw();
    return () => cancelAnimationFrame(anim);
  },
};

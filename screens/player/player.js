// Figma 11540:2496 (영상 + 제어 화면, 가로)
// 강의 영상(Lottie)을 일반 영상처럼 끝까지 이어서 재생한다.
//   탭        : 지금 장면 조각(마커 한 문장)을 건너뛰고 다음 조각부터 재생
//   위로 스와이프 : 제어 화면 보이기. 재생 중 3초 동안 조작이 없으면 저절로 숨는다 (유튜브처럼)
//   길게 누르기 : 오른쪽 절반 = 2배속 빨리 감기, 왼쪽 절반 = 2배속 되감기 (누르는 동안만)
//   재생바 드래그 : 원하는 위치로 이동
//   영상 속 인터랙션(고르기, 끌어다 놓기, 마이크) 지점에 오면 멈추고, 학생이 조작을 끝내면 이어서 재생
/* global lottie */
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';
import { loadLesson } from '../../js/lessons.js';
import { create as createInteraction } from '../../js/interactions.js';

const SWIPE_PX = 40;
const HOLD_MS = 400;  // 길게 누르기로 보는 시간
const FAST = 2;       // 빨리 감기 / 되감기 배속
const MOVE_SLOP = 10;
const HIDE_MS = 3000; // 제어 화면이 저절로 숨기까지
const ICON_PAUSE = `
  <svg width="59" height="59" viewBox="0 0 59 59">
    <rect x="21" y="18" width="6" height="24" rx="3" fill="#fff" />
    <rect x="33" y="18" width="6" height="24" rx="3" fill="#fff" />
  </svg>`;
const ICON_PLAY = `
  <svg width="59" height="59" viewBox="0 0 59 59">
    <path d="M24 18.5 L41 29.5 L24 40.5 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round" />
  </svg>`;

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export default {
  render() {
    const l = TODAY[state.watching] ?? TODAY[0];
    return `
      <div class="land">
        <div class="video"></div>
        <div class="speed"></div>

        <div class="controls">
          <div class="shade"></div>

          <button class="back glass" type="button" aria-label="Back">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M25.5 14.5 L18 22 L25.5 29.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="title">${l.title}</div>
          <div class="subject">${l.subject}</div>

          <div class="lang glass">
            <div class="lang-thumb"></div>
            <button class="lang-btn en" type="button" data-lang="en">EN</button>
            <button class="lang-btn es" type="button" data-lang="es">ES</button>
          </div>

          <button class="toggle glass" type="button" aria-label="Play / Pause">${ICON_PAUSE}</button>
          <div class="time glass"><span>0:00 / 0:00</span></div>
          <div class="progress"><div class="bar"></div><div class="head"></div></div>

          <button class="mascot" type="button" aria-label="Ask">
            <img class="fill" src="assets/player-mascot-bubble.svg" alt="" />
            <img class="face" src="assets/player-mascot.svg" alt="" />
          </button>
        </div>
      </div>
    `;
  },

  mount(el, go) {
    const index = state.watching >= 0 ? state.watching : 0;
    const lecture = TODAY[index];
    const land = el.querySelector('.land');
    const controls = el.querySelector('.controls');
    const bar = el.querySelector('.bar');
    const head = el.querySelector('.head');
    const progress = el.querySelector('.progress');
    const timeText = el.querySelector('.time span');
    const toggleBtn = el.querySelector('.toggle');

    let lesson = null;
    let anim = null;
    let frame = 0;
    let playing = false;
    let baseFrame = 0;         // 재생 시작 기준
    let rate = 1;              // 재생 속도 (2 = 빨리 감기, -2 = 되감기)
    let baseTime = 0;
    let raf = 0;
    let disposed = false;
    let gates = [];            // 영상 속 인터랙션 (at 프레임 순)
    let awaiting = null;       // 지금 조작을 기다리는 인터랙션
    let hideTimer = 0;

    // 화면 좌표 → 가로 화면 좌표
    function toLand(e) {
      const r = el.getBoundingClientRect();
      return { x: r.height - (e.clientY - r.top), y: e.clientX - r.left };
    }

    // 포인터 → Lottie svg 좌표 (영상은 화면을 꽉 채우도록 잘려서 그려진다)
    function toSvg(e) {
      const p = toLand(e);
      const { w, h } = lesson.data;
      const W = land.offsetWidth;
      const H = land.offsetHeight;
      const s = Math.max(W / w, H / h);
      return { x: (p.x - (W - w * s) / 2) / s, y: (p.y - (H - h * s) / 2) / s };
    }

    // ---- 제어 화면 보이기 / 숨기기 ----
    function showControls(show) {
      controls.classList.toggle('show', show);
      keepControls();
    }
    // 재생 중이면 3초 뒤 숨김 (멈춰 있을 때는 계속 보임)
    function keepControls() {
      clearTimeout(hideTimer);
      if (controls.classList.contains('show') && playing) {
        hideTimer = setTimeout(() => controls.classList.remove('show'), HIDE_MS);
      }
    }

    // ---- 인터랙션 ----
    function stopAt(g) {
      frame = g.at;
      playing = false;
      awaiting = g;
      render();
    }
    function finish(g) {
      g.done = true;
      if (awaiting !== g) return; // 멈추기 전에 미리 끝낸 경우 (early)
      awaiting = null;
      play();
    }
    // 뒤로 돌아가면 그 뒤의 인터랙션은 다시 할 수 있게
    function resetGatesAfter(f) {
      awaiting = null;
      for (const g of gates) {
        if (g.at > f && g.done) {
          g.done = false;
          g.reset();
        }
      }
    }

    // ---- 재생 ----
    function play(fromFrame = frame) {
      if (fromFrame < frame) resetGatesAfter(fromFrame);
      rate = 1;
      frame = fromFrame;
      baseFrame = frame;
      baseTime = performance.now();
      playing = true;
      render();
      keepControls();
    }
    function pause() {
      playing = false;
      render();
      keepControls();
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!playing) return;
      const prev = frame;
      frame = baseFrame + ((now - baseTime) / 1000) * lesson.fr * rate;
      if (rate < 0) {
        // 되감기: 처음에서 멈추고, 지나온 조작 장면은 다시 할 수 있게
        frame = Math.max(0, frame);
        resetGatesAfter(frame);
        return render();
      }
      const gate = gates.find((g) => !g.done && prev < g.at && frame >= g.at);
      if (gate) {
        endHold();
        return stopAt(gate);
      }
      if (frame >= lesson.data.op) {
        endHold();
        frame = lesson.data.op;
        state.watched.add(index); // 끝까지 봄
        pause();
        showControls(true);
        return;
      }
      render();
    }

    // 길게 누르기: 누르는 동안 빨리 감기(dir 1) / 되감기(dir -1)
    const speedBadge = el.querySelector('.speed');
    let hold = null; // { wasPlaying }
    function startHold(dir) {
      hold = { wasPlaying: playing };
      rate = FAST * dir;
      baseFrame = frame;
      baseTime = performance.now();
      playing = true;
      speedBadge.textContent = dir > 0 ? `▶▶ ${FAST}x` : `◀◀ ${FAST}x`;
      speedBadge.classList.add('show');
      render();
    }
    function endHold() {
      if (!hold) return;
      const { wasPlaying } = hold;
      hold = null;
      rate = 1;
      speedBadge.classList.remove('show');
      if (wasPlaying && !awaiting && frame < lesson.data.op) play();
      else pause();
    }

    // 탭: 지금 조각을 건너뛰고 다음 조각부터 (인터랙션은 건너뛰지 않는다)
    function skip() {
      const next = lesson.segments.find((s) => s.start > frame + 1);
      const to = next ? next.start : lesson.data.op;
      const gate = gates.find((g) => !g.done && g.at >= frame && g.at <= to);
      if (gate) return stopAt(gate);
      if (!next) {
        frame = lesson.data.op;
        state.watched.add(index);
        pause();
        return showControls(true);
      }
      play(to);
    }

    // 프레임 → 재생바 위 x (장면 구간 사이 틈을 고려)
    function barX(f) {
      for (let i = 0; i < lesson.scenes.length; i += 1) {
        const s = lesson.scenes[i];
        if (f <= s.end || i === lesson.scenes.length - 1) {
          const segEl = bar.children[i];
          const p = Math.max(0, Math.min(1, (f - s.start) / (s.end - s.start)));
          return segEl.offsetLeft + segEl.offsetWidth * p;
        }
      }
      return 0;
    }

    function render() {
      anim.goToAndStop(frame, true);
      timeText.textContent = `${clock(frame / lesson.fr)} / ${clock(lesson.total / lesson.fr)}`;
      lesson.scenes.forEach((s, i) => {
        const fill = bar.children[i].firstElementChild;
        const p = Math.max(0, Math.min(1, (frame - s.start) / (s.end - s.start)));
        fill.style.width = `${p * 100}%`;
      });
      head.style.left = `${barX(frame)}px`;
      gates.forEach((g) => {
        g.dot.style.left = `${barX(g.at)}px`;
        g.onFrame?.(frame);
      });
      if (toggleBtn.dataset.playing !== String(playing)) {
        toggleBtn.dataset.playing = playing;
        toggleBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      }
    }

    // 재생바 드래그
    function seekTo(e) {
      const x = toLand(e).x - progress.offsetLeft;
      const segEls = [...bar.children];
      let f = lesson.data.op;
      for (let i = 0; i < segEls.length; i += 1) {
        const s = lesson.scenes[i];
        const left = segEls[i].offsetLeft;
        const right = left + segEls[i].offsetWidth;
        if (x <= right + 3) {
          const p = Math.max(0, Math.min(1, (x - left) / (right - left)));
          f = s.start + p * (s.end - s.start);
          break;
        }
      }
      f = Math.min(f, lesson.data.op);
      if (f < frame) resetGatesAfter(f);
      awaiting = null;
      frame = f;
      render();
    }

    let gesture = null;
    land.addEventListener('pointerdown', (e) => {
      if (!lesson) return;
      land.setPointerCapture(e.pointerId);
      clearTimeout(hideTimer); // 만지는 동안은 숨기지 않는다

      if (controls.classList.contains('show') && e.target.closest('.progress')) {
        gesture = { type: 'seek', id: e.pointerId, wasPlaying: playing };
        playing = false;
        seekTo(e);
        return;
      }
      if (e.target.closest('button')) return; // 버튼은 click으로 처리

      // 끌어다 놓기·슬라이더 인터랙션 (멈춰 있을 때, 또는 early 구간에서는 재생 중에도)
      const live = awaiting ?? gates.find((g) => !g.done && g.early !== undefined && frame >= g.early && frame <= g.at);
      if (live?.down?.(e)) {
        gesture = { type: 'gate', id: e.pointerId, gate: live };
        return;
      }
      gesture = { type: 'touch', id: e.pointerId, start: toLand(e), moved: false, target: e.target };
      if (awaiting) return; // 조작을 기다리는 동안은 빨리 감기 없음
      const g = gesture;
      g.timer = setTimeout(() => {
        g.held = true;
        startHold(g.start.x > land.offsetWidth / 2 ? 1 : -1);
      }, HOLD_MS);
    });

    land.addEventListener('pointermove', (e) => {
      if (!gesture || e.pointerId !== gesture.id) return;
      if (gesture.type === 'seek') return seekTo(e);
      if (gesture.type === 'gate') return gesture.gate.move(e);
      const p = toLand(e);
      if (!gesture.held && Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > MOVE_SLOP) {
        gesture.moved = true;
        clearTimeout(gesture.timer);
      }
    });

    land.addEventListener('pointerup', (e) => {
      const g = gesture;
      gesture = null;
      if (!g || e.pointerId !== g.id) return keepControls();
      if (g.type === 'seek') {
        if (g.wasPlaying) play();
        else keepControls();
        return;
      }
      if (g.type === 'gate') {
        g.gate.up(e);
        return keepControls();
      }
      clearTimeout(g.timer);
      if (g.held) return endHold();
      const p = toLand(e);
      const dy = p.y - g.start.y;
      if (g.moved) {
        // 위로 스와이프만 제어 화면 보이기 (아래로 스와이프는 동작 없음)
        if (dy < -SWIPE_PX && Math.abs(dy) > Math.abs(p.x - g.start.x)) showControls(true);
        else keepControls();
        return;
      }
      if (awaiting) {
        awaiting.tap?.({ target: g.target }); // 고르기·마이크 (다른 곳 탭은 무시)
        return keepControls();
      }
      // 제어 화면이 보일 때 빈 곳 탭 → 숨기기 (유튜브처럼). 숨어 있을 때 탭 → 다음 조각
      if (controls.classList.contains('show')) return showControls(false);
      skip();
    });
    land.addEventListener('pointercancel', () => {
      clearTimeout(gesture?.timer);
      gesture = null;
      endHold();
      keepControls();
    });

    el.querySelector('.back').addEventListener('click', () => go(state.playerBack, { transition: 'pop' }));
    toggleBtn.addEventListener('click', () => {
      if (awaiting) return keepControls(); // 조작을 끝내야 이어서 재생
      if (playing) return pause();
      play(frame >= lesson.data.op ? 0 : frame);
    });
    el.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => {
      // TODO: 스페인어 음성/자막이 생기면 전환
      el.querySelector('.lang-thumb').classList.toggle('es', b.dataset.lang === 'es');
    }));
    el.querySelector('.mascot').addEventListener('click', () => {
      // TODO: 마스코트 기능
    });

    loadLesson(lecture).then((l) => {
      if (disposed) return;
      lesson = l;
      bar.innerHTML = l.scenes.map((s) => `<div class="seg" style="flex:${s.end - s.start}"><i></i></div>`).join('');
      anim = lottie.loadAnimation({
        container: el.querySelector('.video'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: l.data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      });
      // 영상 요소가 다 그려진 뒤 인터랙션 연결 → 재생 시작
      const start = () => {
        const svg = el.querySelector('.video svg');
        gates = (lecture.interactions ?? [])
          .map((it) => {
            const g = createInteraction(it, svg, toSvg, () => finish(g));
            g.early = it.early; // 이 프레임부터는 재생 중에도 조작 가능
            // 재생바 위 검은 점: 학생이 고르거나 조작해야 하는 지점
            g.dot = document.createElement('i');
            g.dot.className = 'gate-dot';
            progress.append(g.dot);
            return g;
          })
          .sort((a, b) => a.at - b.at);
        raf = requestAnimationFrame(tick);
        play(0);
      };
      if (anim.isLoaded) start();
      else anim.addEventListener('DOMLoaded', start);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      anim?.destroy();
    };
  },
};

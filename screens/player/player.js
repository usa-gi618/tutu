// Figma 11540:2496 (영상 + 제어 화면, 가로)
// 강의 영상(Lottie)을 조각(마커 한 문장) 단위로 재생한다.
//   탭        : 다음 조각으로 넘어가 재생 (조각이 끝나면 멈춰서 다음 탭을 기다림)
//   꾹 누르기  : 연속 재생. 조각이 끝나도 다음 조각으로 이어서 재생 (탭하면 다시 한 조각씩)
//   위/아래 스와이프 : 제어 화면 보이기 / 숨기기
//   재생바 드래그 : 원하는 위치로 이동
/* global lottie */
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';
import { loadLesson } from '../../js/lessons.js';

const LAND_W = 926;
const HOLD_MS = 400;
const SWIPE_PX = 40;
const MOVE_SLOP = 10;
// Lottie 자막이 다음 마커보다 조금 앞서 바뀌기 시작해서, 한 조각만 재생할 때는 그만큼 앞에서 멈춘다
const STEP_STOP_EARLY = 15; // 프레임 (30fps 기준 0.5초)

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

        <div class="controls">
          <div class="shade"></div>

          <button class="back glass" type="button" aria-label="Back">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M25.5 14.5 L18 22 L25.5 29.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="title">${l.title}</div>
          <div class="subject">${l.subject}</div>

          <div class="lang glass"></div>
          <div class="lang-thumb"></div>
          <button class="lang-btn en" type="button" data-lang="en">EN</button>
          <button class="lang-btn es" type="button" data-lang="es">ES</button>

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
    let seg = 0;               // 지금 조각
    let playing = false;
    let continuous = false;    // 꾹 눌러서 연속 재생 중
    let baseFrame = 0;         // 재생 시작 기준
    let baseTime = 0;
    let raf = 0;
    let disposed = false;

    // 화면 좌표 → 가로 화면 좌표
    function toLand(e) {
      const r = el.getBoundingClientRect();
      const scale = r.width / el.offsetWidth; // 무대가 화면에 맞춰 줄어든 비율
      return { x: LAND_W - (e.clientY - r.top) / scale, y: (e.clientX - r.left) / scale };
    }

    function segmentAt(f) {
      const list = lesson.segments;
      for (let i = list.length - 1; i >= 0; i -= 1) if (f >= list[i].start) return i;
      return 0;
    }

    function render() {
      anim.goToAndStop(frame, true);
      timeText.textContent = `${clock(frame / lesson.fr)} / ${clock(lesson.total / lesson.fr)}`;
      // 재생바
      let headX = 0;
      lesson.scenes.forEach((s, i) => {
        const fill = bar.children[i].firstElementChild;
        const p = Math.max(0, Math.min(1, (frame - s.start) / (s.end - s.start)));
        fill.style.width = `${p * 100}%`;
        if (frame >= s.start && frame <= s.end) {
          const segEl = bar.children[i];
          headX = segEl.offsetLeft + segEl.offsetWidth * p;
        }
      });
      head.style.left = `${headX}px`;
      if (toggleBtn.dataset.playing !== String(playing)) {
        toggleBtn.dataset.playing = playing;
        toggleBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      }
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!playing) return;
      frame = baseFrame + ((now - baseTime) / 1000) * lesson.fr;
      const s = lesson.segments[seg];
      const last = seg === lesson.segments.length - 1; // 마지막 조각은 끝까지 (다 본 것으로 기록)
      const end = continuous || last ? s.end : Math.max(s.start, s.end - STEP_STOP_EARLY);
      if (frame >= end) {
        frame = end;
        playing = false;
        continuous = false;
      }
      // 연속 재생일 때만 지금 조각이 따라 바뀐다 (한 조각 재생은 그 조각 끝에서 멈춰야 하므로)
      if (continuous) seg = segmentAt(Math.min(frame, lesson.data.op - 0.01));
      if (frame >= lesson.data.op) state.watched.add(index); // 끝까지 봄
      render();
    }

    function play(fromFrame = frame) {
      frame = fromFrame;
      baseFrame = frame;
      baseTime = performance.now();
      playing = true;
      render();
    }
    function pause() {
      playing = false;
      render();
    }

    function playSegment(i) {
      seg = Math.max(0, Math.min(lesson.segments.length - 1, i));
      continuous = false;
      play(lesson.segments[seg].start);
    }

    function nextSegment() {
      // 지금 조각을 다 봤으면 다음 조각, 아직 재생 중이면 바로 다음 조각
      if (seg + 1 < lesson.segments.length) playSegment(seg + 1);
      else if (!playing) playSegment(0);
    }

    function showControls(show) {
      controls.classList.toggle('show', show);
    }

    // 재생바 드래그
    function seekTo(e) {
      const x = toLand(e).x - 205; // 재생바 시작 x
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
      frame = Math.min(f, lesson.data.op);
      seg = segmentAt(frame);
      render();
    }

    let gesture = null;
    land.addEventListener('pointerdown', (e) => {
      if (!lesson) return;
      land.setPointerCapture(e.pointerId);
      const start = toLand(e);

      if (controls.classList.contains('show') && e.target.closest('.progress')) {
        gesture = { type: 'seek', id: e.pointerId, wasPlaying: playing };
        playing = false;
        seekTo(e);
        return;
      }
      if (e.target.closest('button')) return; // 버튼은 click으로 처리

      gesture = { type: 'touch', id: e.pointerId, start, moved: false, held: false };
      gesture.timer = setTimeout(() => {
        // 꾹 누르기: 연속 재생
        gesture.held = true;
        continuous = true;
        play(frame >= lesson.data.op ? 0 : frame);
      }, HOLD_MS);
    });

    land.addEventListener('pointermove', (e) => {
      if (!gesture || e.pointerId !== gesture.id) return;
      if (gesture.type === 'seek') return seekTo(e);
      const p = toLand(e);
      if (Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > MOVE_SLOP) {
        gesture.moved = true;
        clearTimeout(gesture.timer);
      }
    });

    land.addEventListener('pointerup', (e) => {
      if (!gesture || e.pointerId !== gesture.id) return;
      const g = gesture;
      gesture = null;
      if (g.type === 'seek') {
        if (g.wasPlaying) play();
        return;
      }
      clearTimeout(g.timer);
      if (g.held) return;
      const p = toLand(e);
      const dy = p.y - g.start.y;
      if (g.moved) {
        if (Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(p.x - g.start.x)) showControls(dy < 0);
        return;
      }
      nextSegment();
    });
    land.addEventListener('pointercancel', () => {
      if (gesture) clearTimeout(gesture.timer);
      gesture = null;
    });

    el.querySelector('.back').addEventListener('click', () => go('lecture', { transition: 'pop' }));
    toggleBtn.addEventListener('click', () => {
      if (playing) return pause();
      if (frame >= lesson.data.op) return playSegment(0);
      play();
    });
    el.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => {
      // TODO: 스페인어 음성/자막이 생기면 전환
      el.querySelector('.lang-thumb').classList.toggle('es', b.dataset.lang === 'es');
    }));
    el.querySelector('.mascot').addEventListener('click', () => {
      // TODO: 마스코트 기능
    });

    loadLesson(lecture.motion).then((l) => {
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
      raf = requestAnimationFrame(tick);
      playSegment(0);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      anim?.destroy();
    };
  },
};

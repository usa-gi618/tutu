// Figma 11540:2496 (영상 + 제어 화면, 가로)
// 강의 영상(Lottie)을 일반 영상처럼 끝까지 이어서 재생한다.
//   탭        : 지금 장면 조각(마커 한 문장)을 건너뛰고 다음 조각부터 재생
//   위로 스와이프 : 제어 화면 보이기. 재생 중 3초 동안 조작이 없으면 저절로 숨는다 (유튜브처럼)
//   길게 누르기 : 오른쪽 절반 = 2배속 빨리 감기, 왼쪽 절반 = 2배속 되감기 (누르는 동안만)
//   재생바 드래그 : 원하는 위치로 이동
//   영상 속 인터랙션(고르기, 끌어다 놓기, 마이크) 지점에 오면 멈추고, 학생이 조작을 끝내면 이어서 재생
//   Lottie가 끝나면 Recap(있으면, Figma 11657:2163)이 이어서 나오고, 끝나면 종료 화면(Figma 11658:5370)
//   말풍선 캐릭터(오른쪽 아래, 영상 내내 보임): 누르면 영상이 멈추고 배경이 흐려지며 마이크가 뜬다.
//     학생이 말하는 문장이 초록 자막으로 나오고(음성 인식 흉내), 끝나면 캐릭터가 큰 말풍선으로 커지며 AI 답변 (Figma 11734:2041)
//     답변 화면을 탭하면 다시 작아지고 영상이 이어진다. 질문·답변은 강의 데이터의 ask (지금은 생물만)
//   EN / ES: 스페인어면 영상 속 영어 자막을 숨기고 스페인어 자막을 띄우며, 코드로 그리는 글자를 모두 바꾼다 (data/spanish.js)
/* global lottie */
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';
import { loadLesson } from '../../js/lessons.js';
import { create as createInteraction } from '../../js/interactions.js';
import { UI, ES } from '../../data/spanish.js';

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

// 영상 마지막 Recap 화면. My prediction 카드는 학생이 고른 카드로 재생 중에 채운다.
function recapInner(recap, ui) {
  return `
    <div class="recap-chip">${ui.recapChip}</div>
    <div class="recap-cards">
      ${recap.prediction ? `
        <div class="recap-card">
          <p class="recap-label">${recap.prediction.label ?? 'My prediction'}</p>
          <p class="recap-main prediction"></p>
          <p class="recap-note"></p>
        </div>` : ''}
      ${recap.cards.map((c) => `
        <div class="recap-card">
          <p class="recap-label">${c.label}</p>
          <p class="recap-main">${c.html}</p>
        </div>`).join('')}
    </div>
    <p class="recap-caption">${recap.caption}</p>`;
}
function recapHtml(recap) {
  return recap ? `<div class="recap">${recapInner(recap, UI.en)}</div>` : '';
}

// 말풍선 캐릭터 = 작은 말풍선 버튼. 질문하면 이 요소가 그대로 커져서 AI 답변 말풍선이 된다.
function askHtml(ask) {
  return `
    <button class="ask-bubble" type="button" aria-label="Ask a question">
      ${ask ? `<div class="ask-answer">${askInner(ask)}</div>` : ''}
      <img class="ask-face" src="assets/player-mascot.svg" alt="" />
    </button>`;
}

function askInner(ask) {
  return `
    <p class="ask-question">“${ask.question}”</p>
    <div class="ask-steps">
      ${ask.steps.map((s, i) => `${i ? '<span class="ask-arrow">→</span>' : ''}<div class="ask-step"><b>${s.top}</b><span>${s.bottom}</span></div>`).join('')}
      <span class="ask-result">${ask.result}</span>
    </div>
    <p class="ask-reply"></p>`;
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export default {
  render() {
    const l = TODAY[state.watching] ?? TODAY[0];
    return `
      <div class="land">
        <div class="video"></div>
        <p class="sub"></p>
        ${recapHtml(l.recap)}
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
        </div>

        <div class="ask-dim"></div>
        <div class="ask-listen">
          <p class="ask-transcript"></p>
          <button class="ask-mic" type="button" aria-label="Done talking">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <rect x="25" y="16" width="10" height="18" rx="5" fill="#fff" />
              <path d="M20 28 a10 10 0 0 0 20 0 M30 38 v6 M25 44 h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        ${askHtml(l.ask)}

        <div class="finish">
          <img class="finish-mark" src="assets/finish-mark.svg" alt="" />
          <p class="finish-title">You finished the lecture.</p>
          <p class="finish-sub">Two quick questions to lock it in.</p>
          <div class="finish-btns">
            <button class="rewatch" type="button">Rewatch</button>
            <button class="start-questions" type="button">Start questions</button>
          </div>
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
    // 영상 타임라인: Lottie(0 ~ videoEnd) + Recap(videoEnd ~ END)
    let videoEnd = 0;
    let END = 0;
    let scenes = [];
    let segments = [];
    const recapEl = el.querySelector('.recap');
    // 질문하기: idle → listening(마이크) → answering(큰 말풍선) → idle
    let ask = 'idle';
    let askTimers = [];
    let askWasPlaying = false;
    let askClosedAt = 0;
    const bubble = el.querySelector('.ask-bubble');
    const transcript = el.querySelector('.ask-transcript');
    let reply = el.querySelector('.ask-reply');
    const finishEl = el.querySelector('.finish');

    // ---- 언어 (EN / ES) ----
    const es = ES[lecture.subject];
    const isEs = () => state.lang === 'es' && !!es;
    const ui = () => UI[isEs() ? 'es' : 'en'];
    const recapData = () => (isEs() && es.recap && lecture.recap
      ? { ...lecture.recap, ...es.recap, prediction: { ...lecture.recap.prediction, ...es.recap.prediction } }
      : lecture.recap);
    const askData = () => (isEs() && es.ask ? { ...lecture.ask, ...es.ask } : lecture.ask);
    const sub = el.querySelector('.sub');
    function applyLang() {
      const t = ui();
      el.querySelector('.lang-thumb').classList.toggle('es', state.lang === 'es');
      land.classList.toggle('lang-es', isEs()); // 영상 속 영어 자막 숨김 (CSS)
      el.querySelector('.controls .title').textContent = isEs() ? es.title : lecture.title;
      el.querySelector('.controls .subject').textContent = isEs() ? es.subject : lecture.subject;
      el.querySelector('.finish-title').textContent = t.finishTitle;
      el.querySelector('.finish-sub').textContent = t.finishSub;
      el.querySelector('.rewatch').textContent = t.rewatch;
      el.querySelector('.start-questions').textContent = t.startQuestions;
      if (recapEl) {
        recapEl.innerHTML = recapInner(recapData(), t);
        fillRecap();
      }
      if (lecture.ask && ask === 'idle') {
        el.querySelector('.ask-answer').innerHTML = askInner(askData());
        reply = el.querySelector('.ask-reply');
      }
    }
    // 스페인어 자막: 지금 조각(마커)의 번역. Recap·종료 화면에서는 없음
    function updateSub() {
      let text = null;
      if (isEs() && frame < videoEnd) {
        const s = [...segments].reverse().find((x) => frame >= x.start);
        text = s && es.captions?.[s.id];
      }
      if (text) sub.textContent = text;
      sub.classList.toggle('show', !!text);
    }
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
      if (frame >= END) {
        endHold();
        return finishVideo();
      }
      render();
    }

    // ---- 끝 ----
    function finishVideo() {
      frame = END;
      state.watched.add(index); // 끝까지 봄
      pause();
      controls.classList.remove('show');
      finishEl.classList.add('show');
    }
    function fillRecap() {
      const p = recapData()?.prediction;
      if (!p) return;
      const choice = gates.find((g) => g.scene === p.scene)?.choice;
      const main = recapEl.querySelector('.prediction');
      const note = recapEl.querySelector('.recap-note');
      main.textContent = p.texts[choice] ?? ui().noPrediction;
      main.classList.toggle('ruled-out', !!choice && choice !== p.correct);
      note.textContent = !choice ? '' : choice === p.correct ? p.confirmed : p.ruledOut;
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
      if (wasPlaying && !awaiting && frame < END) play();
      else pause();
    }

    // 탭: 지금 조각을 건너뛰고 다음 조각부터 (인터랙션은 건너뛰지 않는다)
    function skip() {
      const next = segments.find((s) => s.start > frame + 1);
      const to = next ? next.start : END;
      const gate = gates.find((g) => !g.done && g.at >= frame && g.at <= to);
      if (gate) return stopAt(gate);
      if (!next) return finishVideo();
      play(to);
    }

    // 프레임 → 재생바 위 x (장면 구간 사이 틈을 고려)
    function barX(f) {
      for (let i = 0; i < scenes.length; i += 1) {
        const s = scenes[i];
        if (f <= s.end || i === scenes.length - 1) {
          const segEl = bar.children[i];
          const p = Math.max(0, Math.min(1, (f - s.start) / (s.end - s.start)));
          return segEl.offsetLeft + segEl.offsetWidth * p;
        }
      }
      return 0;
    }

    function render() {
      anim.goToAndStop(Math.min(frame, videoEnd), true);
      if (recapEl) {
        const inRecap = frame >= videoEnd;
        if (inRecap && !recapEl.classList.contains('show')) fillRecap();
        recapEl.classList.toggle('show', inRecap);
      }
      if (frame < END) finishEl.classList.remove('show');
      updateSub();
      timeText.textContent = `${clock(frame / lesson.fr)} / ${clock(END / lesson.fr)}`;
      scenes.forEach((s, i) => {
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
      let f = END;
      for (let i = 0; i < segEls.length; i += 1) {
        const s = scenes[i];
        const left = segEls[i].offsetLeft;
        const right = left + segEls[i].offsetWidth;
        if (x <= right + 3) {
          const p = Math.max(0, Math.min(1, (x - left) / (right - left)));
          f = s.start + p * (s.end - s.start);
          break;
        }
      }
      f = Math.min(f, END - 1);
      if (f < frame) resetGatesAfter(f);
      awaiting = null;
      frame = f;
      render();
    }

    let gesture = null;
    land.addEventListener('pointerdown', (e) => {
      if (!lesson || finishEl.classList.contains('show')) return; // 종료 화면에서는 버튼만
      if (ask !== 'idle') {
        // 답변 화면에서 탭하면 닫고 영상 이어서
        if (ask === 'answering') closeAsk();
        return;
      }
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
      play(frame >= END ? 0 : frame);
    });
    // 종료 화면
    el.querySelector('.rewatch').addEventListener('click', () => {
      finishEl.classList.remove('show');
      play(0);
    });
    el.querySelector('.start-questions').addEventListener('click', () => {
      // TODO: 문제풀이 화면
    });
    el.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => {
      state.lang = b.dataset.lang;
      applyLang();
      render();
    }));
    // ---- 질문하기 ----
    const later = (fn, ms) => askTimers.push(setTimeout(fn, ms));
    function startAsk() {
      if (!lecture.ask || ask !== 'idle' || awaiting) return;
      ask = 'listening';
      askWasPlaying = playing;
      endHold();
      pause();
      controls.classList.remove('show');
      land.classList.add('asking', 'listening');
      // 음성 인식 흉내: 질문 문장이 단어 단위로 나타난다
      const words = askData().question.split(' ');
      transcript.textContent = '';
      words.forEach((w, i) => later(() => {
        transcript.textContent = words.slice(0, i + 1).join(' ');
        transcript.classList.add('show');
      }, 700 + i * 280));
      later(answer, 700 + words.length * 280 + 900);
    }
    function answer() {
      if (ask !== 'listening') return;
      askTimers.forEach(clearTimeout);
      askTimers = [];
      transcript.textContent = askData().question;
      ask = 'answering';
      land.classList.remove('listening');
      land.classList.add('answering');
      // 답변은 단어 단위로 출력
      const words = askData().answer.split(' ');
      reply.textContent = '';
      words.forEach((w, i) => later(() => { reply.textContent = words.slice(0, i + 1).join(' '); }, 900 + i * 90));
    }
    function closeAsk() {
      askTimers.forEach(clearTimeout);
      askTimers = [];
      ask = 'idle';
      askClosedAt = performance.now();
      land.classList.remove('asking', 'listening', 'answering');
      transcript.classList.remove('show');
      if (askWasPlaying) play();
    }
    bubble.addEventListener('click', () => {
      // 답변을 닫은 바로 그 탭으로 다시 열리지 않게
      if (ask === 'idle' && performance.now() - askClosedAt > 400) startAsk();
    });
    el.querySelector('.ask-mic').addEventListener('click', answer); // 말 끝 → 바로 보내기

    loadLesson(lecture).then((l) => {
      if (disposed) return;
      lesson = l;
      videoEnd = l.data.op;
      END = videoEnd + (lecture.recap ? lecture.recap.seconds * l.fr : 0);
      scenes = [...l.scenes];
      segments = [...l.segments];
      if (lecture.recap) {
        scenes.push({ id: 'recap', start: videoEnd, end: END });
        segments.push({ scene: 'recap', caption: lecture.recap.caption, start: videoEnd, end: END });
      }
      bar.innerHTML = scenes.map((s) => `<div class="seg" style="flex:${s.end - s.start}"><i></i></div>`).join('');
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
            const g = createInteraction(it, svg, toSvg, () => finish(g), () => state.lang);
            g.early = it.early; // 이 프레임부터는 재생 중에도 조작 가능
            g.scene = it.scene;
            // 재생바 위 검은 점: 학생이 고르거나 조작해야 하는 지점
            g.dot = document.createElement('i');
            g.dot.className = 'gate-dot';
            progress.append(g.dot);
            return g;
          })
          .sort((a, b) => a.at - b.at);
        applyLang();
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
      askTimers.forEach(clearTimeout);
      anim?.destroy();
    };
  },
};

// 강의 내레이션 음성: 자막 한 줄(마커)마다 음성 파일 하나 (data/narration.js, tools/make_audio.py로 만든다).
// 영상 프레임에 맞춰 재생한다. 플레이어가 render() 때마다 sync()를 부르면
//   - 새 줄이 시작되면 그 줄 음성을 (줄 안에서 지난 만큼 건너뛰고) 튼다
//   - 일시정지·빨리 감기·재생바 끌기 → 멈춤, 다시 재생하면 영상 위치에서 이어서
//   - 인터랙션에서 영상이 멈춘 동안은 말하던 문장을 끝까지 마친다 (다시 재생해도 반복하지 않음)
//   - EN/ES를 바꾸면 그 줄을 바꾼 언어로 이어서
// Web Audio를 쓴다: iOS는 첫 탭에서 한 번만 열어 두면 그 뒤로는 탭 없이도 재생된다.
import { NARRATION } from '../data/narration.js';

const Ctx = window.AudioContext || window.webkitAudioContext;
const ctx = Ctx ? new Ctx() : null;
const buffers = new Map(); // src → Promise<AudioBuffer | null>

// 첫 탭(어디든)에서 소리 켜기
function unlock() {
  if (!ctx || ctx.state === 'running') return;
  ctx.resume();
  const s = ctx.createBufferSource();
  s.buffer = ctx.createBuffer(1, 1, 22050);
  s.connect(ctx.destination);
  s.start(0);
}
['pointerdown', 'touchend', 'keydown'].forEach((t) => window.addEventListener(t, unlock, { capture: true, passive: true }));

function load(src) {
  if (!buffers.has(src)) {
    buffers.set(src, fetch(src)
      .then((r) => r.arrayBuffer())
      .then((a) => new Promise((ok, fail) => ctx.decodeAudioData(a, ok, fail)))
      .then((b) => { buffers.set(src, b); return b; })
      .catch(() => null));
  }
  return buffers.get(src);
}
const ready = (src) => { const b = buffers.get(src); return b instanceof AudioBuffer ? b : null; };

export function createNarrator(subject) {
  const lines = NARRATION[subject];
  if (!ctx || !lines) return { sync() {}, stop() {} };
  // 지금 언어 먼저, 그다음 다른 언어
  Object.values(lines.en ?? {}).forEach((c) => load(c.src));
  Object.values(lines.es ?? {}).forEach((c) => load(c.src));

  let key = null;      // 지금 줄 (언어 + 마커 번호)
  let started = false; // 이 줄 음성을 이미 틀었는지
  let source = null;

  function stop() {
    if (source) {
      source.onended = null;
      try { source.stop(); } catch {}
      source = null;
    }
  }

  return {
    // segment: 지금 조각 { id, start }, offset 계산용 fr
    // running: 영상이 보통 속도로 재생 중, waiting: 인터랙션에서 멈춰 조작을 기다리는 중
    sync({ segment, frame, fr, lang, running, waiting }) {
      const clip = segment && lines[lang]?.[segment.id];
      const k = clip ? `${lang}:${segment.id}` : null;
      if (k !== key) {
        stop(); // 새 줄 (또는 언어 바꿈) → 하던 말은 끊는다
        key = k;
        started = false;
      }
      if (!running) {
        if (!waiting) { stop(); started = false; } // 일시정지 등: 다시 재생할 때 이어서
        return;
      }
      if (started || !clip) return;
      const offset = (frame - segment.start) / fr;
      if (offset >= clip.seconds - 0.15) { started = true; return; } // 이미 다 지나간 말
      const buf = ready(clip.src);
      if (!buf) return; // 아직 못 받음 → 받는 대로 (구간 안이면) 시작
      source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(ctx.destination);
      source.start(0, Math.max(0, offset));
      const mine = source;
      source.onended = () => { if (source === mine) source = null; };
      started = true;
    },
    stop() { stop(); key = null; started = false; },
  };
}

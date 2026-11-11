// 강의 영상(Lottie) 속 다큐멘터리 장면: 글자 카드 대신 일러스트 컷을 이어 보여준다.
// 실제 애니메이션 대신 컷(assets/docs/*.svg)을 내레이션에 맞춰 바꾸고, 다큐처럼 천천히 확대·이동(Ken Burns)한다.
// 1) prepareDocs(): 영상 데이터를 불러올 때 원래 카드·내레이션 자리 글자 레이어를 숨긴다
// 2) createDoc(): 장면 레이어 안에 화면(컷 + 아래 자막 띠 + 진행 줄)을 넣는다. 장면의 페이드도 그대로 따라간다.
//    onFrame(f)이 프레임마다 컷과 움직임을 맞춘다 (되감기·건너뛰기에도 맞음)
import { sceneLayers, layerClass } from './interactions.js';

const NS = 'http://www.w3.org/2000/svg';
const FRAME = { x: 40, y: 60, w: 846, h: 290, r: 20 }; // 화면 자리 (Lottie 926 x 428 좌표)
const FADE = 10; // 컷이 바뀔 때 겹쳐 사라지는 프레임 수

export function prepareDocs(data, docs = []) {
  for (const doc of docs) {
    for (const l of sceneLayers(data, doc.scene)) if (doc.hide.includes(l.nm)) l.hd = true; // 같은 이름 레이어 모두
  }
}

function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
}

export function createDoc(doc, svg, data, lang = () => 'en') {
  const sceneEl = svg.querySelector(`.${layerClass(doc.scene)}`);
  const top = data.layers.find((l) => l.nm === doc.scene);
  const end = top.op;
  const { x, y, w, h, r } = FRAME;
  const id = `doc-${layerClass(doc.scene)}`;

  const root = el('g', { class: 'doc-screen' }, sceneEl);
  const clip = el('clipPath', { id }, root);
  el('rect', { x, y, width: w, height: h, rx: r }, clip);
  const inner = el('g', { 'clip-path': `url(#${id})` }, root);
  el('rect', { x, y, width: w, height: h, fill: '#111' }, inner);
  const cuts = doc.cuts.map((c, i) => ({
    ...c,
    to: doc.cuts[i + 1]?.from ?? end,
    img: el('image', { href: c.art, x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, inner),
  }));
  // 아래 자막 띠 (장소·연도)
  const label = el('g', {}, inner);
  const labelBg = el('rect', { x: x + 18, y: y + h - 46, height: 28, rx: 14, fill: 'rgba(0,0,0,0.72)' }, label);
  const labelText = el('text', { x: x + 32, y: y + h - 27.5, fill: '#fff', 'font-size': 13, 'font-weight': 600, 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' }, label);
  // 다큐 진행 줄
  el('rect', { x, y: y + h - 4, width: w, height: 4, fill: 'rgba(255,255,255,0.35)' }, inner);
  const progress = el('rect', { x, y: y + h - 4, width: 0, height: 4, fill: '#fffd6c' }, inner);
  el('rect', { x, y, width: w, height: h, rx: r, fill: 'none', stroke: '#111', 'stroke-width': 2 }, root);

  const start = cuts[0].from;
  let shownLabel = null;
  return {
    onFrame(f) {
      cuts.forEach((c, i) => {
        // 다음 컷이 위에서 서서히 나타난다
        const fade = i === 0 ? 1 : Math.min(1, Math.max(0, (f - c.from) / FADE));
        const covered = cuts[i + 1] && f >= cuts[i + 1].from + FADE;
        c.img.style.display = fade > 0 && !covered ? '' : 'none';
        c.img.style.opacity = fade;
        // Ken Burns: 컷 동안 천천히 확대하면서 pan 방향으로 이동
        const t = Math.min(1, Math.max(0, (f - c.from) / (c.to - c.from)));
        const [dx, dy] = c.pan ?? [0, 0];
        const s = 1.04 + 0.08 * t;
        const cx = x + w / 2 + dx * t;
        const cy = y + h / 2 + dy * t;
        c.img.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-x - w / 2} ${-y - h / 2})`);
      });
      const now = [...cuts].reverse().find((c) => f >= c.from) ?? cuts[0];
      const text = now.label[lang()] ?? now.label.en;
      if (text !== shownLabel || !labelBg.getAttribute('width')) {
        labelText.textContent = text;
        const len = labelText.getComputedTextLength(); // 장면이 안 보일 때는 0
        if (len > 0) {
          labelBg.setAttribute('width', len + 28);
          shownLabel = text;
        }
      }
      progress.setAttribute('width', w * Math.min(1, Math.max(0, (f - start) / (end - start))));
    },
  };
}

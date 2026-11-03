// 강의 영상(Lottie) 속 인터랙션: 카드 고르기, 끌어다 놓기.
// 1) prepare(): 영상 데이터를 불러올 때 손본다
//    - 모든 레이어에 class "L-레이어이름"을 붙여 코드에서 찾을 수 있게
//    - freeze: 영상에 미리 들어 있는 정답 강조 같은 애니메이션을 지운다
//    - drag: 끌 물체를 별도 레이어로 떼어낸다
// 2) create(): 재생 중 그 지점에 오면 영상을 멈추고 학생의 조작을 받는다. 끝나면 done().
const NS = 'http://www.w3.org/2000/svg';
const YELLOW = '#FFFD6C';

export const layerClass = (name) => `L-${String(name).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

function layerLists(data) {
  return [data.layers, ...(data.assets ?? []).filter((a) => a.layers).map((a) => a.layers)];
}
function findLayer(data, name) {
  for (const list of layerLists(data)) {
    const i = list.findIndex((l) => l.nm === name);
    if (i !== -1) return { list, i, layer: list[i] };
  }
  throw new Error(`Lottie layer not found: ${name}`);
}

// 레이어 안 애니메이션 중 from 프레임 이후에 시작하는 것을 없앤다 (그 전 모습으로 고정)
function freezeFrom(layer, from) {
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    if (o.a === 1 && Array.isArray(o.k) && o.k[0]?.t !== undefined) {
      const keep = o.k.filter((k) => k.t < from);
      if (!keep.length) {
        const v = o.k[0].s;
        o.a = 0;
        o.k = Array.isArray(v) && v.length === 1 ? v[0] : v;
      } else {
        o.k = keep;
      }
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(layer.shapes);
  walk(layer.ks);
}

// 레이어의 일부 도형 묶음(groups)을 새 레이어(name)로 떼어낸다. 새 레이어가 위에 그려진다.
function splitLayer(data, layerName, groups, name) {
  const { list, i, layer } = findLayer(data, layerName);
  const part = JSON.parse(JSON.stringify(layer));
  part.nm = name;
  part.ind = Math.max(...list.map((l) => l.ind ?? 0)) + 1;
  part.shapes = groups.map((g) => layer.shapes[g]);
  layer.shapes = layer.shapes.filter((_, g) => !groups.includes(g));
  list.splice(i, 0, part);
}

export function prepare(data, interactions = []) {
  for (const it of interactions) {
    if (it.freeze) freezeFrom(findLayer(data, it.freeze.layer).layer, it.freeze.from);
    if (it.type === 'drag') splitLayer(data, it.layer, it.groups, it.as);
  }
  for (const list of layerLists(data)) for (const l of list) l.cl = layerClass(l.nm);
  return data;
}

// ---- 재생 중 ----

function el(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function tween(from, to, ms, onStep, onDone) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const e = 1 - Math.pow(1 - t, 3);
    onStep({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

// 고른 카드: 노란색 + "My prediction" 표시
function highlight(card) {
  const b = card.getBBox();
  const g = el('g', { class: 'tutu-pick' });
  g.append(el('rect', { x: b.x, y: b.y, width: b.width, height: b.height, rx: 12, fill: YELLOW, style: 'mix-blend-mode:multiply' }));
  const badge = el('g', { transform: `translate(${b.x + 18} ${b.y + b.height - 34})` });
  badge.append(el('rect', { width: 84, height: 20, rx: 10, fill: '#111' }));
  const text = el('text', { x: 42, y: 13.5, 'text-anchor': 'middle', fill: '#fff', 'font-size': 9.5, 'font-weight': 600, 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' });
  text.textContent = 'My prediction';
  badge.append(text);
  g.append(badge);
  card.append(g);
  return g;
}

/*
  it   : 인터랙션 설정 (data/lectures.js)
  svg  : Lottie가 그린 svg
  toSvg: 포인터 이벤트 → svg 좌표
  done : 조작이 끝나면 호출 → 영상 이어서 재생
*/
export function create(it, svg, toSvg, done) {
  const find = (name) => svg.querySelector(`.${layerClass(name)}`);

  if (it.type === 'choose') {
    let mark = null;
    return {
      at: it.at,
      tap(e) {
        const card = it.options.map(find).find((c) => c?.contains(e.target));
        if (!card) return false;
        mark?.remove();
        mark = highlight(card);
        done();
        return true;
      },
      reset() {
        mark?.remove();
        mark = null;
      },
    };
  }

  if (it.type === 'drag') {
    const item = find(it.as);
    // 레이어 안쪽을 한 번 더 감싸서 우리가 움직인다 (레이어 자체 transform은 Lottie가 관리)
    const inner = el('g', {});
    inner.append(...item.childNodes);
    item.append(inner);
    let offset = { x: 0, y: 0 };
    let drag = null;
    const moveTo = (p) => {
      offset = p;
      inner.setAttribute('transform', `translate(${p.x} ${p.y})`);
    };
    return {
      at: it.at,
      down(e) {
        if (!item.contains(e.target)) return false;
        drag = { from: toSvg(e), start: offset };
        return true;
      },
      move(e) {
        if (!drag) return;
        const p = toSvg(e);
        moveTo({ x: drag.start.x + p.x - drag.from.x, y: drag.start.y + p.y - drag.from.y });
      },
      up() {
        if (!drag) return;
        drag = null;
        const box = inner.getBBox(); // 원래 자리 기준 (inner 자신의 이동은 포함 안 됨)
        const target = find(it.target).getBBox();
        const cx = box.x + box.width / 2 + offset.x;
        const cy = box.y + box.height / 2 + offset.y;
        const hit = cx > target.x - 30 && cx < target.x + target.width + 30
          && cy > target.y - 120 && cy < target.y + target.height + 30;
        if (!hit) return tween(offset, { x: 0, y: 0 }, 250, moveTo); // 제자리로
        // 저울 위에 올려놓기: 가로 가운데, 바닥을 저울 윗면에
        const onTop = { x: target.x + target.width / 2 - (box.x + box.width / 2), y: target.y - (box.y + box.height) };
        tween(offset, onTop, 250, moveTo, done);
      },
      reset() {
        drag = null;
        moveTo({ x: 0, y: 0 });
      },
    };
  }
  throw new Error(`Unknown interaction: ${it.type}`);
}

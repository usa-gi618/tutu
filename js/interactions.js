// 강의 영상(Lottie) 속 인터랙션: 카드·보기 고르기, 끌어다 놓기, 마이크 누르기.
// 1) prepare(): 영상 데이터를 불러올 때 손본다
//    - 모든 레이어에 class "L-레이어이름"을 붙여 코드에서 찾을 수 있게
//    - freeze: 영상에 미리 들어 있는 정답 강조 같은 애니메이션을 지운다
//    - split : 한 레이어 안의 도형 묶음(보기 하나, 끌 물체 등)을 별도 레이어로 떼어낸다
// 2) create(): 재생 중 그 지점(at)에 오면 영상을 멈추고 학생의 조작을 받는다. 끝나면 done().
// 레이어는 scene(장면 레이어 이름) 안에서 찾는다. 장면마다 같은 이름의 레이어가 있을 수 있어서.
const NS = 'http://www.w3.org/2000/svg';
const YELLOW = '#FFFD6C';
const GREEN = '#55DF94';
const GREY = '#D9D9D9';

export const layerClass = (name) => `L-${String(name).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

function sceneLayers(data, scene) {
  const top = data.layers.find((l) => l.nm === scene);
  if (!top) throw new Error(`Lottie scene not found: ${scene}`);
  return data.assets.find((a) => a.id === top.refId).layers;
}
function findLayer(data, scene, name) {
  const list = sceneLayers(data, scene);
  const i = list.findIndex((l) => l.nm === name);
  if (i === -1) throw new Error(`Lottie layer not found: ${scene} / ${name}`);
  return { list, i, layer: list[i] };
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

// 레이어의 도형 묶음(groups: 원래 레이어 기준 순서 번호 또는 묶음 이름)을 새 레이어(name)로 떼어낸다.
// 새 레이어가 위에 그려진다. 같은 레이어를 여러 번 나눠도 번호는 항상 원래 순서 기준.
const originalShapes = new WeakMap();
function splitLayer(data, scene, layerName, groups, name) {
  const { list, i, layer } = findLayer(data, scene, layerName);
  if (!originalShapes.has(layer)) originalShapes.set(layer, [...layer.shapes]);
  const original = originalShapes.get(layer);
  const picked = groups.map((g) => (typeof g === 'number' ? original[g] : original.find((s) => s.nm === g)));
  const part = JSON.parse(JSON.stringify(layer));
  part.nm = name;
  part.ind = Math.max(...list.map((l) => l.ind ?? 0)) + 1;
  part.shapes = JSON.parse(JSON.stringify(picked));
  layer.shapes = layer.shapes.filter((s) => !picked.includes(s));
  list.splice(i, 0, part);
}

// 레이어의 도형 묶음(groups) 색 바꾸기: { fill: [r,g,b], stroke: [r,g,b], strokeWidth } (0~255)
function restyle(data, scene, { layer, groups, fill, stroke, strokeWidth }) {
  const { layer: l } = findLayer(data, scene, layer);
  const rgba = (c) => [...c.map((v) => v / 255), 1];
  const walk = (items) => items.forEach((x) => {
    if (x.ty === 'gr') return walk(x.it);
    if (x.ty === 'fl' && fill) x.c = { a: 0, k: rgba(fill) };
    if (x.ty === 'st' && stroke) x.c = { a: 0, k: rgba(stroke) };
    if (x.ty === 'st' && strokeWidth !== undefined) x.w = { a: 0, k: strokeWidth };
  });
  groups.forEach((g) => walk([l.shapes[g]]));
}

export function prepare(data, interactions = []) {
  for (const it of interactions) {
    if (it.freeze) freezeFrom(findLayer(data, it.scene, it.freeze.layer).layer, it.freeze.from);
    for (const r of it.restyle ?? []) restyle(data, it.scene, r);
    for (const s of it.split ?? []) splitLayer(data, it.scene, s.layer, s.groups, s.as);
    for (const name of it.hide ?? []) findLayer(data, it.scene, name).layer.hd = true; // 숨길 레이어
  }
  for (const l of data.layers) l.cl = layerClass(l.nm);
  for (const a of data.assets ?? []) for (const l of a.layers ?? []) l.cl = layerClass(l.nm);
  return data;
}

// ---- 재생 중 ----

function svgEl(tag, attrs) {
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

// 레이어 위에 색을 덮는다 (multiply라 글자는 그대로 보인다)
function tint(layer, color, radius) {
  const b = layer.getBBox();
  const rect = svgEl('rect', { class: 'tutu-mark', x: b.x, y: b.y, width: b.width, height: b.height, rx: radius, fill: color, style: 'mix-blend-mode:multiply' });
  layer.append(rect);
  return { rect, box: b };
}

// 카드 위 검은 표시 (예: My prediction). at: 'bottom-left'(기본) | 'top-right'
function badge(layer, box, label, at = 'bottom-left') {
  const width = 14 + label.length * 5.4;
  const pos = at === 'top-right'
    ? { x: box.x + box.width - width - 14, y: box.y + 14 }
    : { x: box.x + 18, y: box.y + box.height - 34 };
  const g = svgEl('g', { class: 'tutu-mark', transform: `translate(${pos.x} ${pos.y})` });
  g.append(svgEl('rect', { width, height: 20, rx: 10, fill: '#111' }));
  const text = svgEl('text', { x: width / 2, y: 13.5, 'text-anchor': 'middle', fill: '#fff', 'font-size': 9.5, 'font-weight': 600, 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' });
  text.textContent = label;
  g.append(text);
  layer.append(g);
}

// 레이어 안 도형 색 바꾸기. map = { fill: [[원래 rgb, 바꿀 rgb], ...], stroke: [...] } (0~255)
// 처음 바꿀 때 원래 색을 기억해 두고 restore()로 되돌린다.
const rgbOf = (v) => (v?.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((n) => Math.round(Number(n)));
const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) <= 2);
function recolor(layer, map) {
  for (const attr of ['fill', 'stroke']) {
    for (const node of layer.querySelectorAll(`[${attr}]`)) {
      const key = `orig${attr}`;
      if (!(key in node.dataset)) node.dataset[key] = node.getAttribute(attr);
      const now = rgbOf(node.dataset[key]);
      const hit = (map[attr] ?? []).find(([from]) => same(now, from));
      node.setAttribute(attr, hit ? `rgb(${hit[1].join(',')})` : node.dataset[key]);
    }
  }
}
function restore(layer) {
  for (const attr of ['fill', 'stroke']) {
    for (const node of layer.querySelectorAll(`[data-orig${attr}]`)) node.setAttribute(attr, node.dataset[`orig${attr}`]);
  }
}
// 레이어 안쪽을 한 번 더 감싸서 우리가 움직인다 (레이어 자체 transform은 Lottie가 관리)
function wrap(layer) {
  const inner = svgEl('g', {});
  inner.append(...layer.childNodes);
  layer.append(inner);
  return inner;
}

// Figma/Lottie 색 (0~255)
const C = {
  black: [0, 0, 0], white: [255, 255, 255], green: [85, 223, 148],
  grey220: [220, 220, 220], grey171: [171, 171, 171], grey241: [241, 241, 241], grey110: [110, 110, 110],
};
// 나무 그림: 활성(초록 나무) ↔ 비활성(회색 나무)
const TREE_ON = { fill: [[C.grey171, C.black], [C.grey241, C.white], [C.grey220, C.green]], stroke: [[C.grey171, C.black]] };
const TREE_OFF = { fill: [[C.black, C.grey171], [C.white, C.grey241], [C.green, C.grey220]], stroke: [[C.black, C.grey171]] };

/*
  it   : 인터랙션 설정 (data/lectures.js)
  svg  : Lottie가 그린 svg
  toSvg: 포인터 이벤트 → svg 좌표
  done : 조작이 끝나면 호출 → 영상 이어서 재생
  lang : 지금 언어 ('en' | 'es')를 돌려주는 함수. 표시 문구가 { en, es }이면 그 언어로
*/
export function create(it, svg, toSvg, done, lang = () => 'en') {
  const say = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang()] ?? v.en : v);
  const find = (name) => svg.querySelector(`.${layerClass(it.scene)} .${layerClass(name)}`);
  // 탭이 레이어에 맞았는지: 도형 위를 눌렀거나, 도형 사이 빈틈(글자 사이 등)이라도 레이어 테두리 상자 안이면 맞은 것으로
  const hits = (name, e) => {
    const layer = find(name);
    if (!layer) return false;
    if (layer.contains(e.target)) return true;
    if (e.clientX === undefined) return false;
    const r = layer.getBoundingClientRect();
    return r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  const clearMarks = () => svg.querySelectorAll(`.${layerClass(it.scene)} .tutu-mark`).forEach((m) => m.remove());

  // 카드 고르기: 고른 카드에 노란색 + 표시 (예: My prediction)
  if (it.type === 'pick') {
    const api = {
      at: it.at,
      choice: null, // 고른 카드 레이어 이름 (Recap에서 사용)
      tap(e) {
        const name = it.options.find((n) => find(n)?.contains(e.target)) ?? it.options.find((n) => hits(n, e));
        if (!name) return false;
        api.choice = name;
        clearMarks();
        const card = find(name);
        const { box } = tint(card, YELLOW, 12);
        badge(card, box, say(it.badge), it.badgeAt);
        done();
        return true;
      },
      reset() {
        api.choice = null;
        clearMarks();
      },
    };
    return api;
  }

  // 확인 문제: 고른 보기가 정답이면 초록, 틀리면 회색 + 정답을 초록으로
  if (it.type === 'answer') {
    return {
      at: it.at,
      tap(e) {
        const name = it.options.find((n) => find(n)?.contains(e.target)) ?? it.options.find((n) => hits(n, e));
        if (!name) return false;
        clearMarks();
        if (name !== it.answer) tint(find(name), GREY, 8);
        tint(find(it.answer), GREEN, 8);
        done();
        return true;
      },
      reset: clearMarks,
    };
  }

  // 누르기: 마이크 등 target 레이어를 탭하면 이어서 재생
  if (it.type === 'tap') {
    return {
      at: it.at,
      tap(e) {
        if (!hits(it.target, e)) return false;
        done();
        return true;
      },
      reset() {},
    };
  }

  // 슬라이더: knob이 머무는 구간의 나무가 컬러, 나머지는 회색. 끝(to)까지 끌면 완료. fill 막대가 knob을 따라 늘어난다.
  if (it.type === 'slider') {
    const knob = wrap(find(it.knob));
    const fill = wrap(find(it.fill));
    const track = find(it.track);
    const trees = it.trees.map((t) => ({ ...t, el: find(t.layer) }));
    let x = it.start;
    let drag = null;
    const colorNearest = () => {
      const near = trees.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
      trees.forEach((t) => recolor(t.el, t === near ? TREE_ON : TREE_OFF));
    };
    const setX = (v) => {
      x = Math.max(it.from, Math.min(it.to, v));
      knob.setAttribute('transform', `translate(${x - it.start} 0)`);
      const sx = (x - it.from) / (it.start - it.from); // 원래 채워진 길이 대비
      fill.setAttribute('transform', `translate(${it.from} 0) scale(${sx} 1) translate(${-it.from} 0)`);
      colorNearest();
    };
    return {
      at: it.at,
      down(e) {
        if (!knob.parentNode.contains(e.target) && !track.contains(e.target) && !fill.parentNode.contains(e.target)) return false;
        drag = true;
        setX(toSvg(e).x);
        return true;
      },
      move(e) {
        if (drag) setX(toSvg(e).x);
      },
      up() {
        if (!drag) return;
        drag = null;
        if (x < it.to - 25) return; // 끝까지 가야 완료
        setX(it.to);
        setTimeout(done, 350);
      },
      reset() {
        drag = null;
        setX(it.start);
        trees.forEach((t) => restore(t.el));
      },
    };
  }

  // 스위치: 탭하면 켜고 끈다. 켜진 스위치는 초록, 꺼진 스위치는 회색.
  // 상자 안에 꺼진 것마다 "no ~" 표시. 모두 goal 상태가 되면 완료 → tree가 점점 자란다.
  if (it.type === 'toggles') {
    const rows = it.toggles.map((name, i) => ({
      row: find(name),
      track: find(`${name}-track`),
      knob: wrap(find(`${name}-knob`)),
      original: it.original[i], // 영상에 원래 그려진 상태 (손잡이 위치 기준)
      on: it.start[i],
    }));

    // "no light / no water / no CO₂" 표시: 검은 글자만. 켜진 조건은 회색 + 취소선
    const box = find(it.box);
    const chips = svgEl('g', { class: 'tutu-chips' });
    rows.forEach((r, i) => {
      const g = svgEl('g', { transform: `translate(${it.chips.x} ${it.chips.y})` });
      const t = svgEl('text', { x: 0, y: 0, fill: '#000', 'font-size': 11, 'font-weight': 600, 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' });
      const strike = svgEl('line', { y1: -3.5, y2: -3.5, x1: -1, stroke: 'rgb(171,171,171)', 'stroke-width': 1.5, style: 'display:none' });
      g.append(t, strike);
      chips.append(g);
      r.chip = { g, t, strike };
    });
    box.append(chips);
    // 글자 폭을 재서 한 줄로 늘어놓는다 (화면에 그려진 뒤에만 잴 수 있음)
    let laidOut = false;
    const layoutChips = () => {
      let x = it.chips.x;
      for (const r of rows) {
        const w = r.chip.t.getComputedTextLength();
        if (!w) return;
        r.chip.g.setAttribute('transform', `translate(${x} ${it.chips.y})`);
        r.chip.strike.setAttribute('x2', w + 1);
        x += w + 12;
      }
      laidOut = true;
    };

    const draw = (r) => {
      recolor(r.track, { fill: [[C.black, r.on ? C.green : C.grey220], [C.grey220, r.on ? C.green : C.grey220]] });
      recolor(r.row, { fill: [[C.black, r.on ? C.black : C.grey110], [C.grey110, r.on ? C.black : C.grey110]] });
      const shift = r.on === r.original ? 0 : (r.on ? it.travel : -it.travel);
      r.knob.setAttribute('transform', `translate(${shift} 0)`);
      r.chip.t.setAttribute('fill', r.on ? 'rgb(171,171,171)' : '#000');
      r.chip.strike.style.display = r.on ? '' : 'none';
    };
    rows.forEach(draw);

    // 나무가 점점 자라기: 완료 후 영상이 재생되는 만큼(growFrames 동안) 줄기가 길어지고 잎(원)이 커진다.
    // 그림을 확대하지 않고 도형을 다시 그린다 (선 굵기는 그대로). 영상 위치에 맞추므로 멈추면 멈추고 되감으면 작아진다.
    // 자라기 시작하면 영상 속 원래 나무는 숨기고 같은 모양의 벡터 나무로 바꾼다.
    const original = wrap(find(it.tree));
    const g = it.grow; // { x, ground, stem: [from, to], r: [from, to] }
    const stem = svgEl('line', { x1: g.x, x2: g.x, y1: g.ground, stroke: '#000', 'stroke-width': 4, 'stroke-linecap': 'round' });
    const leaf = svgEl('circle', { cx: g.x, fill: 'rgb(85,223,148)', stroke: '#000', 'stroke-width': 3 });
    const vectorTree = svgEl('g', { class: 'tutu-tree', style: 'display:none' });
    vectorTree.append(stem, leaf);
    box.append(vectorTree);
    const setGrowth = (f) => {
      const p = Math.max(0, Math.min(1, (f - it.at) / it.growFrames));
      const grown = p > 0;
      original.style.display = grown ? 'none' : '';
      vectorTree.style.display = grown ? '' : 'none';
      if (!grown) return;
      const e = p * p * (3 - 2 * p);
      const len = g.stem[0] + (g.stem[1] - g.stem[0]) * e;
      const r = g.r[0] + (g.r[1] - g.r[0]) * e;
      const top = g.ground - len;
      stem.setAttribute('y2', top);
      leaf.setAttribute('cy', top - r + 2); // 원래처럼 잎이 줄기 끝을 살짝 덮는다
      leaf.setAttribute('r', r);
    };

    let finished = false;
    return {
      at: it.at,
      // 상자가 나타나기 전에는 표시를 숨긴다
      onFrame(f) {
        // Lottie는 장면이 화면에 나올 때 원래 색을 칠한다 → 그 뒤에 매번 지금 상태로 다시 칠한다
        rows.forEach(draw);
        // 언어가 바뀌면 문구를 다시 쓰고 다시 늘어놓는다
        rows.forEach((r, i) => {
          const text = say(it.labels)[i];
          if (r.chip.t.textContent !== text) {
            r.chip.t.textContent = text;
            laidOut = false;
          }
        });
        chips.style.display = f >= it.at - 15 ? '' : 'none';
        if (!laidOut && f >= it.at - 15) layoutChips();
        setGrowth(finished ? f : it.at);
      },
      tap(e) {
        if (finished) return true;
        const r = rows.find((x) => [x.row, x.track, x.knob.parentNode].some((n) => n.contains(e.target)));
        if (!r) return false;
        r.on = !r.on;
        draw(r);
        if (rows.every((x, i) => x.on === it.goal[i])) {
          finished = true;
          setTimeout(done, 400);
        }
        return true;
      },
      reset() {
        finished = false;
        setGrowth(it.at);
        rows.forEach((r, i) => { r.on = it.start[i]; draw(r); });
      },
    };
  }

  // 끌어다 놓기: item 레이어를 target 레이어 위로
  if (it.type === 'drag') {
    const item = find(it.item);
    const inner = wrap(item);
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
        // 위에 올려놓기: 가로 가운데, 바닥을 target 윗면에
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

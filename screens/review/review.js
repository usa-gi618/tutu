// 영상이 끝난 뒤 복습 문제 (가로). 앱 디자인(강의 화면·Recap·종료 화면)에 맞춰 와이어프레임을 다시 구성.
//   quiz    : 과목마다 수업 방식에 맞춘 형식 (아래 '문제' 참고). 오른쪽 카드를 왼쪽 칸에 끌어다 놓는다 (탭하면 다음 빈칸으로)
//             틀리면 틀린 칸 노랑 + 힌트 → 다시 풀기. 두 번째도 틀리면 how로
//   how     : 설명 + 영상 다시 보기(rewatch) + 비슷한 문제(영상을 다시 봐야 열림)
//   similar : 비슷한 문제. 맞히면 done
//   done    : 강의 최종 화면 (새로 이해한 개념, 오늘 남은 강의)
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';

const CLOSE_ICON = `
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M16 16 L28 28 M28 16 L16 28" stroke="#111" stroke-width="2" stroke-linecap="round" />
  </svg>`;
const PLAY_ICON = '<svg width="12" height="14" viewBox="0 0 12 14"><path d="M1 1 L11 7 L1 13 Z" fill="#000" /></svg>';
const CHECK_ICON = '<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="13" fill="#1f9d5b" /><path d="M7.5 13.5 L11.2 17 L18.5 9.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>';

export default {
  render() {
    return `
      <div class="land">
        <button class="close" type="button" aria-label="Close">${CLOSE_ICON}</button>
        <p class="crumb"></p>
        <div class="view"></div>
      </div>
    `;
  },

  mount(el, go) {
    const index = state.watching >= 0 ? state.watching : 0;
    const lecture = TODAY[index];
    const data = lecture.review;
    const land = el.querySelector('.land');
    const view = el.querySelector('.view');
    const crumb = el.querySelector('.crumb');

    // 처음 들어오면 새로 시작, 영상 다시 보기에서 돌아오면 이어서
    if (!state.review || state.review.lecture !== index) {
      state.review = { lecture: index, stage: data ? 'quiz' : 'done', tries: 0, rewatched: false };
    }
    const R = state.review;

    el.querySelector('.close').addEventListener('click', () => go('home', { transition: 'pop' }));

    // ---------- 문제 (과목마다 수업 방식에 맞춘 형식) ----------
    //   order    : 블록을 빈칸에 순서대로 (생물: 실험 순서)
    //   equation : 양쪽에 할 계산을 끌어다 놓으면 풀이가 한 줄씩 써진다 (대수: 저울처럼 양쪽에 같은 계산)
    //   annotate : 대사 속 밑줄 친 표현에 이름표 붙이기 (영어: 표현 읽기)
    //   argue    : 주장 + 근거 + 반대편에 대한 답을 카드로 짜 맞추기 (역사: 토론)
    let slots = [];   // 빈칸마다 들어간 카드 번호 (없으면 null)
    let marks = [];   // 채점 후 칸 표시: 'right' | 'wrong' | null
    let locked = new Set(); // 처음부터 채워져 있어 못 바꾸는 칸
    let q = null;     // 지금 문제 (quiz | similar)
    let showHint = false;
    let hintText = '';
    let lines = [];   // equation: 지금까지 쓴 풀이 줄
    let solved = 0;   // equation: 맞게 한 단계 수

    const LABELS = {
      order: 'Not graded · put in order',
      equation: 'Not graded · solve step by step',
      annotate: 'Not graded · label the line',
      argue: 'Not graded · build your argument',
    };

    // 비슷한 문제(argue flip): 앞 문제와 같은 카드로, 주장만 반대편으로 고정
    function resolve(problem) {
      if (problem.type !== 'argue' || !problem.flip) return problem;
      return { ...data.quiz, ...problem, pool: data.quiz.pool };
    }

    function startQuiz(problem) {
      q = resolve(problem);
      marks = [];
      locked = new Set();
      showHint = false;
      hintText = q.hint;
      if (q.type === 'equation') {
        slots = [null];
        lines = [{ text: q.start }];
        solved = 0;
      } else if (q.type === 'annotate') {
        slots = q.text.filter((t) => typeof t === 'object').map(() => null);
      } else if (q.type === 'argue') {
        slots = q.slots.map(() => null);
        if (q.flip) {
          const other = R.side === 'R' ? 'B' : 'R';
          slots[0] = q.cards.findIndex((c) => c.role === 'claim' && c.side === other);
          locked.add(0);
        }
      } else {
        slots = q.steps.map(() => null);
      }
      drawQuiz();
    }

    const cardText = (b) => (q.cards ? q.cards[b].text ?? q.cards[b] : q.steps[b]);
    const pool = () => (q.type === 'equation' ? q.ops.map((_, i) => i) : q.pool.filter((b) => !slots.includes(b)));
    const full = () => slots.every((s) => s !== null);
    const slotClass = (i) => `${slots[i] === null ? 'empty' : ''} ${marks[i] ?? (locked.has(i) ? 'right locked' : '')}`;
    const block = (b, extra = '') => `<div class="block ${extra}" data-block="${b}">${cardText(b)}</div>`;

    function workHtml() {
      if (q.type === 'equation') {
        const done = solved === q.steps.length;
        return `
          <div class="eq">
            ${lines.map((l) => `<p class="eq-line ${l.kind ?? ''}">${l.text}</p>`).join('')}
            ${done ? '' : `
              <div class="slot op-slot ${slotClass(0)}" data-slot="0">
                ${marks[0] === 'wrong' ? `<span class="op-tried">${q.ops[slots[0]]}</span>` : ''}
                <span>Drop what to do to both sides</span>
              </div>`}
          </div>`;
      }
      if (q.type === 'annotate') {
        let n = -1;
        const parts = q.text.map((t) => {
          if (typeof t === 'string') return t;
          n += 1;
          const b = slots[n];
          return `<span class="slot phrase ${slotClass(n)}" data-slot="${n}"><u>${t.phrase}</u>${b === null ? '<span class="tag-empty">label</span>' : block(b, 'tag')}</span>`;
        });
        return `<div class="quote"><p class="label">${q.source}</p><p class="quote-text">${parts.join('')}</p></div>`;
      }
      if (q.type === 'argue') {
        return `
          <ol class="slots argue">
            ${slots.map((b, i) => `
              <li class="slot ${slotClass(i)}" data-slot="${i}">
                <span class="arg-label">${q.slots[i]}</span>
                ${b === null ? '' : block(b)}
              </li>`).join('')}
          </ol>`;
      }
      return `
        <ol class="slots">
          ${slots.map((b, i) => `
            <li class="slot ${slotClass(i)}" data-slot="${i}">
              <span class="num">${i + 1}</span>
              ${b === null ? '' : block(b)}
            </li>`).join('')}
        </ol>`;
    }

    function drawQuiz() {
      const similar = q.prompt === data.similar.prompt;
      crumb.textContent = `${lecture.subject} · ${similar ? 'One more like it' : 'Check'}`;
      const checked = marks.length > 0;
      const wrong = marks.includes('wrong');
      const left = pool();
      let button = '';
      if (q.type === 'equation') {
        button = `<p class="eq-step">Step ${Math.min(solved + 1, q.steps.length)} of ${q.steps.length}</p>`;
      } else if (checked && wrong) {
        button = '<button class="btn dark" type="button" data-act="retry">Try again</button>';
      } else {
        button = `<button class="btn dark" type="button" data-act="check" ${full() ? '' : 'disabled'}>Check</button>`;
      }
      view.innerHTML = `
        <div class="quiz type-${q.type}">
          <div class="prompt">
            <p class="label">${LABELS[q.type]}</p>
            <h1>${q.prompt}</h1>
          </div>
          ${workHtml()}
          <div class="pool">
            ${left.map((b) => (q.type === 'equation' ? `<div class="block op" data-block="${b}">${q.ops[b]}</div>` : block(b))).join('')}
            ${left.length ? '' : '<p class="pool-done">All cards placed</p>'}
          </div>
          <div class="foot">
            <p class="hint ${showHint ? 'show' : ''}"><i></i>Hint: ${hintText}</p>
            ${button}
          </div>
        </div>`;
    }

    // 채점: 칸마다 'right' | 'wrong'
    function grade() {
      if (q.type === 'annotate') return slots.map((b, i) => (b === q.answer[i] ? 'right' : 'wrong'));
      if (q.type === 'argue') {
        const claim = q.cards[slots[0]];
        const side = claim.role === 'claim' ? claim.side : null;
        if (side) R.side = side;
        const fits = (b, role) => q.cards[b].role === role && q.cards[b].side === side;
        return [side ? 'right' : 'wrong', fits(slots[1], 'evidence') ? 'right' : 'wrong', fits(slots[2], 'counter') ? 'right' : 'wrong'];
      }
      return slots.map((b, i) => (b === i ? 'right' : 'wrong'));
    }

    // 맞으면 마무리, 틀리면 힌트 (첫 문제에서 두 번 틀리면 설명 화면으로)
    function afterCheck(ok) {
      if (ok) {
        drawQuiz();
        setTimeout(() => {
          R.stage = 'done';
          drawStage();
        }, 700);
        return;
      }
      R.tries += 1;
      if (q.prompt === data.quiz.prompt && R.tries >= 2) {
        drawQuiz();
        setTimeout(() => {
          R.stage = 'how';
          drawStage();
        }, 1200);
        return;
      }
      showHint = true;
      drawQuiz();
    }

    function check() {
      marks = grade();
      afterCheck(!marks.includes('wrong'));
    }

    // equation: 양쪽에 계산 하나 하기
    function applyOp(b) {
      const step = q.steps[solved];
      if (q.ops[b] !== step.op) {
        slots = [b];
        marks = ['wrong'];
        hintText = q.wrong?.[q.ops[b]] ?? q.hint;
        return afterCheck(false);
      }
      slots = [null];
      marks = [];
      showHint = false;
      lines.push({ text: step.work, kind: 'work' }, { text: step.result, kind: 'result' });
      solved += 1;
      if (solved === q.steps.length) {
        lines[lines.length - 1].kind = 'result final';
        return afterCheck(true);
      }
      drawQuiz();
    }

    // 다시 풀기: 맞은 칸은 그대로, 틀린 카드는 오른쪽으로
    function retry() {
      slots = slots.map((b, i) => (marks[i] === 'right' || locked.has(i) ? b : null));
      marks = [];
      drawQuiz();
    }

    // 카드 놓기 (to: 빈칸 번호 또는 null = 오른쪽으로)
    function place(card, to) {
      if (q.type === 'equation') return to === null ? drawQuiz() : applyOp(card);
      if (to !== null && locked.has(to)) return drawQuiz();
      const from = slots.indexOf(card);
      if (to === null) {
        if (from !== -1) slots[from] = null;
      } else {
        const occupant = slots[to];
        if (from !== -1) slots[from] = occupant; // 칸끼리 바꾸기
        else if (occupant !== null) slots[to] = null;
        slots[to] = card;
      }
      marks = [];
      drawQuiz();
    }

    // 끌기 (화면이 돌아가 있어서 포인터 이동을 가로 화면 기준으로 바꾼다)
    const toLand = (e) => {
      const r = el.getBoundingClientRect();
      return { x: r.height - (e.clientY - r.top), y: e.clientX - r.left };
    };
    let drag = null;
    view.addEventListener('pointerdown', (e) => {
      const blockEl = e.target.closest('.block');
      if (!blockEl || !q || R.stage === 'how' || R.stage === 'done') return;
      const slotEl = blockEl.closest('.slot');
      if (slotEl?.classList.contains('right')) return; // 맞은 칸은 고정
      land.setPointerCapture(e.pointerId);
      drag = { el: blockEl, block: Number(blockEl.dataset.block), start: toLand(e), moved: false, id: e.pointerId };
    });
    land.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = toLand(e);
      const dx = p.x - drag.start.x;
      const dy = p.y - drag.start.y;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      if (!drag.moved) return;
      drag.el.classList.add('dragging');
      drag.el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    land.addEventListener('pointerup', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.moved) {
        // 탭: 오른쪽 카드 → 첫 빈칸, 칸에 있는 카드 → 오른쪽으로
        const inSlot = q.type !== 'equation' && slots.includes(d.block);
        return place(d.block, inSlot ? null : slots.indexOf(null));
      }
      // 손을 뗀 곳의 빈칸 찾기
      const target = [...view.querySelectorAll('.slot')].find((s) => {
        const r = s.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (target?.classList.contains('right')) return drawQuiz();
      place(d.block, target ? Number(target.dataset.slot) : null);
    });

    view.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'check') check();
      if (act === 'retry') retry();
      if (act === 'rewatch') {
        state.rewatch = { from: data.rewatch.from, to: data.rewatch.to };
        state.playerBack = 'review';
        go('player');
      }
      if (act === 'solve' && R.rewatched) {
        R.stage = 'similar';
        drawStage();
      }
      if (act === 'home') go('home', { transition: 'pop' });
      if (act === 'next') {
        state.watching = nextLecture();
        state.playerBack = 'lecture';
        go('lecture');
      }
    });

    // ---------- 설명 + 다시 보기 + 비슷한 문제 ----------
    function drawHow() {
      crumb.textContent = `${lecture.subject} · Here’s how`;
      view.innerHTML = `
        <div class="how">
          <div class="card">
            <p class="label">Here’s how</p>
            <h2>${data.how}</h2>
            <button class="btn outline" type="button" data-act="rewatch">${PLAY_ICON}${data.rewatch.label}</button>
          </div>
          <div class="card ${R.rewatched ? '' : 'locked'}">
            <p class="label">One more like it</p>
            <h2>${data.similar.prompt}</h2>
            <p class="note">${R.rewatched ? 'Same idea, new experiment.' : 'Watch the experiment again to unlock.'}</p>
            <button class="btn dark" type="button" data-act="solve" ${R.rewatched ? '' : 'disabled'}>Solve it</button>
          </div>
        </div>`;
    }

    // ---------- 최종 화면 ----------
    function nextLecture() {
      const left = TODAY.map((_, i) => i).filter((i) => i !== index && !state.mastered.has(i) && !state.watched.has(i));
      return left[0] ?? -1;
    }
    function drawDone() {
      state.mastered.add(index);
      crumb.textContent = '';
      const left = TODAY.filter((_, i) => !state.mastered.has(i) && !state.watched.has(i) && !state.quickCheck[i]?.correct).length;
      view.innerHTML = `
        <div class="done">
          <div class="done-main">
            <p class="badge">${CHECK_ICON}New concept understood</p>
            <h1>${data?.concept ?? lecture.title}</h1>
            <p class="saved">Saved, even if you stop here.</p>
            <div class="btns">
              <button class="btn outline" type="button" data-act="home">Done for today</button>
              ${nextLecture() !== -1 ? '<button class="btn dark" type="button" data-act="next">Next lecture</button>' : ''}
            </div>
          </div>
          <div class="card left">
            <p class="label">Lectures left before tomorrow’s class</p>
            <p class="count">${left}</p>
          </div>
        </div>`;
    }

    function drawStage() {
      land.dataset.stage = R.stage;
      if (R.stage === 'quiz') startQuiz(data.quiz);
      if (R.stage === 'similar') startQuiz(data.similar);
      if (R.stage === 'how') drawHow();
      if (R.stage === 'done') drawDone();
    }
    drawStage();
  },
};

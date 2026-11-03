// 영상이 끝난 뒤 복습 문제 (가로). 앱 디자인(강의 화면·Recap·종료 화면)에 맞춰 와이어프레임을 다시 구성.
//   quiz    : 오른쪽 블록(실험 단계)을 왼쪽 빈칸 3개에 끌어다 넣어 순서 맞추기 (탭하면 다음 빈칸으로)
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

    // ---------- 순서 맞추기 ----------
    let slots = [];   // 빈칸마다 들어간 블록 번호 (없으면 null)
    let marks = [];   // 채점 후 칸 표시: 'right' | 'wrong' | null
    let q = null;     // 지금 문제 (quiz | similar)
    let showHint = false;

    function startQuiz(problem) {
      q = problem;
      slots = q.steps.map(() => null);
      marks = [];
      showHint = false;
      drawQuiz();
    }

    const pool = () => q.pool.filter((b) => !slots.includes(b));
    const full = () => slots.every((s) => s !== null);

    function drawQuiz() {
      const similar = q === data.similar;
      crumb.textContent = `${lecture.subject} · ${similar ? 'One more like it' : 'Check'}`;
      const checked = marks.length > 0;
      const wrong = marks.includes('wrong');
      view.innerHTML = `
        <div class="quiz">
          <div class="prompt">
            <p class="label">Not graded · put in order</p>
            <h1>${q.prompt}</h1>
          </div>
          <ol class="slots">
            ${slots.map((b, i) => `
              <li class="slot ${b === null ? 'empty' : ''} ${marks[i] ?? ''}" data-slot="${i}">
                <span class="num">${i + 1}</span>
                ${b === null ? '' : `<div class="block" data-block="${b}">${q.steps[b]}</div>`}
              </li>`).join('')}
          </ol>
          <div class="pool">
            ${pool().map((b) => `<div class="block" data-block="${b}">${q.steps[b]}</div>`).join('')}
            ${pool().length ? '' : '<p class="pool-done">All steps placed</p>'}
          </div>
          <div class="foot">
            <p class="hint ${showHint ? 'show' : ''}"><i></i>Hint: ${q.hint}</p>
            ${checked && wrong
              ? '<button class="btn dark" type="button" data-act="retry">Try again</button>'
              : `<button class="btn dark" type="button" data-act="check" ${full() ? '' : 'disabled'}>Check</button>`}
          </div>
        </div>`;
    }

    function check() {
      marks = slots.map((b, i) => (b === i ? 'right' : 'wrong'));
      const ok = !marks.includes('wrong');
      if (ok) {
        drawQuiz();
        setTimeout(() => {
          R.stage = 'done';
          drawStage();
        }, 700);
        return;
      }
      R.tries += 1;
      if (q === data.quiz && R.tries >= 2) {
        drawQuiz();
        setTimeout(() => {
          R.stage = 'how';
          drawStage();
        }, 900);
        return;
      }
      showHint = true;
      drawQuiz();
    }

    // 다시 풀기: 맞은 칸은 그대로, 틀린 블록은 오른쪽으로
    function retry() {
      slots = slots.map((b, i) => (marks[i] === 'right' ? b : null));
      marks = [];
      drawQuiz();
    }

    // 블록 놓기 (to: 빈칸 번호 또는 null = 오른쪽으로)
    function place(block, to) {
      const from = slots.indexOf(block);
      if (to === null) {
        if (from !== -1) slots[from] = null;
      } else {
        const occupant = slots[to];
        if (from !== -1) slots[from] = occupant; // 칸끼리 바꾸기
        else if (occupant !== null) slots[to] = null;
        slots[to] = block;
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
        // 탭: 오른쪽 블록 → 첫 빈칸, 칸에 있는 블록 → 오른쪽으로
        const inSlot = slots.includes(d.block);
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

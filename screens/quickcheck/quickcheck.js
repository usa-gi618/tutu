// Figma 11565:3916 (Quick check)
// 오늘 강의마다 한 문제씩. 보기를 고르면 초록색, Next로 다음 문제. 마지막 문제 뒤에는 결과 화면.
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';

const NOT_SURE = 'Not sure yet';
const OPTION_TOP = 298;
const OPTION_GAP = 66;
const SWAP_MS = 200;

export default {
  render() {
    return `
      <div class="abs cy heading">Quick check</div>
      <div class="body"></div>
      <button class="cta" type="button" disabled>Next</button>
    `;
  },

  mount(el, go) {
    const body = el.querySelector('.body');
    const next = el.querySelector('.cta');
    let index = 0;
    let choice = -1;
    let timer = null;
    state.quickCheck = [];

    function show() {
      const { subject, title, quiz } = TODAY[index];
      const options = [...quiz.options, NOT_SURE];
      choice = -1;
      next.disabled = true;
      body.innerHTML = `
        <div class="lecture">
          <div class="abs cy subject">${subject}</div>
          <div class="abs cy title">${title}</div>
        </div>
        <p class="question">${quiz.question}</p>
        ${options.map((o, i) => `
          <button class="option" type="button" data-index="${i}" style="top:${OPTION_TOP + i * OPTION_GAP}px">${o}</button>`).join('')}
      `;
    }

    body.addEventListener('click', (e) => {
      const option = e.target.closest('.option');
      if (!option) return;
      choice = Number(option.dataset.index);
      body.querySelectorAll('.option').forEach((o) => o.classList.toggle('selected', o === option));
      next.disabled = false;
    });

    next.addEventListener('click', () => {
      if (choice === -1) return;
      const { quiz } = TODAY[index];
      state.quickCheck[index] = { choice, correct: choice === quiz.answer };

      if (index === TODAY.length - 1) return go('result');
      index += 1;
      body.classList.add('swapping');
      timer = setTimeout(() => {
        show();
        body.classList.remove('swapping');
      }, SWAP_MS);
    });

    show();
    return () => clearTimeout(timer);
  },
};

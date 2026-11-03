// Figma 11565:3943 (You already get this one)
// Quick Check 결과: 맞힌 강의는 Pass(건너뛰어도 됨), 틀린 강의는 Review(봐야 함).
// 카드(Pass·Review 모두)를 탭해서 고르면(앞으로 떠오름) Watch the Video가 활성화된다.
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';

function card({ lecture, index }, kind) {
  return `
    <div class="card ${kind}" data-index="${index}">
      <div class="card-globe"><img class="fill" src="assets/globe.svg" alt="" /></div>
      <div class="abs cy subject">${lecture.subject}</div>
      <div class="abs cy title">${lecture.title}</div>
      <div class="abs cy period">${lecture.period}</div>
      <div class="stamp">${kind === 'pass' ? 'Pass' : 'Review'}</div>
    </div>`;
}

function section(items, kind) {
  if (!items.length) return '';
  const many = items.length > 1;
  const label = kind === 'pass'
    ? `You can <b>skip</b> ${many ? 'these lectures' : 'this lecture'}.`
    : `You need to <b>watch</b> ${many ? 'these lectures' : 'this lecture'}.`;
  return `
    <div class="section">
      <p class="label">${label}</p>
      ${items.map((item) => card(item, kind)).join('')}
    </div>`;
}

function split() {
  const items = TODAY.map((lecture, index) => ({ lecture, index }));
  return {
    passed: items.filter(({ index }) => state.quickCheck[index]?.correct),
    review: items.filter(({ index }) => !state.quickCheck[index]?.correct),
  };
}

export default {
  render() {
    const { passed, review } = split();
    const heading = passed.length ? 'You already<br />get this one.' : 'Let’s catch up<br />on today.';

    return `
      <div class="scroll">
        <div class="title-row">
          <button class="back" type="button" aria-label="Back to home">
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
              <path d="M17 7 L6 18 L17 29" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <h1 class="heading">${heading}</h1>
        </div>
        ${section(passed, 'pass')}
        ${section(review, 'review')}
      </div>
      <div class="fade"></div>
      <button class="cta" type="button" disabled>Watch the Video</button>
    `;
  },

  mount(el, go) {
    const scroll = el.querySelector('.scroll');
    const cta = el.querySelector('.cta');
    let selected = -1;

    function select(index) {
      selected = index;
      scroll.querySelectorAll('.card').forEach((c) => c.classList.toggle('selected', Number(c.dataset.index) === index));
      scroll.classList.toggle('has-selected', index !== -1);
      cta.disabled = index === -1;
    }

    scroll.addEventListener('click', (e) => {
      const c = e.target.closest('.card');
      if (!c) return select(-1); // 빈 곳을 탭하면 해제
      const index = Number(c.dataset.index);
      select(index === selected ? -1 : index);
    });

    el.querySelector('.back').addEventListener('click', () => go('home', { transition: 'pop' }));

    cta.addEventListener('click', () => {
      if (selected === -1) return;
      state.watching = selected;
      go('lecture');
    });
  },
};

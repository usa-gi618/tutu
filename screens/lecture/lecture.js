// Figma 11584:1963 (강의 시작, 가로)
// 결과 화면에서 고른 강의(state.watching)의 시작 화면. PLAY를 누르면 강의 재생.
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';
import { loadLesson } from '../../js/lessons.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const today = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default {
  render() {
    const l = TODAY[state.watching] ?? TODAY[0];
    return `
      <div class="land">
        <button class="back" type="button" aria-label="Back">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M25.5 14.5 L18 22 L25.5 29.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div class="info">
          <p class="from">${l.subject}_ From your ${today()} class</p>
          <h1 class="title">${l.title}</h1>
          <div class="meta">
            <span>${l.length}</span>
            <span>${plural(l.scenes, 'Scene')}</span>
            <span>${l.checks} Check</span>
          </div>
        </div>

        <button class="dnd" type="button">
          <span class="label">Do Not Disturb</span>
          <img class="chevron" src="assets/icon-chevron-down.svg" alt="" />
        </button>

        <button class="play" type="button">PLAY <img src="assets/icon-play-arrow.svg" alt="" /></button>
      </div>
    `;
  },

  mount(el, go) {
    el.querySelector('.back').addEventListener('click', () => go('result', { transition: 'pop' }));
    // 영상은 이 화면에서 미리 받아 두고, PLAY를 누르면 바로 재생
    const lecture = TODAY[state.watching] ?? TODAY[0];
    loadLesson(lecture);
    el.querySelector('.play').addEventListener('click', () => go('player'));
    el.querySelector('.dnd').addEventListener('click', () => {
      // TODO: 방해 금지 옵션
    });
  },
};

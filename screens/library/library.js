// Figma 11565:4029 (Library)
// 과목별로 전달받은 수업 모아보기. 검정 = 다 들음, 회색 = 패스, 노랑 = 아직 안 들음.
import { SUBJECTS, libraryFor } from '../../data/library.js';
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};

function card(l) {
  const status = l.status === 'passed' ? 'Passed' : shortDate(l.date);
  const action = l.status === 'todo' ? 'Study' : 'Re-play';
  return `
    <div class="card ${l.status}">
      <div class="card-globe"><img class="fill" src="assets/globe.svg" alt="" /></div>
      <div class="head">
        <p class="title">${l.title}</p>
        <div class="period">${l.period}</div>
      </div>
      <div class="status">${status}</div>
      <button class="action" type="button">${action}</button>
    </div>`;
}

export default {
  render() {
    return `
      <p class="heading">Library</p>
      <button class="home-btn" type="button" aria-label="Home"><img class="fill" src="assets/icon-home.svg" alt="" /></button>
      <div class="chips">
        ${SUBJECTS.map((s) => `<button class="chip" type="button" data-subject="${s}">${s}</button>`).join('')}
      </div>
      <div class="list"></div>
    `;
  },

  mount(el, go) {
    const chips = el.querySelector('.chips');
    const list = el.querySelector('.list');

    function select(subject) {
      state.librarySubject = subject;
      chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.subject === subject));
      list.innerHTML = libraryFor(subject, state).map(card).join('');
      list.scrollTop = 0;
    }

    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) select(chip.dataset.subject);
    });
    // Study / Re-play: 지난 수업도 강의를 다 만들 수 없어서, 그 과목의 오늘 강의 영상으로 통일해서 재생
    list.addEventListener('click', (e) => {
      if (!e.target.closest('.action')) return;
      state.watching = TODAY.findIndex((l) => l.subject === state.librarySubject);
      state.playerBack = 'library';
      go('player');
    });
    el.querySelector('.home-btn').addEventListener('click', () => go('home', { transition: 'pop' }));

    select(state.librarySubject ?? TODAY[0].subject);
  },
};

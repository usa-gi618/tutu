// 선생님 앱 (임시로 학생 앱 안에). 홈 화면 "Up next" 제목을 빠르게 4번 탭하면 들어온다.
// 시작 화면(녹화 동의)의 제목을 4번 탭하면 학생 앱 시작 화면으로 돌아간다.
// 마지막 화면(Who watched it)에서 왼쪽으로 밀거나 제목을 4번 탭하면 선생님 앱 시작 화면으로.
// Figma 11687:3556 ~ 11689:4200 (와이어프레임이 섞인 화면은 앱 디자인으로 맞춤)
//   consent → notify → record → build → lecture → help → watched
import { TODAY } from '../../data/lectures.js';
import { state } from '../../js/state.js';
import { setTopColor } from '../../js/theme.js';

const STEPS = ['consent', 'notify', 'record', 'build', 'lecture', 'help', 'watched'];
const PERIOD = 'Period 3_Algebra 1';
const ALGEBRA = TODAY.findIndex((l) => l.subject === 'Algebra');

const CHAPTERS = [
  { at: '0:00', title: 'Key idea · balance', from: '08:12' },
  { at: '1:05', title: 'Problem 3x + 5 = 20', from: '17:40' },
  { at: '1:40', title: 'Steps 1 · 2 and why', from: '21:05' },
  { at: '3:10', title: 'Check · recap', from: '34:30' },
];
const STUDENTS = [
  { name: 'Daniela R.', watched: true },
  { name: 'Mateo G.', watched: true, question: { at: '1:05', text: '“Why do we take away 5 from both sides first?”', answer: 'AI: “Undo the +5 first so only 3x is left. Then dividing by 3 gives x by itself.”' } },
  { name: 'Ethan K.', watched: true },
  { name: 'Lucía M.', watched: false },
];

const ICON = {
  mic: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" fill="#000"/><path d="M4 9.5a6 6 0 0 0 12 0M10 15.5V18" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12.5" stroke="#000" stroke-width="2"/><path d="M8.5 14.5l3.6 3.4 7.4-7.6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg width="12" height="13" viewBox="0 0 12 13"><path d="M1 1l10 5.5L1 12z" fill="currentColor"/></svg>',
  pending: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9.5" stroke="#000" stroke-width="1.5" stroke-dasharray="3 3"/></svg>',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const bars = (n) => Array.from({ length: n }, (_, i) => `<i style="animation-delay:${(i * 0.09).toFixed(2)}s"></i>`).join('');

const VIEWS = {
  consent: () => `
    <p class="top">Once, at the start of the semester</p>
    <h1 data-exit>Recording<br />consent</h1>
    <p class="body">When a registered student is absent, that period is recorded automatically and turned into a lesson for that student only. We won’t ask again.</p>
    <div class="consent">
      <div class="who yes"><b>Teacher</b><span>Agreed</span></div>
      <div class="who wait"><b>Principal</b><span>Awaiting approval</span></div>
    </div>
    <button class="cta" type="button" data-next>Continue</button>`,

  // 아이폰 잠금화면에 뜨는 알림
  notify: () => {
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `
    <div class="lock">
      <p class="lock-date">${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}</p>
      <p class="lock-time">${time}</p>
      <button class="lock-note" type="button" data-next>
        <span class="lock-app"><img src="assets/logo-tutu.svg" alt="" /></span>
        <span class="lock-text">
          <span class="lock-head"><b>Registered student absent</b><span>now</span></span>
          <span>${PERIOD} recording started automatically</span>
        </span>
      </button>
      <span class="lock-btn left"><svg width="18" height="22" viewBox="0 0 18 22" fill="none"><path d="M3 1h12v5l-3 4v11H6V10L3 6z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></span>
      <span class="lock-btn right"><svg width="24" height="20" viewBox="0 0 24 20" fill="none"><path d="M2 6h5l2-3h6l2 3h5v12H2z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="11.5" r="3.6" stroke="#fff" stroke-width="1.6"/></svg></span>
      <span class="lock-home"></span>
    </div>`;
  },

  record: () => `
    <p class="top">${PERIOD}</p>
    <div class="glow green">
      <p class="clock" data-clock>0:00</p>
      <div class="wave">${bars(12)}</div>
    </div>
    <button class="early" type="button" data-next>Class ended early</button>
    <div class="info">
      <b>Stop at the 10:45 bell</b>
      <span>Then AI turns it into a lecture and sends it to the absent student.</span>
    </div>`,

  build: () => `
    <p class="top">${PERIOD}</p>
    <h1>Building<br />the lecture</h1>
    <div class="glow yellow">
      <span class="glow-check">${ICON.check}</span>
      <p class="clock">${mmss(state.recordSec ?? 0)}</p>
    </div>
    <ul class="dots">
      <li>What you repeated</li>
      <li>Where you summarized</li>
      <li>Where you asked the most questions</li>
    </ul>`,

  lecture: () => `
    <p class="top">${PERIOD}</p>
    <h1>AI-made<br />lecture</h1>
    <p class="sent">${ICON.check}<span>Already sent to the absent student</span></p>
    <button class="lecture-card" type="button" data-play>
      <span class="lc-title">Solving<br /><em>Linear Equations</em></span>
      <span class="lc-play">${ICON.play}</span>
      <span class="lc-meta">50-min class → 0:38</span>
    </button>
    <ul class="chapters">
      ${CHAPTERS.map((c) => `
        <li>
          <button class="chip-play" type="button" data-play>${ICON.play}${c.at}</button>
          <span class="ch-text"><b>${c.title}</b><span>From recording ${c.from}</span></span>
          <span class="more">•••</span>
        </li>`).join('')}
    </ul>
    <p class="foot">Reviewing is optional · only flag what needs fixing</p>
    <button class="cta" type="button" data-next>Continue</button>`,

  help: () => `
    <div class="alert"><b>Might need extra help</b><span>Algebra 1 · 1 student</span></div>
    <p class="who-label">Mateo G.</p>
    <h1 class="h-long">Still stuck on Solving Linear Equations</h1>
    <ul class="dots">
      <li>AI explained it 3 different ways</li>
      <li>Stuck at the same step on checks</li>
      <li>Didn’t ask a question directly</li>
    </ul>
    <button class="cta" type="button" data-next>Send Description</button>`,

  watched: () => {
    const done = STUDENTS.filter((s) => s.watched).length;
    const questions = STUDENTS.filter((s) => s.question).length;
    return `
      <p class="top light">Period 3 · Algebra 1 · Oct 27</p>
      <h1 data-home>Who watched it</h1>
      <p class="tally"><b>${done} of ${STUDENTS.length}</b><span>watched · ${questions} question</span></p>
      <ul class="students">
        ${STUDENTS.map((s) => `
          <li class="${s.question ? 'has-q' : ''}">
            <span class="avatar">${s.name[0]}${s.question ? '<i></i>' : ''}</span>
            <b>${s.name}</b>
            <span class="state">${s.watched ? 'Watched' : 'Not yet'}${s.watched ? ICON.check : ICON.pending}</span>
          </li>
          ${s.question ? `
            <li class="question">
              <p class="q-meta">Asked at ${s.question.at} · AI answered</p>
              <p class="q-text">${s.question.text}</p>
              <p class="q-answer">${s.question.answer}</p>
              <div class="q-btns">
                <button class="pill dark" type="button" data-reply>Reply</button>
                <button class="pill light" type="button" data-answer>See AI answer</button>
              </div>
            </li>` : ''}`).join('')}
      </ul>
      <p class="foot center">Checking is optional.<br />Only questions need a look.</p>`;
  },
};

export default {
  render() {
    return '<div class="t-view"></div><p class="toast"></p>';
  },

  mount(el, go) {
    const view = el.querySelector('.t-view');
    const toast = el.querySelector('.toast');
    let step = state.teacherStep ?? 'consent';
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; };

    function show(name) {
      clear();
      step = name;
      state.teacherStep = name;
      view.classList.add('swap');
      later(() => {
        view.innerHTML = VIEWS[name]();
        view.dataset.step = name;
        view.classList.remove('swap');
        setTopColor(name === 'notify' ? '#24523f' : '#ffffff'); // 잠금화면 배경 위쪽 색
        enter(name);
      }, 180);
    }
    const next = () => show(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]);

    function say(text) {
      toast.textContent = text;
      toast.classList.add('show');
      later(() => toast.classList.remove('show'), 1600);
    }

    // 화면별 움직임
    function enter(name) {
      if (name === 'notify') later(() => view.querySelector('.lock-note')?.classList.add('in'), 500);
      if (name === 'record') {
        // 녹음 시간이 0초부터 실제로 흘러간다 (끝나면 '강의 만드는 중'에 이 시간이 나온다)
        state.recordSec = 0;
        const clock = view.querySelector('[data-clock]');
        timers.push(setInterval(() => {
          state.recordSec += 1;
          clock.textContent = mmss(state.recordSec);
        }, 1000));
      }
      if (name === 'build') {
        view.querySelectorAll('.dots li').forEach((li, i) => later(() => li.classList.add('in'), 500 + i * 650));
        later(next, 3400); // 다 만들면 자동으로 다음
      }
    }

    // 제목 4번 탭: 시작 화면 → 학생 앱 시작 화면, 마지막 화면 → 선생님 앱 시작 화면
    let titleTaps = [];
    const fourTaps = () => {
      const now = performance.now();
      titleTaps = [...titleTaps.filter((t) => now - t < 1500), now];
      if (titleTaps.length < 4) return false;
      titleTaps = [];
      return true;
    };
    view.addEventListener('click', (e) => {
      if (e.target.closest('[data-exit]')) {
        if (fourTaps()) {
          state.teacherStep = null;
          go('onboarding', { transition: 'fade' });
        }
        return;
      }
      if (e.target.closest('[data-home]')) {
        if (fourTaps()) show('consent');
        return;
      }
      if (e.target.closest('[data-next]')) {
        if (step === 'help') say('Sent to Mateo’s family');
        return next();
      }
      if (e.target.closest('[data-play]')) {
        // AI가 만든 강의를 학생 화면으로 미리 보기
        state.watching = ALGEBRA;
        state.rewatch = null;
        state.playerBack = 'teacher';
        return go('player');
      }
      if (e.target.closest('[data-answer]')) {
        return e.target.closest('.question').classList.toggle('open');
      }
      if (e.target.closest('[data-reply]')) {
        // 답장을 보내면 질문 패널을 접고 다른 학생들과 같은 줄로
        const panel = e.target.closest('.question');
        panel.style.height = `${panel.offsetHeight}px`;
        panel.getBoundingClientRect();
        panel.classList.add('closing');
        panel.style.height = '0px';
        const row = panel.previousElementSibling;
        row.classList.remove('has-q');
        row.querySelector('.avatar i')?.remove();
        later(() => panel.remove(), 320);
        return say('Reply sent to Mateo');
      }
    });

    // 마지막 화면(Who watched it)에서 왼쪽으로 밀면 선생님 앱 시작 화면으로
    let swipe = null;
    view.addEventListener('pointerdown', (e) => { swipe = { x: e.clientX, y: e.clientY }; });
    view.addEventListener('pointerup', (e) => {
      if (!swipe || step !== 'watched') return;
      const dx = e.clientX - swipe.x;
      const dy = e.clientY - swipe.y;
      swipe = null;
      if (dx < -60 && Math.abs(dx) > Math.abs(dy)) show('consent');
    });

    view.innerHTML = VIEWS[step]();
    view.dataset.step = step;
    enter(step);
    return clear;
  },
};

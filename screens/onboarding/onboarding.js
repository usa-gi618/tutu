// Figma 11605:5629
import { state } from '../../js/state.js';

const DELAY_MS = 2000;

export default {
  render() {
    return `
      <div class="abs logo"><img src="assets/logo-tutu.svg" alt="tutu" /></div>
      <p class="tagline">Catch up on what you missed</p>
    `;
  },

  mount(el, go) {
    // 보통은 학생 홈으로, 홈에서 선생님 앱으로 들어갈 때는 선생님 앱으로
    const next = state.afterOnboarding ?? 'home';
    state.afterOnboarding = null;
    const timer = setTimeout(() => go(next, { transition: 'fade' }), DELAY_MS);
    return () => clearTimeout(timer);
  },
};

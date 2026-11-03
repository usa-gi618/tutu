// Figma 11605:5629
const DELAY_MS = 2000;

export default {
  render() {
    return `
      <div class="abs logo"><img src="assets/logo-tutu.svg" alt="tutu" /></div>
      <p class="tagline">Catch up on what you missed</p>
    `;
  },

  mount(el, go) {
    const timer = setTimeout(() => go('home', { transition: 'fade' }), DELAY_MS);
    return () => clearTimeout(timer);
  },
};

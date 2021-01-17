/* Add JavaScript code here! */
import App from './App.svelte';

let app = new App({
  target: document.body,
});

export default app;

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    app.$destroy();
  });
}

export function isEnter(event) {
  if (event.key === 'Enter' || event.which == 13 || event.keyCode == 13) {
    event.preventDefault();
    return true;
  }
  return false;
}
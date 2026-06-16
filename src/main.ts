import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

// Import design system styles
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);

  return {
    app,
    pinia,
  };
}

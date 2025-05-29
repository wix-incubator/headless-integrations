// @ts-check
import wix from "@wix/astro";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

const integration = {
  name: "headless-components-integration",
  hooks: {
    "astro:config:setup": ({ addClientDirective }) => {
      addClientDirective({
        name: "context-provider",
        entrypoint: "@wix/headless-components-core/directive"
      });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  integrations: [react(), integration],
  adapter: wix(),
});

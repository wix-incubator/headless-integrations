import { createIntegration, WixAstroIntegrationOptions } from "./integration.js";
import { wixBlogLoader } from "./loaders/index.js";

export type { Runtime } from "./entrypoints/server.js";
export type { WixAstroIntegrationOptions };
export { wixBlogLoader };

export default createIntegration;

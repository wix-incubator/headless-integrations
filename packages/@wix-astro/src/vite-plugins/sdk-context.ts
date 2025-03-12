import buildResolver from "esm-resolve";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, Plugin } from "vite";

export function wixSDKContext(opts: { sessionCookieName: string }): Plugin {
  const userLoadedEnv = loadEnv(
    process.env["NODE_ENV"] ?? "development",
    process.cwd(),
    ""
  );

  return {
    name: "inject-wix-sdk-context",
    enforce: "pre",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              {
                name: "inject-wix-sdk-context",
                setup(build) {
                  console.log("inside the esbuild plugin");
                  build.onResolve({ filter: /^@wix\/sdk-context$/ }, (args) => {
                    return {
                      path: args.path,
                      namespace: "inject-wix-sdk-context",
                    };
                  });

                  const aRequire = buildResolver(
                    fileURLToPath(import.meta.url),
                    {
                      resolveToAbsolute: true,
                    }
                  );

                  const integrationDir = dirname(
                    aRequire("@wix/astro/package.json")!
                  );
                  const wixSDKResolved = aRequire("@wix/sdk/client");
                  const wixSDKAuthResolved = aRequire(
                    "@wix/sdk/auth/site-session"
                  );

                  build.onLoad(
                    { filter: /.*/, namespace: "inject-wix-sdk-context" },
                    () => {
                      return {
                        resolveDir: integrationDir,
                        contents: `
                        import { createClient } from "${wixSDKResolved}";
                        import { SiteSessionAuth } from "${wixSDKAuthResolved}";

                        function getCookieAsJson(name) {
                          const cookies = document.cookie.split('; ');
                          const cookie = cookies.find(row => row.startsWith(\`\${name}=\`));

                          if (!cookie) return null;

                          try {
                            const jsonString = decodeURIComponent(cookie.split('=')[1]);
                            return JSON.parse(jsonString);
                          } catch (error) {
                            console.error('Error parsing cookie JSON:', error);
                            return null;
                          }
                        }

                        export const wixContext = {
                          client: createClient({
                            auth: SiteSessionAuth({
                              clientId: ${JSON.stringify(
                                userLoadedEnv["WIX_CLIENT_ID"]
                              )},
                              tokens: getCookieAsJson(${JSON.stringify(
                                opts.sessionCookieName
                              )})?.tokens,
                            }),
                          })
                        };
                      `,
                        loader: "js",
                      };
                    }
                  );
                },
              },
            ],
          },
        },
      };
    },
  };
}

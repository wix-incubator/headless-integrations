declare module "astro:env/client" {
  export const WIX_CLIENT_ID: string | undefined;
  export const ENV_NAME: string | undefined;
}
declare module "astro:env/server" {
  export const WIX_CLIENT_SECRET: string | undefined;
  export const WIX_CLIENT_PUBLIC_KEY: string | undefined;
  export const WIX_CLIENT_INSTANCE_ID: string | undefined;
  export const ENV_NAME: string | undefined;
  export const WIX_SESSION_COOKIE_NAME: string;
}

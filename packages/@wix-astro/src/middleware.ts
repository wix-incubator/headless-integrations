/// <reference types="astro/client" />
import {
  AuthenticationStrategy,
  OAuthStrategy,
  TokenRole,
  Tokens,
  createClient,
} from "@wix/sdk";
import type { MiddlewareHandler } from "astro";
import { z } from "astro/zod";
import { WIX_CLIENT_ID } from "astro:env/client";
import { WIX_SESSION_COOKIE_NAME } from "astro:env/server";
import { defineMiddleware } from "astro:middleware";
import { AsyncLocalStorage } from "node:async_hooks";

const authStrategyAsyncLocalStorage = new AsyncLocalStorage<{
  auth: AuthenticationStrategy<void>;
}>();

const sessionClient = createClient({
  auth: {
    async getAuthHeaders() {
      const auth = authStrategyAsyncLocalStorage.getStore()?.auth;
      if (!auth) {
        throw new Error(
          "No authentication strategy found in the current context"
        );
      }

      return auth.getAuthHeaders();
    },
  },
});

sessionClient.enableContext("global");

/**
 * Checks if the incoming request is a request for a dynamic (server-side rendered) page.
 * We can check this by looking at the middleware's `clientAddress` context property because accessing
 * this prop in a static route will throw an error which we can conveniently catch.
 */
function checkIsDynamicPageRequest(
  context: Parameters<MiddlewareHandler>[0]
): boolean {
  try {
    return context.clientAddress != null;
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const wixSessionCookie = checkIsDynamicPageRequest(context)
    ? context.cookies.get(WIX_SESSION_COOKIE_NAME)?.json()
    : undefined;

  let tokens: Tokens;

  if (wixSessionCookie) {
    const tokensParseResult = z
      .object({
        clientId: z.string(),
        tokens: z.object({
          accessToken: z.object({
            value: z.string(),
            expiresAt: z.number(),
          }),
          refreshToken: z.object({
            value: z.string(),
            role: z.nativeEnum(TokenRole),
          }),
        }),
      })
      .safeParse(wixSessionCookie);

    if (!tokensParseResult.success) {
      throw new Error(`Invalid wixSession cookie: ${tokensParseResult.error}`);
    } else {
      if (tokensParseResult.data.clientId === WIX_CLIENT_ID) {
        tokens = tokensParseResult.data.tokens;
      } else {
        tokens = await OAuthStrategy({
          clientId: WIX_CLIENT_ID!,
        }).generateVisitorTokens();
      }
    }
  } else {
    tokens = await OAuthStrategy({
      clientId: WIX_CLIENT_ID!,
    }).generateVisitorTokens();
  }

  let response;
  if (WIX_CLIENT_ID) {
    const auth = OAuthStrategy({
      clientId: WIX_CLIENT_ID,
      tokens,
    });

    response = await authStrategyAsyncLocalStorage.run(
      {
        auth,
      },
      () => next()
    );

    if (
      checkIsDynamicPageRequest(context) &&
      !context.cookies.has(WIX_SESSION_COOKIE_NAME)
    ) {
      context.cookies.set(
        WIX_SESSION_COOKIE_NAME,
        JSON.stringify({ clientId: WIX_CLIENT_ID, tokens: auth.getTokens() }),
        {
          secure: true,
          path: "/",
        }
      );
    }
  } else {
    console.warn(
      `
      No Wix client ID found in the environment. Wix APIs will not be available.
      `
    );
    response = await next();
  }

  return response;
});

import type { Signal } from "@wix/services-definitions";
import { withContext } from "@wix/headless-components-core";
import { getBuyNowServiceProvider } from "@wix/headless-stores/astro/BuyNowServiceContext";

export const BuyNow = withContext(getBuyNowServiceProvider, ({ context }) => {
  console.log("context", context);
  // @ts-expect-error
  const { loading, error, redirectToCheckout } = context;

  if ((loading as Signal<boolean>).get()) return <>Preparing checkout...</>;
  if ((error as Signal<string | null>).get()) return <>Error: {(error as Signal<string | null>).get()}</>;

  return <button onClick={redirectToCheckout} className="bg-blue-500 text-white p-2 rounded-md">
    Yalla, Buy!
  </button>
});

export const withBuyButtonService = (Component: React.ComponentType<any>) => {
  return withContext(getBuyNowServiceProvider, Component);
}

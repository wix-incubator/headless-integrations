
import type { Signal } from "@wix/services-definitions";
import { withBuyButtonService } from "@wix/headless-stores/astro/BuyNowServiceContext";

export const BuyNow = withBuyButtonService(({ context }) => {
  console.log("context", context);
  const { loading, error, redirectToCheckout } = context;

  if ((loading as Signal<boolean>).get()) return <>Preparing checkout...</>;
  if ((error as Signal<string | null>).get()) return <>Error: {(error as Signal<string | null>).get()}</>;

  return <button onClick={redirectToCheckout} className="bg-blue-500 text-white p-2 rounded-md">
    Yalla, Buy!
  </button>
});


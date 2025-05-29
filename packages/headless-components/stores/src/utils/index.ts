import { checkout } from "@wix/ecom";
import { redirects } from "@wix/redirects";

const CATLOG_APP_ID_V3 = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export async function getCheckoutUrlForProduct(productId: string, variantId: string) {
  const checkoutResult = await checkout.createCheckout({
    lineItems: [{
      catalogReference: {
        catalogItemId: productId,
        appId: CATLOG_APP_ID_V3,
        options: {
            variantId
        },
      },
      quantity: 1
    }],
    channelType: checkout.ChannelType.WEB,
  });

  if (!checkoutResult._id) {
    throw new Error("Failed to create checkout");
  }

  const { redirectSession } = await redirects.createRedirectSession({
    ecomCheckout: { checkoutId: checkoutResult._id },
    callbacks: {
      postFlowUrl: window.location.href,
    },
  });

  return redirectSession?.fullUrl!;
}

import { defineService, implementService, Signal } from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import { getCheckoutUrlForProduct } from "../utils";

export const buynowserviceDefinition = defineService<{
  redirectToCheckout: () => Promise<void>,
  loading: Signal<boolean>,
  error: Signal<string | null>,
}>("buynow")

export const buynowService = implementService.withConfig<{
  productId: string,
  variantId: string,
}>()(buynowserviceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);
  const loadingSignal = signalsService.signal(false) as Signal<boolean>;
  const errorSignal = signalsService.signal<string | null>(null) as Signal<string | null>;

  return {
    redirectToCheckout: async () => {
      loadingSignal.set(true);
      try {
        const checkoutUrl = await getCheckoutUrlForProduct(config.productId, config.variantId);
        window.location.href = checkoutUrl;
      } catch (error) {
        errorSignal.set(error as string);
      } finally {
        loadingSignal.set(false);
      }
    },
    loading: loadingSignal,
    error: errorSignal,
  }
})

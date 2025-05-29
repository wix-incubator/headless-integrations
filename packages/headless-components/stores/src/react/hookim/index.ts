import { useState } from "react";
import { getCheckoutUrlForProduct } from "../../utils";

export function useBuyNow(productId: string, variantId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const redirectToCheckout = async () => {
    setIsLoading(true);
    try {
      const checkoutUrl = await getCheckoutUrlForProduct(productId, variantId);
      window.location.href = checkoutUrl;
    } catch (error) {
      setError(error as Error);
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    redirectToCheckout,
  }
}

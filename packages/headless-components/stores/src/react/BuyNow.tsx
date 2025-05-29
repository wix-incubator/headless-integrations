import { checkout } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { useState } from "react";

// const CATALOG_APP_ID = "1380b703-ce81-ff05-f115-39571d94dfcd";
const CATLOG_APP_ID_V3 = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

/**
 * @typedef {object} BuyNowRenderProps
 * @property {boolean} isLoading - Indicates if the checkout process is currently in progress.
 * @property {() => Promise<void>} redirectToCheckout - A function to initiate the checkout process.
 *                                                    When called, it creates a checkout for the specified product
 *                                                    and then redirects the user to the Wix checkout page.
 *                                                    It handles setting the loading state internally.
 */

/**
 * @typedef {object} BuyNowProps
 * @property {string} productId - The unique identifier of the product to be purchased.
 * @property {Record<string, string>} [variant] - An optional record of product variants (e.g., color, size).
 *                                                The keys are variant identifiers and values are the selected options.
 * @property {(props: BuyNowRenderProps) => React.ReactNode} children - A render prop function that receives the loading state
 *                                                                    and the checkout initiation function.
 *                                                                    This allows for custom rendering of the UI.
 */

/**
 * The `BuyNow` component provides a mechanism to initiate a direct purchase for a single product.
 * It encapsulates the logic for creating an e-commerce checkout and redirecting the user to the
 * Wix checkout page.
 *
 * This component uses a render prop pattern (`children`) to provide flexibility in how the UI
 * (e.g., a buy button, loading indicator) is rendered. The render prop receives `isLoading` state
 * and a `redirectToCheckout` function.
 *
 * The `redirectToCheckout` function is asynchronous. It first sets `isLoading` to true, then calls
 * the Wix Ecom SDK to create a checkout with the specified `productId` and `variant`.
 * If successful, it uses the Wix Redirects SDK to generate a redirect session and then navigates
 * the user to the checkout URL by setting `window.location.href`.
 * The `isLoading` state is set to false when the process completes (either successfully or on error).
 *
 * @param {BuyNowProps} props - The props for the BuyNow component.
 * @returns {React.ReactNode} The output of the children render prop.
 *
 * @example
 * ```tsx
 * import { BuyNow } from '@wix/headless-stores/react';
 *
 * const MyProductPage = ({ productId, productVariant }) => {
 *   return (
 *     <BuyNow productId={productId} variant={productVariant}>
 *       {({ isLoading, redirectToCheckout }) => {
 *         if (isLoading) {
 *           return <p>Preparing your order...</p>;
 *         }
 *         return (
 *           <button onClick={redirectToCheckout} style={{ padding: '10px', background: 'blue', color: 'white' }}>
 *             Buy This Product Now!
 *           </button>
 *         );
 *       }}
 *     </BuyNow>
 *   );
 * };
 * ```
 */
export function BuyNow(props: {
  productId: string;
  variant?: Record<string, string>;
  children: (props: {
    isLoading: boolean;
    redirectToCheckout: () => void; // Note: internally it's async, JSDoc reflects the exposed type
  }) => React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const redirectToCheckout = async () => {
    try {
      setIsLoading(true);

      const checkoutResult = await checkout.createCheckout({
        lineItems: [{
          catalogReference: {
            catalogItemId: props.productId,
            appId: CATLOG_APP_ID_V3,
            options: {
                options: props.variant,
                //variantId: "08efa314-a7fe-48d5-944c-942a1a0e57a6"
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

      window.location.href = redirectSession?.fullUrl!;
    } finally {
      setIsLoading(false);
    }
  }

  return props.children({
    isLoading,
    redirectToCheckout,
  })
}


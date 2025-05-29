import { redirects } from '@wix/redirects';

// Function to check if we need to pre-warm
function checkAndExecutePreWarm(): void {
  // Check if we already pre-warmed recently
  const lastPreWarmTimeString = localStorage.getItem('wixRedirectSessionLastPreWarm');
  const currentTime = Date.now();

  // If we have a stored timestamp, check if it's been less than a week
  if (lastPreWarmTimeString) {
    const lastPreWarmTime = parseInt(lastPreWarmTimeString, 10);
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    if (currentTime - lastPreWarmTime < oneWeekMs) {
      console.log('Skipping redirect session pre-warm - already done within the past week');
      return; // Skip pre-warming if done in the last week
    }
  }

  preWarmRedirectSession();

  // Store the current timestamp
  localStorage.setItem('wixRedirectSessionLastPreWarm', currentTime.toString());
}

async function preWarmRedirectSession() {
  const result = await redirects.createRedirectSession({
    ecomCheckout: {
      checkoutId: "b190278d-5096-4283-9030-476bfe3cca63"
    }
  });

  const urlToRedirect = result.redirectSession?.fullUrl;

  if (!urlToRedirect) {
    console.error('No redirect URL found');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = urlToRedirect;
  document.body.appendChild(iframe);
}

// Run the check function instead of calling preWarmRedirectSession directly
checkAndExecutePreWarm();

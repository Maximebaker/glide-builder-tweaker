// Collapse/Expand Button Tweak for Glide Apps Builder
// Adds a collapsible button to container components in the Glide Apps Builder.

const HideContactSalesTweak = (() => {
  let observer;

  function waitForComponentRegion() {
    observer = new MutationObserver((mutationsList, observer) => {
      let componentRegion = document.querySelector("div.right-area");
      if (componentRegion) {
        const closestContainer = componentRegion.querySelector(
          "div.inner > a[aria-label='Contact Sales']"
        );
        if (!closestContainer) return;

        closestContainer.style.display = "none";
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  function start() {
    waitForComponentRegion();
    console.log("Hide Contact Sales tweak started");
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      console.log("Hide Contact Sales tweak stopped");
    }
  }

  return {
    start,
    stop,
  };
})();

export const start = HideContactSalesTweak.start;
export const stop = HideContactSalesTweak.stop;

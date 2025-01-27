// Collapse/Expand Button Tweak for Glide Apps Builder
// Adds a collapsible button to container components in the Glide Apps Builder.

const ChevronContainers= (() => {
    let observer;
    let regionObserver;

    function waitForComponentRegion() {
        observer = new MutationObserver((mutationsList, observer) => {
            let componentRegion = document.querySelector("div.component-region");
            if (componentRegion) {
                observeComponentRegion(componentRegion);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function observeComponentRegion(componentRegion) {
        const closestContainer = componentRegion.querySelector(
            "div.section-content > div > div"
        );
        if (!closestContainer) return;

        regionObserver = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((addedNode) => {
                        if (
                            addedNode.nodeType === Node.ELEMENT_NODE &&
                            addedNode.tagName === "DIV" &&
                            /^(c|free-)/.test(addedNode.getAttribute("data-id"))
                        ) {
                            AddCollapseExpandFeatureToGlideBuilder(componentRegion);
                        }
                    });
                }
            });
        });

        regionObserver.observe(componentRegion, {
            childList: true,
            subtree: true,
        });

        AddCollapseExpandFeatureToGlideBuilder(componentRegion);
    }

    function AddCollapseExpandFeatureToGlideBuilder(componentRegion) {
        const containers = componentRegion.querySelectorAll(
            '[data-id^="c"], [data-id^="free-"]'
        );

        containers.forEach((container) => {
            let button = container.querySelector(".chevron-button");
            if (button) return;

            button = document.createElement("button");
            button.textContent = "▶";
            button.style.backgroundColor = "transparent";
            button.style.border = "none";
            button.style.fontSize = "16px";
            button.style.cursor = "pointer";
            button.style.marginRight = "10px";
            button.style.padding = "0";
            button.classList.add("chevron-button");

            const topWrapper = container.querySelector(".top-wrapper");
            const secondDiv = container.querySelector(
                ".drag-drop-area___StyledDiv3-sc-1k3mj59-3"
            );

            if (topWrapper && secondDiv) {
                topWrapper.insertBefore(button, topWrapper.firstChild);
                secondDiv.style.display = "none";
            }

            button.addEventListener("click", function () {
                if (secondDiv) {
                    if (secondDiv.style.display === "none") {
                        secondDiv.style.display = "block";
                        button.textContent = "▼";
                    } else {
                        secondDiv.style.display = "none";
                        button.textContent = "▶";
                    }
                }
            });
        });
    }

    function start() {
        waitForComponentRegion();
        console.log("Chevron Containers tweak started");
    }

    function stop() {
        if (observer) {
            observer.disconnect();
            console.log("Chevron Containers tweak stopped");
        }
        if (regionObserver) {
            regionObserver.disconnect();
            console.log("Region observer stopped");
        }
    }

    return {
        start,
        stop
    };
})()

export const start = ChevronContainers.start;
export const stop = ChevronContainers.stop;

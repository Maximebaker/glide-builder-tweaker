const Tweak = (() => {
  let sidebarObserver;
  let sectionObserver;
  let restructuredTables = {};

  function getSidebarSelector() {
    return "div.sc-eXAmlR.khLmgo.sc-jhJOaJ.QhAZN > div.sources-region > div.sc-kAkpmW.fXcken > div.content-container > div.section-wrapper > div.section-content > div";
  }

  let sidebarObserved = false;
  function waitForSidebar() {
    sidebarObserver = new MutationObserver(() => {
      if (
        sidebarObserved &&
        document.querySelector(getSidebarSelector()) == null
      ) {
        sectionObserver.disconnect();
        restructuredTables = {};
        sidebarObserved = false;
      }
      if (
        !sidebarObserved &&
        document.querySelector(getSidebarSelector()) != null
      ) {
        sidebarObserved = true;
        observeSection(document.querySelector(getSidebarSelector()));
      }
    });

    sidebarObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function observeSection(sidebar) {
    if (!sidebar) {
      if (sectionObserver) sectionObserver.disconnect();
      waitForSidebar();
      return;
    }

    sectionObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((addedNode) => {
            if (
              addedNode.nodeType === Node.ELEMENT_NODE &&
              addedNode.tagName === "DIV" &&
              addedNode.matches('[data-rbd-draggable-id^="native-table-"]')
            ) {
              if (
                restructuredTables[
                  addedNode.querySelector(".sc-eZkCL.hGbbOY").textContent.trim()
                ]
              )
                return;
              // AddFeatureToGlideBuilder(sidebar);
              // console.log("added");
            }
          });
        }
      });
    });

    sectionObserver.observe(sidebar, {
      childList: true,
      subtree: true,
    });

    AddFeatureToGlideBuilder(sidebar);
  }

  function AddFeatureToGlideBuilder(section) {
    let workflows = section.querySelectorAll(".sc-dZoequ.cQddCI");

    const newStructure = {};

    let workflowsNeedRestructuring = false;
    // Step 1: Build the new structure
    workflows.forEach((element) => {
      const titleDiv = element.querySelector(".sc-eZkCL.hGbbOY");

      if (titleDiv) {
        const fullTitle = titleDiv.textContent.trim();
        const [folder, ...nameParts] = fullTitle.split("/");
        const name = nameParts.join("/");

        if (restructuredTables[fullTitle]) return;

        restructuredTables[fullTitle] = {
          folder,
          name,
          element,
        };

        workflowsNeedRestructuring = true;

        // Only create folders for items with a "/" in the title
        if (folder && name) {
          // Create folder if it doesn't exist
          if (!newStructure[folder]) {
            newStructure[folder] = [];
          }

          // Add the element to the corresponding folder with a new name
          newStructure[folder].push({ element, name });
        } else {
          // If there's no "/" in the title, treat the element as being in the root (no folder)
          if (!newStructure["Root"]) {
            newStructure["Root"] = [];
          }

          // Add the element to the root with the original title
          newStructure["Root"].push({ element, name: fullTitle });
        }
      }
    });

    // console.log(workflowsNeedRestructuring, restructuredWorkflows);

    if (!workflowsNeedRestructuring) return;

    // Step 2: Sort the folders and their elements
    const sortedFolders = Object.keys(newStructure)
      .sort()
      .map((folder) => {
        return {
          folder,
          items: newStructure[folder].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        };
      });

    // Step 3: Prepare the new structure with moved elements
    const movedElements = []; // Store the moved elements to use later

    sortedFolders.forEach(({ folder, items }) => {
      // Only create folder div for folders with elements
      if (folder !== "Root") {
        // Create a folder div
        const folderDiv = document.createElement("div");
        folderDiv.classList.add("folder");
        folderDiv.classList.add("open");
        folderDiv.textContent = folder;

        // Add click event for collapsing/expanding
        folderDiv.addEventListener("click", () => {
          folderDiv.classList.toggle("open");
          const contentDiv = folderDiv.nextElementSibling;
          if (contentDiv) {
            contentDiv.style.display =
              !contentDiv.style.display || contentDiv.style.display === "block"
                ? "none"
                : "block";
          }
        });

        // Create a container for folder content
        const folderContentDiv = document.createElement("div");
        folderContentDiv.className = "folder-content";

        items.forEach(({ element, name }) => {
          // Move the original element
          const parentElement = element.parentElement;
          parentElement.removeChild(element); // Remove from original location

          // Modify the title of the element
          const titleDiv = element.querySelector(".sc-eZkCL.hGbbOY");
          if (titleDiv) {
            titleDiv.textContent = name; // Update the title with the new name
          }

          // Add the moved element to the new folder content
          folderContentDiv.appendChild(element);

          // Store the folder content div and moved element
          movedElements.push({ folderDiv, folderContentDiv });
        });
      } else {
        // Handle root elements (without "/")
        items.forEach(({ element, name }) => {
          // No move, just update the name
          const titleDiv = element.querySelector(".sc-eZkCL.hGbbOY");
          if (titleDiv) {
            titleDiv.textContent = name; // Update the title with the new name
          }

          // Add the element to the root (keeping its original position)
          movedElements.push({
            folderDiv: null,
            folderContentDiv: null,
            element,
          });
        });
      }
    });

    // Step 4: Apply the new structure to the DOM
    const root = document.querySelector(".sc-kAkpmW.fXcken .section-content"); // Assuming a root container exists

    // Step 5: Clear the root and append the new structure
    root.innerHTML = ""; // Clear existing structure

    // Append the moved elements
    movedElements.forEach(({ folderDiv, folderContentDiv, element }) => {
      if (folderDiv && folderContentDiv) {
        root.appendChild(folderDiv); // Add folder to the DOM
        root.appendChild(folderContentDiv); // Add folder content to the DOM
      } else {
        root.appendChild(element); // Add root elements directly to the DOM
      }
    });
  }

  function injectStyleSheet() {
    const style = document.createElement("style");
    style.textContent = `
  .folder {
    font-weight: bold;
    cursor: pointer;
    margin: 10px 0;
    padding: 5px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    color:#333;
  }

  .folder-content {
    margin-left: 20px;
    display: block; 
  }

  .folder.open + .folder-content {
    display: block; /* Show content when the folder is open */
  }

  .folder:hover {
    background-color: #e0e0e0;
  }
`;
    document.head.appendChild(style);
  }

  function start() {
    console.log("Tables Folders tweak started");
    injectStyleSheet();
    waitForSidebar();
  }

  function stop() {
    console.log("Tables Folders tweak stopped");
    if (sidebarObserver) {
      sidebarObserver.disconnect();
    }
    if (sectionObserver) {
      sectionObserver.disconnect();
    }
  }

  return {
    start,
    stop,
  };
})();

export const start = Tweak.start;
export const stop = Tweak.stop;

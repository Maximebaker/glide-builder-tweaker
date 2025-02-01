const Tweak = (() => {
  let sidebarObserver;
  let sectionObserver;
  let restructuredWorkflows = {};

  function getWorkflowSidebarSelector() {
    return "div.action-editor-sidebar___StyledDiv5-sc-61rmx6-6 div.content-container div.section-wrapper div.section-content";
  }

  let workflowsSidebarObserved = false;
  function waitForWorkflowsSidebar() {
    sidebarObserver = new MutationObserver(() => {
      if (
        workflowsSidebarObserved &&
        document.querySelector(getWorkflowSidebarSelector()) == null
      ) {
        sectionObserver.disconnect();
        restructuredWorkflows = {};
        workflowsSidebarObserved = false;
      }
      if (
        !workflowsSidebarObserved &&
        document.querySelector(getWorkflowSidebarSelector()) != null
      ) {
        workflowsSidebarObserved = true;
        observeSection(document.querySelector(getWorkflowSidebarSelector()));
      }
    });

    sidebarObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function getWorkflowTitleElement(element) {
    // Cibler le deuxième div à l'intérieur de l'élément (la deuxième div sous le deuxième div enfant)
    const divs = element.querySelectorAll("div > div > div"); // Cibler les div imbriquées comme spécifié

    if (divs.length >= 2) {
      const secondDiv = divs[1]; // Sélectionner la deuxième div
      const textContent = secondDiv.textContent.trim();

      if (textContent) {
        return secondDiv; // Retourner le div contenant le texte
      }
    }

    return null; // Si aucun texte n'est trouvé
  }

  function observeSection(sidebar) {
    if (!sidebar) {
      if (sectionObserver) sectionObserver.disconnect();
      waitForWorkflowsSidebar();
      return;
    }

    sectionObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((addedNode) => {
            if (
              addedNode.nodeType === Node.ELEMENT_NODE &&
              addedNode.tagName === "DIV" &&
              // addedNode.classList.contains("sc-dZoequ") &&
              // addedNode.classList.contains("cQddCI")
              /^bld-drag-item-/.test(addedNode.getAttribute("data-test"))
            ) {
              const title =
                getWorkflowTitleElement(addedNode).textContent.trim();
              if (restructuredWorkflows[title]) return;
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
    // let workflows = section.querySelectorAll(".sc-dZoequ.cQddCI");
    let workflows = section.querySelectorAll("div[data-test='bld-drag-item-']");

    const newStructure = {};

    let workflowsNeedRestructuring = false;
    // Step 1: Build the new structure
    workflows.forEach((element) => {
      const title = getWorkflowTitleElement(element).textContent.trim();

      if (title) {
        const [folder, ...nameParts] = title.split("/");
        const name = nameParts.join("/");

        if (restructuredWorkflows[title]) return;

        restructuredWorkflows[title] = {
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
          newStructure["Root"].push({ element, name: title });
        }
      }
    });

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
          const titleDiv = getWorkflowTitleElement(element);
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
          const titleDiv = getWorkflowTitleElement(element);
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
    const root = document.querySelector(
      ".action-editor-sidebar___StyledDiv5-sc-61rmx6-6 .content-container .section-content"
    ); // Assuming a root container exists

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
    console.log("Workflows Folders tweak started");
    injectStyleSheet();
    waitForWorkflowsSidebar();
  }

  function stop() {
    console.log("Workflows Folders tweak stopped");
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

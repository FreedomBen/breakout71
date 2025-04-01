import { isOptionOn } from "./options";

export function setupTooltips() {
  const tooltip = document.getElementById("tooltip") as HTMLDivElement;
  if (isOptionOn("mobile-mode")) {
    tooltip.style.display = "none";
    return;
  }

  function updateTooltipPosition(e: MouseEvent) {
    tooltip.style.transform =
      `translate(${e.clientX}px,${e.clientY + 20}px) ` +
      (e.clientX > window.innerWidth / 2 ? " translate(-100%,0)" : "");
  }

  document.body.addEventListener(
    "mouseenter",
    (e: MouseEvent) => {
      let parent: HTMLElement | null = e.target as HTMLElement;
      while (parent && !parent.hasAttribute("data-tooltip")) {
        parent = parent.parentElement;
      }
      if (parent?.hasAttribute("data-tooltip")) {
        tooltip.innerHTML = parent?.getAttribute("data-tooltip");
        tooltip.style.display = "";
        updateTooltipPosition(e);
      } else {
        tooltip.style.display = "none";
      }
    },
    true,
  );
  document.body.addEventListener(
    "mousemove",
    (e) => {
      if (!tooltip.style.display) {
        updateTooltipPosition(e);
      }
    },
    true,
  );
  document.body.addEventListener(
    "mouseleave",
    (e) => {
      // tooltip.style.display = 'none';
    },
    true,
  );
}

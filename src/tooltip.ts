import { isOptionOn } from "./options";

export function setupTooltips() {
  if (isOptionOn("mobile-mode")) {
    setupMobileTooltips(tooltip);
  } else {
    setupDesktopTooltips(tooltip);
  }
}
export function hideAnyTooltip() {
  tooltip.style.display = "none";
}

const tooltip = document.getElementById("tooltip") as HTMLDivElement;

function setupMobileTooltips(tooltip: HTMLDivElement) {
  tooltip.className='mobile'
  function openTooltip(e: Event) {
    hideAnyTooltip()
    const hovering = e.target as HTMLElement;
    if (!hovering?.hasAttribute("data-help-content")) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    tooltip.innerHTML = hovering.getAttribute("data-help-content") || "";
    tooltip.style.display = "";
    const {  top } = hovering.getBoundingClientRect();
    tooltip.style.transform = `translate(0,${top}px) translate(0,-100%)`;

  }

  document.body.addEventListener("touchstart", openTooltip, true);
  document.body.addEventListener("mousedown", openTooltip, true);

  function closeTooltip(e: Event) {
    const hovering = e.target as HTMLElement;
    if (!hovering?.hasAttribute("data-help-content")) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    hideAnyTooltip();
  }

  document.body.addEventListener("touchend", closeTooltip, true);
  document.body.addEventListener("mouseup", closeTooltip, true);
  document.addEventListener("scroll", hideAnyTooltip);

  function ignoreClick(e: Event) {
    const hovering = e.target as HTMLElement;
    if (!hovering?.hasAttribute("data-help-content")) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
  }
  document.body.addEventListener("click", ignoreClick, true);
  document.body.addEventListener("contextmenu", ignoreClick, true);
}

function setupDesktopTooltips(tooltip: HTMLDivElement) {
  tooltip.className='desktop'
  function updateTooltipPosition(e: { clientX: number; clientY: number }) {
    tooltip.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(${e.clientX > window.innerWidth / 2 ? "-100%" : "0"},${e.clientY > (window.innerHeight * 2) / 3 ? "-100%" : "20px"})`;
  }

  function closeToolTip() {
    hideAnyTooltip();
    hovering = null;
  }

  let hovering: HTMLElement | null = null;

  document.body.addEventListener(
    "mouseenter",
    (e: MouseEvent) => {
      let parent: HTMLElement | null = e.target as HTMLElement;
      while (parent && !parent.hasAttribute("data-tooltip")) {
        parent = parent.parentElement;
      }
      if (parent?.getAttribute("data-tooltip")?.trim()) {
        hovering = parent as HTMLElement;
        tooltip.innerHTML = hovering.getAttribute("data-tooltip") || "";
        tooltip.style.display = "";
        updateTooltipPosition(e);
      } else {
        closeToolTip();
      }
    },
    true,
  );

  setInterval(() => {
    if (hovering) {
      if (!document.body.contains(hovering)) {
        closeToolTip();
      }
    }
  }, 200);
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
      closeToolTip();
    },
    true,
  );
}

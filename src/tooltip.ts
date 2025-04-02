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

  function closeToolTip(){
        tooltip.style.display = "none";
        hovering=null
  }
    let hovering:HTMLElement|null=null
  document.body.addEventListener(
    "mouseenter",
    (e: MouseEvent) => {
      let parent: HTMLElement | null = e.target as HTMLElement;
      while (parent && !parent.hasAttribute("data-tooltip")) {
        parent = parent.parentElement;
      }
      if (parent?.hasAttribute("data-tooltip")) {
          hovering=parent as HTMLElement
        tooltip.innerHTML = hovering.getAttribute("data-tooltip") || '';
        tooltip.style.display = "";
        updateTooltipPosition(e);
      } else {
      closeToolTip()
      }
    },
    true,
  );

  setInterval(()=>{
      if(hovering){
          if(!document.body.contains(hovering)){
             closeToolTip()
          }
      }
  },200)
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
        closeToolTip()
    }
  );
}

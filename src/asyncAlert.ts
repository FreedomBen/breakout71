import { t } from "./i18n/i18n";

export let alertsOpen = 0,
  closeModal: null | (() => void) = null;

export type AsyncAlertAction<t> = {
  text?: string;
  value?: t;
  help?: string;
  disabled?: boolean;
  icon?: string;
  className?: string;
};

const popupWrap = document.getElementById("popup") as HTMLDivElement;
const closeModaleButton = document.getElementById(
  "close-modale",
) as HTMLButtonElement;
closeModaleButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (closeModal) closeModal();
});

closeModaleButton.title = t("play.close_modale_window_tooltip");

let lastClickedItemIndex = -1;

export function requiredAsyncAlert<t>(p: {
  title?: string;
  text?: string;
  actions?: AsyncAlertAction<t>[];
  textAfterButtons?: string;
  actionsAsGrid?: boolean;
}):Promise<t>{
  return asyncAlert({...p, allowClose:false})
}

export async function asyncAlert<t>({
  title,
  text,
  actions,
  allowClose = true,
  textAfterButtons = "",
  actionsAsGrid = false,
}: {
  title?: string;
  text?: string;
  actions?: AsyncAlertAction<t>[];
  textAfterButtons?: string;
  allowClose?: boolean;
  actionsAsGrid?: boolean;
}): Promise<t | void> {
  updateAlertsOpen(+1);
  return new Promise((resolve) => {
    popupWrap.className = actionsAsGrid ? " actionsAsGrid" : "";
    closeModaleButton.style.display = allowClose ? "" : "none";

    const popup = document.createElement("div");
    let closed = false;
    function closeWithResult(value: t | undefined) {
      if (closed) return;
      closed = true;
      Array.prototype.forEach.call(
        popup.querySelectorAll("button:not([disabled])"),
        (b) => (b.disabled = true),
      );
      document.body.style.minHeight = document.body.scrollHeight + "px";
      setTimeout(() => (document.body.style.minHeight = ""), 0);
      popup.remove();
      resolve(value);
    }

    if (allowClose) {
      closeModal = () => {
        closeWithResult(undefined);
      };
    } else {
      closeModal = null;
    }

    if (title) {
      const p = document.createElement("h2");
      p.innerHTML = title;
      popup.appendChild(p);
    }

    if (text) {
      const p = document.createElement("div");
      p.innerHTML = text;
      popup.appendChild(p);
    }

    const buttons = document.createElement("section");
    buttons.className = "actions";
    popup.appendChild(buttons);

    actions
      ?.filter((i) => i)
      .forEach(
        ({ text, value, help, disabled, className = "", icon = "" }, index) => {
          const button = document.createElement("button");

          button.innerHTML = `
${icon}
<div>
                    <strong>${text}</strong>
                    <em>${help || ""}</em>
            </div>`;

          if (disabled) {
            button.setAttribute("disabled", "disabled");
          } else {
            button.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              closeWithResult(value);
              // Focus "same" button if it's still there
              lastClickedItemIndex = index;
            });
          }

          button.className =
            className + (lastClickedItemIndex === index ? " needs-focus" : "");
          buttons.appendChild(button);
        },
      );
    if (textAfterButtons) {
      const p = document.createElement("div");
      p.className = "textAfterButtons";
      p.innerHTML = textAfterButtons;
      popup.appendChild(p);
    }

    popupWrap.appendChild(popup);
    (
      popupWrap.querySelector(
        `section.actions > button.needs-focus`,
      ) as HTMLButtonElement
    )?.focus();
    lastClickedItemIndex = -1;
  }).then(
    (v: unknown) => {
      updateAlertsOpen(-1);
      closeModal = null;
      return v as t | undefined;
    },
    () => {
      closeModal = null;
      updateAlertsOpen(-1);
    },
  );
}

function updateAlertsOpen(delta: number) {
  alertsOpen += delta;
  if (alertsOpen > 1) {
    alert("Two alerts where opened at once");
  }
  document.body.classList[alertsOpen ? "add" : "remove"]("has-alert-open");
}

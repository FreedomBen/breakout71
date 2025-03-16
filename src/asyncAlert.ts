import {t} from "./i18n/i18n";

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


export function asyncAlert<t>({
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
    alertsOpen++;
    return new Promise((resolve) => {
        const popupWrap = document.createElement("div");
        document.body.appendChild(popupWrap);
        popupWrap.className = "popup " + (actionsAsGrid ? "actionsAsGrid " : "");

        function closeWithResult(value: t | undefined) {
            resolve(value);
            // Doing this async lets the menu scroll persist if it's shown a second time
            setTimeout(() => {
                document.body.removeChild(popupWrap);
            });
        }

        if (allowClose) {
            const closeButton = document.createElement("button");
            closeButton.title = t('play.close_modale_window_tooltip');
            closeButton.className = "close-modale";
            closeButton.addEventListener("click", (e) => {
                e.preventDefault();
                closeWithResult(undefined);
            });
            closeModal = () => {
                closeWithResult(undefined);
            };
            popupWrap.appendChild(closeButton);
        }

        const popup = document.createElement("div");

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
        popup.appendChild(buttons);

        actions
            ?.filter((i) => i)
            .forEach(({text, value, help, disabled, className = "", icon = ""}) => {
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
                        closeWithResult(value);
                    });
                }
                button.className = className;
                buttons.appendChild(button);
            });

        if (textAfterButtons) {
            const p = document.createElement("div");
            p.className = "textAfterButtons";
            p.innerHTML = textAfterButtons;
            popup.appendChild(p);
        }

        popupWrap.appendChild(popup);
        (
            popup.querySelector("button:not([disabled])") as HTMLButtonElement
        )?.focus();
    }).then(
        (v: unknown) => {
            alertsOpen--;
            closeModal = null;
            return v as t | undefined;
        },
        () => {
            closeModal = null;
            alertsOpen--;
        },
    );
}
let div = document.createElement("div");
div.classList = "hidden toast";
document.body.appendChild(div);
let timeout: NodeJS.Timeout | undefined;
export function toast(html: string) {
  div.classList = "toast visible";
  div.innerHTML = html;
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    timeout = undefined;
    div.classList = "hidden toast";
  }, 1500);
}

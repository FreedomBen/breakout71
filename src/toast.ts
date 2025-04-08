let onScreen = 0;

export function toast(html) {
  const div = document.createElement("div");
  div.classList = "toast";
  div.innerHTML = html;
  const lasts = 1500 + onScreen * 200;
  div.style.animationDuration = lasts + "ms";
  div.style.top = 40 + onScreen * 50 + "px";

  document.body.appendChild(div);
  onScreen++;
  setTimeout(() => {
    div.remove();
    onScreen--;
  }, lasts);
}

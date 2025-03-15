if (
  "serviceWorker" in navigator &&
  window.location.search.includes("isPWA=true")
) {
  // @ts-ignore
  navigator.serviceWorker.register(new URL("sw-b71.js", import.meta.url));
}

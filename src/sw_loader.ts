if ("serviceWorker" in navigator &&
    window.location.search.includes("isPWA=true")) {
    navigator.serviceWorker.register("sw-b71.js");
}
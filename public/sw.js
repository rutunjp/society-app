// Simple service worker for PWA installability.
self.addEventListener("fetch", (event) => {
  // We can leave this empty for now, or just provide basic passthrough.
});

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

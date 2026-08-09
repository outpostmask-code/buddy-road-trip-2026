# BUDDY — Family Road Trip App

A mobile web app for the family road trip Aug 9–12, 2026 (Temple City → Monterey / Big Sur → home), starring Buddy the dog as tour guide.

- Static site, no backend, no build step.
- Works offline (installs as a PWA — "Add to Home Screen" on iPhone/Android) for the no-signal stretch of Big Sur on Day 3.
- Map: Leaflet + OpenStreetMap, numbered color-coded pins per day, live GPS location.
- Points game (1,000 pts across the 4 days) + 6 badges + 8-stop photo scavenger hunt (+25 pts each), all saved on-device (localStorage) — nothing is sent anywhere.

## Local preview
Just open `index.html` in a browser, or serve the folder with any static file server (needed for the service worker/GPS to work over `http://localhost`).

## Deploy
Deployed via GitHub Pages from this repo's `main` branch, `/ (root)`.

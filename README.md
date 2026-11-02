# Maycie Tracker


**Live:** https://maycie-tracker-02388d5f.deed.page/

**Repo:** https://github.com/MAYZRAVIZ/maycie-tracker

**GitHub Pages (pending one-time Settings → Pages → Source → GitHub Actions):** https://mayzraviz.github.io/maycie-tracker/

Daily progress tracking for **Maycie Furniture & Fixture Trading** (Philippines).  
English UI · Asia/Manila dates · PHP-friendly exports · runs fully offline in a browser.

## How to run

1. Copy the whole `maycie-tracker` folder to the shop computer.
2. Open `index.html` in Chrome, Edge, or Firefox  
   — or double-click `start.bat` (Windows) / run `./start.sh` (Mac/Linux).
3. No install, no internet, no build step.

Sample jobs, staff, materials, and updates load on first open (marked **Sample**).  
Use **Menu → Clear sample data** when you start entering real work.

## How to back up

- **Menu (☰) → Export JSON backup** — full restore file. Keep copies on a USB drive or shared folder.
- **Menu → Import JSON backup** — replaces data in *this* browser with the file.
- **Menu → Export CSV** — spreadsheet-friendly export (jobs, materials, updates, staff).

Data lives in that browser’s **localStorage** only. Clearing site data, switching browsers, or using another device will not show the same records unless you import a JSON backup.

## Sharing among devices (limitation)

This first version is **single-browser / single-computer**. Phones and other PCs each have their own copy. To move data: Export JSON on one device → Import on another. There is no live multi-user sync yet.

## Features

- Jobs (kitchen soft-close/full-extension, dovetail, sliding cabinets, bed, sofa, spa chair, other)
- Production stages with % complete
- Daily progress timeline per job
- Materials + global “Materials waiting” view
- Staff list & assignments
- Dashboard reminders (overdue, due ≤3 days, materials late/not ordered, no update today)
- Filters by status/staff · printable basic report

## Folder layout

```
maycie-tracker/
  index.html
  css/styles.css
  js/app.js
  start.bat
  start.sh
  README.md
  screenshots/
```

# Privacy-safe Model Kit Collection PWA — Photo Edition

This deployable package contains **no personal collection data**.

## New in this version
- Add multiple photos to each model kit.
- Select a cover photo.
- Remove photos.
- Automatic image resizing/compression before storage.
- Photos are stored locally in IndexedDB on your phone.
- Collection cards show the cover photo.
- Full JSON backup/export now includes photos.
- Older kit-only JSON backups can still be imported.

## Privacy
The public GitHub repository contains only app code and an empty `seed.json`.
Your collection, purchase prices, notes, and photos stay in browser/PWA IndexedDB on your device.

## Updating an existing installation
Upload these files over the existing GitHub Pages files and commit them.
The app uses the same IndexedDB database name, so your current collection should remain after the update.
The database upgrades from version 1 to version 2 and adds a separate `photos` store.

After GitHub Pages finishes deploying:
1. Open the installed app.
2. If it still looks like the old version, fully close it and reopen it.
3. If needed, visit the GitHub Pages URL once in Chrome, refresh, then reopen the installed PWA.
4. Open any kit and use **+ Add photos**.

## Backup warning
Photos increase backup size. Export a full backup periodically and keep it private.
Clearing browser/site data can erase local records and images.

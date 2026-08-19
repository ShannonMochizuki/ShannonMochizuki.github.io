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


## v3 UI changes
- Collection-card cover photos increased from 72×72 px to 112×112 px on phones.
- Cover photos grow to 140×140 px on wider displays.
- Replaced the generic app icon with a model-kit/mecha themed icon.
- Existing collection records and locally stored photos are preserved.


## v4
- Added an optional **Paid (JPY)** field to each model kit.
- SGD and JPY purchase prices can both be recorded for the same kit.
- JPY-only purchases display directly on collection cards.
- The JPY amount is included automatically in full backups.
- No exchange-rate conversion is performed automatically, so historical purchase amounts remain exact.


## v5 — Mobile photo gallery
- Reworked the collection into large portrait-phone scrolling tiles.
- Cover photo fills the entire model-kit card.
- Kit name is centered near the bottom over a dark readability gradient.
- Grade and scale are shown at the upper-left.
- Market value remains visible at the upper-right.
- Purchase price and ROI remain at the bottom.
- Existing photo gallery, SGD/JPY purchase fields, backups, and local privacy architecture are preserved.


## v6 — Visible version information
- App header now shows the installed version number.
- The app checks `version.json` from GitHub Pages with cache bypass.
- When current, it shows **Latest version running**.
- If GitHub Pages has a newer build, it shows **Update available**.
- When offline, it still shows the locally running version.


## v7 — Fixed 16:9 collection tiles
- Every collection tile now uses a true 16:9 aspect ratio.
- Cover images use `object-fit: cover`, filling the tile edge-to-edge with no black bars.
- 16:9 source images display without cropping.
- Non-16:9 images are automatically center-cropped visually to fill the tile.
- Existing collection data, photos, SGD/JPY purchase fields, and backups are unchanged.


## v8 — Paint inventory + kit paint requirements
- Added a private Paint Inventory stored locally in IndexedDB.
- Track brand, paint code, paint name, type, stock level, and notes.
- Assign any paints in your inventory to individual model kits.
- Required paints appear directly on each 16:9 model-kit tile.
- Paint inventory is included in full private backups.
- Deleting a paint removes its assignment from kits automatically.
- Version display is now subtle; the visible “Checking app version…” line is removed.
- The small version badge still checks the deployed version silently and shows an up-arrow only if a newer version exists.


## v9 — Paint workflow and cache fix
- Fixed mixed-version PWA caching that could load v8 HTML with v7 JavaScript.
- CSS and JavaScript now use versioned URLs.
- Service worker is explicitly asked to update on launch.
- “Manage paints” opens a dedicated inventory editor.
- Required paints now use a clear **Select paints** button.
- Selected paints appear as chips in the kit editor.
- Kit tiles continue to show assigned paint requirements.


## v10 — Dedicated Paint Inventory tab
- Paint Inventory moved out of the Home dashboard into its own bottom-navigation tab.
- Paints display as image cards in a scrollable inventory gallery.
- Added optional paint image.
- Added paint purchase price in SGD and JPY.
- Added current paint value/price in SGD.
- Existing brand, code, name, type, stock level, and notes are retained.
- Kit Required Paints continue linking to this inventory.
- Paint data and images remain private/local and are included in backups.


## v11 — Model tile and tap fix
- Changed model-kit tiles from 16:9 to a taller 4:3 format.
- The foreground photo now uses `object-fit: contain`, so the whole model can remain visible.
- The same photo is used as a blurred full-bleed backdrop, so there are no black letterbox bars.
- Replaced individual tile click handlers with event delegation on the collection list for more reliable mobile taps.
- Existing collection, photos, paint inventory, paint assignments, pricing, and backups are preserved.

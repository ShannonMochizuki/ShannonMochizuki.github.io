# Privacy-safe Model Kit Collection PWA

This deployment package contains **NO personal collection data**.

## Privacy model
- The GitHub repository may be public.
- The deployed website contains only the app shell.
- Your collection is stored locally on your phone in IndexedDB.
- Your purchase prices and collection records are NOT uploaded to GitHub.
- Do not commit your private backup JSON to the repository.

## First-time setup on your phone
1. Host this folder using GitHub Pages.
2. Open the deployed site on your phone.
3. Open **Backup**.
4. Choose **Import backup**.
5. Select `My_Model_Kit_Collection_PRIVATE_Backup.json`.
6. Your collection will then be stored locally on that phone.
7. Install the PWA from Chrome using **Add to Home screen / Install app**.

## Important
If you clear site/browser data, the locally stored collection can be erased.
Use **Backup → Export backup** periodically and keep the JSON file somewhere private.

## Cross-device sync
This version intentionally has no cloud sync. Adding secure sync later would require authentication and a private backend/database.

# Google Sheets Integration Deployment Guide

## Overview
Your app now uses Google Sheets as the backend database via Google Apps Script. This guide walks you through deploying the Apps Script code and configuring environment variables.

---

## Step 1: Deploy Google Apps Script to Your Sheet

### 1.1 Open Your Google Sheet
- Go to: `https://docs.google.com/spreadsheets/d/1wz12I0rRtEjg6yeqreuC6NN_rb4xAf81p4FNsdzUMCA/edit`
- This is your checks sheet (it should have a tab named `checks`)

### 1.2 Access Apps Script Editor
1. Click **Extensions** in the menu bar
2. Select **Apps Script**
3. A new tab will open with the Apps Script editor

### 1.3 Replace Default Code
1. Delete all the default code in the editor
2. Copy the entire contents of `GOOGLE_APPS_SCRIPT.js` from your project
3. Paste it into the Apps Script editor
4. Press **Ctrl+S** (or **Cmd+S** on Mac) to save

### 1.4 Deploy as a Web App
1. Click the **Deploy** button (top right)
2. Select **New deployment**
3. In the dropdown, select **Web app**
4. Configure:
   - **Execute as**: Select your Google account (e.g., yassen@gmail.com)
   - **Who has access**: Select **Anyone** (required for your Next.js app to call it)
5. Click **Deploy**
6. A dialog will show your deployment URL, e.g.:
   ```
   https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
   ```
7. **Copy this URL** — you'll need it for the next step

### 1.5 Test the Apps Script (Optional)
1. In the Apps Script editor, click **Run** to test the `testScript()` function
2. It will initialize your sheet with headers and test data
3. Go back to your Google Sheet and refresh — you should see columns: `id`, `company`, `checkNumber`, `amount`, `date`, `followUpDate`

---

## Step 2: Configure Environment Variables

### 2.1 Local Development (`.env.local`)
1. In your project root, create or edit `.env.local`
2. Add:
   ```
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
   ```
   Replace `{DEPLOYMENT_ID}` with the ID from your deployment URL in Step 1.4

3. Save and restart your dev server:
   ```bash
   npm run dev
   ```

### 2.2 Vercel Production
1. Go to your Vercel project: `https://vercel.com/dashboard`
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add**
5. Add:
   - **Name**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: Paste your deployment URL from Step 1.4
   - **Select environments**: Check `Production` (and `Preview`/`Development` if you want)
6. Click **Save**
7. **Redeploy** your project to apply the change:
   - Go to **Deployments**
   - Click the three dots (...) on the latest deployment
   - Select **Redeploy**

---

## Step 3: Test Your Integration Locally

### 3.1 Start the Dev Server
```bash
npm run dev
```
Visit `http://localhost:3000`

### 3.2 Test Add/Edit/Delete Checks
1. Log in with:
   - Username: `yassen`
   - Password: `9569633`
2. Try these operations:
   - **Add a check**: Fill the form and click "Add Check"
   - **Refresh the page**: The check should still be there (fetched from Google Sheets)
   - **Edit the check**: Click "Edit" and change a field, then "Update Check"
   - **Delete the check**: Click "Delete" to remove it

### 3.3 Verify Data in Google Sheets
1. Go back to your Google Sheet
2. Refresh the page
3. You should see your added checks in the `checks` tab as rows
4. Each row has: `id`, `company`, `checkNumber`, `amount`, `date`, `followUpDate`

---

## Step 4: Deploy to Vercel

### 4.1 Commit and Push Your Changes
```bash
git add .
git commit -m "Update API routes to use Google Sheets via Apps Script"
git push origin main
```

### 4.2 Verify Deployment
1. Go to Vercel: `https://vercel.com/dashboard`
2. Your project should auto-deploy when you push
3. Wait for the build to complete (green checkmark)
4. Click the deployment URL to test in production

### 4.3 Test in Production
1. Visit your deployed URL (e.g., `https://yassen-pro.vercel.app`)
2. Log in and repeat the test from Step 3.2
3. Data should persist across page refreshes and devices

---

## Troubleshooting

### Issue: "Google Apps Script URL not configured"
**Solution**: 
- Make sure you added `GOOGLE_APPS_SCRIPT_URL` to `.env.local` (locally) or Vercel env vars (production)
- Restart your dev server after adding the env var

### Issue: Error 404 when trying to add/edit/delete checks
**Solution**:
- Go back to your Google Sheet and check the `checks` tab
- Make sure there's a header row with columns: `id`, `company`, `checkNumber`, `amount`, `date`, `followUpDate`
- If headers are missing, run the `testScript()` function in Apps Script editor (Step 1.5)

### Issue: CORS or "Failed to save check"
**Solution**:
- Check that your Apps Script deployment is set to "Anyone" can access (Step 1.4)
- Verify the deployment URL is correct in your env var
- Check the browser console for the exact error message

### Issue: Data shows locally but not on Vercel
**Solution**:
- Make sure the `GOOGLE_APPS_SCRIPT_URL` env var is set in Vercel (Step 2.2)
- Redeploy your Vercel project after adding the env var
- Wait 2-3 minutes for the deployment to complete

---

## How It Works

### Architecture
```
Your App (Next.js)
  ↓ HTTP POST
  ↓ /api/checks (GET/POST)
  ↓ /api/checks/[id] (GET/PUT/DELETE)
  ↓
API Routes call Google Apps Script
  ↓ HTTP POST (method, path, body)
  ↓
Google Apps Script (Apps Script)
  ↓ Reads/Writes to Google Sheet
  ↓
Google Sheet (`checks` tab)
```

### Data Flow
1. **Add Check**: Form → `POST /api/checks` → Apps Script `handlePostCheck()` → Inserts row in sheet
2. **View Checks**: Page load → `GET /api/checks` → Apps Script `handleGetChecks()` → Returns all rows as JSON
3. **Edit Check**: Form → `PUT /api/checks/{id}` → Apps Script `handlePutCheck()` → Updates row in sheet
4. **Delete Check**: Button → `DELETE /api/checks/{id}` → Apps Script `handleDeleteCheck()` → Deletes row

---

## Next Steps

- **Monitor Google Sheet**: Open the sheet anytime to see your data in real-time
- **Backup**: Google Sheets auto-saves all versions in revision history
- **Scale**: If you add more columns to your sheet, update `GOOGLE_APPS_SCRIPT.js` to handle them
- **Permissions**: Share the sheet with team members so they can see the data too

---

## Reference

- **Google Sheet**: `https://docs.google.com/spreadsheets/d/1wz12I0rRtEjg6yeqreuC6NN_rb4xAf81p4FNsdzUMCA/edit`
- **Apps Script Code Location**: `/GOOGLE_APPS_SCRIPT.js` (in your project)
- **API Routes**: `/app/api/checks/route.ts`, `/app/api/checks/[id]/route.ts`

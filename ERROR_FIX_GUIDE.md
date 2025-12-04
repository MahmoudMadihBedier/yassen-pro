# 🚨 Vercel Deployment Issue - SOLUTION

## The Problem

When you tried to add a check, you got:
- **Error:** "Error saving check. Please try again."
- **Status Code:** 400 Bad Request
- **Root Cause:** `GOOGLE_APPS_SCRIPT_URL` environment variable is **NOT SET** in Vercel

---

## Why This Happens

The 400 error occurs because:
1. Your app tries to POST to `/api/checks`
2. The API route checks if `GOOGLE_APPS_SCRIPT_URL` is configured
3. It's empty/not set in Vercel
4. The API returns an error

**The issue is NOT with your Google Apps Script code** — it's that Vercel doesn't have the URL configured yet.

---

## ✅ Solution: Add Environment Variable to Vercel

### Step-by-Step Instructions

#### 1️⃣ Go to Vercel Dashboard
```
https://vercel.com/dashboard
```

#### 2️⃣ Click Your Project
- Find and click: **yassen-pro**

#### 3️⃣ Go to Settings
- Click **Settings** tab (top navigation)

#### 4️⃣ Find Environment Variables
- Left sidebar: Click **Environment Variables**

#### 5️⃣ Add the Variable
- Click the **Add** button
- **Name:** `GOOGLE_APPS_SCRIPT_URL`
- **Value:** `https://script.google.com/macros/s/AKfycbzbHfWQTt-t3_9tUxn6vE4IqZu3FW9fVEhgtR10O06naEJ6EtNI2F62xNjKTdsK0no-QQ/exec`
- **Environments:** Select ✅ **Production**
- Click **Save**

#### 6️⃣ Redeploy the Project
- Click **Deployments** (top navigation)
- Find the **latest deployment**
- Click the **three dots (•••)** on the right
- Click **Redeploy**
- **Wait 2-3 minutes** for the build to complete
- Look for a **green checkmark** ✅

#### 7️⃣ Test the App
- Click your production URL
- Log in: `yassen` / `9569633`
- Try adding a check again
- **It should work now!** ✅

---

## 📋 Verification Checklist

After setting the environment variable and redeploying:

- [ ] Vercel shows green checkmark on the deployment
- [ ] App loads without errors
- [ ] Can log in with `yassen` / `9569633`
- [ ] Can add a new check ✅ (should see it appear in list)
- [ ] Refresh the page ✅ (check should still be there)
- [ ] Go to Google Sheet ✅ (check data should appear in sheet)
- [ ] Can edit a check
- [ ] Can delete a check

---

## 🔍 Why Data Wasn't Saving

**Before you set the env variable:**
- App sent POST request to `/api/checks`
- API tried to call Google Apps Script
- Google Apps Script URL was missing (empty string)
- API returned error
- Data was NOT saved to Google Sheet

**After you set the env variable:**
- App sends POST request to `/api/checks`
- API has the Google Apps Script URL
- API calls Google Apps Script with your data
- Google Apps Script inserts data into Google Sheet
- Data IS saved ✅

---

## 🔑 Key Information

### Your Apps Script URL (Already Deployed)
```
https://script.google.com/macros/s/AKfycbzbHfWQTt-t3_9tUxn6vE4IqZu3FW9fVEhgtR10O06naEJ6EtNI2F62xNjKTdsK0no-QQ/exec
```

### Your Google Sheet
```
https://docs.google.com/spreadsheets/d/1wz12I0rRtEjg6yeqreuC6NN_rb4xAf81p4FNsdzUMCA/edit
```

### Login Credentials
```
Username: yassen
Password: 9569633
```

---

## ⚠️ Important Notes

1. **Environment variables are case-sensitive** — Use exactly `GOOGLE_APPS_SCRIPT_URL`
2. **After changing env vars, you MUST redeploy** — Environment variables don't take effect until you redeploy
3. **Redeployment takes 2-3 minutes** — Be patient while it builds
4. **Green checkmark = success** — Once you see the green checkmark, your app is ready

---

## 🆘 If It Still Doesn't Work

### Check 1: Verify Env Variable is Set
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Confirm `GOOGLE_APPS_SCRIPT_URL` is there with the correct value

### Check 2: Verify Redeployment Completed
1. Go to Deployments
2. Latest deployment should have a **green checkmark** ✅
3. If it has an error, click on it to see what went wrong

### Check 3: Check Browser Console
1. Open your app in Vercel
2. Press F12 to open Developer Tools
3. Click **Console** tab
4. Try adding a check
5. Look for error messages

### Check 4: Check Vercel Logs
1. Go to Deployments
2. Click the latest deployment
3. Click **Logs**
4. Try adding a check
5. See what error appears in real-time

---

## 📞 Still Having Issues?

**Common Errors:**

#### "Error saving check"
→ Environment variable not set or redeployment didn't complete. Follow Step 6 above (Redeploy).

#### "Server configuration error: GOOGLE_APPS_SCRIPT_URL not set"
→ Same as above. Add the env var in Settings → Environment Variables.

#### Data not appearing in Google Sheet
→ Check that:
1. Google Sheet is accessible (try opening it manually)
2. "checks" tab exists in the sheet
3. Google Apps Script is deployed (check Google Sheet → Extensions → Apps Script)

---

## ✨ Summary

**The fix is simple:**
1. Add 1 environment variable in Vercel
2. Redeploy
3. Test

**That's it!** Your app will then sync all data with Google Sheets. ✅

---

**Next Step: Follow the 7 steps above in your Vercel dashboard!** 🚀

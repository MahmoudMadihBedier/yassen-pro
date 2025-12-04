# MongoDB Deployment Fix Guide for Vercel

## Problem Summary
- When you add a check on Vercel, you get: `Error saving check. Please try again.` (HTTP 400/503)
- When you refresh, data disappears
- Root cause: Vercel cannot connect to MongoDB Atlas (network/IP access issue, not code)

---

## Root Cause Analysis
Your MongoDB connection is failing because:
1. **Atlas IP Whitelist**: MongoDB Atlas only allows connections from whitelisted IPs
2. **Vercel IPs not whitelisted**: Your Vercel deployment runs on dynamic IPs not in your whitelist
3. **Result**: When the Vercel app tries to connect to Atlas, the connection is blocked at the network level

---

## Solution: Step-by-Step Instructions

### STEP 1: Verify Your MongoDB Atlas Credentials
**What we're checking**: That your connection string is correct and credentials exist

1. Go to: https://cloud.mongodb.com
2. Log in with your MongoDB account
3. Click on **Cluster0** (or your cluster name)
4. In the left sidebar, click **Connect**
5. Click **Drivers**
6. In "Select your driver", choose:
   - Driver: **Node.js**
   - Version: **5.9 or later**
7. You'll see a code sample with a connection string like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. **Check**: Copy this connection string and verify:
   - `username` = `mahmoudmadih150_db_user` (or whatever you created)
   - `password` = the password you copied earlier (should not show on screen)
   - Cluster name = `cluster0` (matches your connection string)
   - Database name = `yassen-pro` (you'll use this as MONGODB_DB)

**Your connection string should look like** (DO NOT share the password publicly):
```
mongodb+srv://mahmoudmadih150_db_user:<PASSWORD>@cluster0.mongodb.net/?retryWrites=true&w=majority
```

---

### STEP 2: Allow Vercel IPs in MongoDB Atlas (Temporary)
**What we're doing**: Opening MongoDB to accept connections from Vercel

1. In MongoDB Atlas, go to **Network Access** (left sidebar)
2. Click **Add IP Address** button
3. A dialog appears. Click **Allow Access from Anywhere**
   - This adds `0.0.0.0/0` (temporary, allows all IPs)
   - ⚠️ **This is for testing only**. After confirming it works, you can restrict to specific IPs.
4. Click **Confirm**
5. Wait for the change to apply (usually 1-2 minutes). You'll see a green checkmark when ready.

---

### STEP 3: Add Environment Variables to Vercel
**What we're doing**: Setting the MongoDB connection string in your Vercel deployment

1. Go to: https://vercel.com/dashboard
2. Click on your project: **bouncedb-check-manager** (or whatever it's named)
3. Click **Settings** (top navigation)
4. In the left sidebar, click **Environment Variables**
5. You should see existing vars. Click **Add New** to add two variables:

**Variable 1: MONGODB_URI**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://mahmoudmadih150_db_user:A3AcBrYnnTRi7ZVR@cluster0.mongodb.net/?retryWrites=true&w=majority`
  - Replace `<PASSWORD>` with your actual password (you copied this from Atlas earlier)
  - Keep the full URL exactly as shown (including `/?retryWrites=true&w=majority`)
- Environment: Select **Production** ✅
- Click **Save**

**Variable 2: MONGODB_DB**
- Name: `MONGODB_DB`
- Value: `yassen-pro`
- Environment: Select **Production** ✅
- Click **Save**

✅ **Confirm both variables are visible in the list** after saving.

---

### STEP 4: Redeploy on Vercel
**What we're doing**: Telling Vercel to rebuild the app with the new environment variables

1. Still in Vercel, go to **Deployments** (top navigation)
2. Find the most recent deployment (at the top of the list)
3. Click the **three dots** (•••) on the right
4. Click **Redeploy**
5. A dialog appears asking about build cache. Click **Redeploy** again
6. Wait for the build to finish (you'll see progress):
   - "Installing dependencies..." → "Running build..." → "Ready"
   - This takes 1-2 minutes

✅ **When it says "Ready", the deployment is complete.**

---

### STEP 5: Test the API Health Endpoint
**What we're checking**: Can Vercel reach MongoDB Atlas?

From your computer, open a terminal and run:

```bash
curl -i https://bouncedb-check-manager.vercel.app/api/health
```

**Expected response (Success)**:
```
HTTP/2 200
content-type: application/json
...
{"ok":true,"db":"yassen-pro"}
```

**If you get 503 with an error**:
- Paste the full JSON response here and I'll diagnose
- Common issues:
  - `MONGODB_URI not set`: Env var didn't save in Vercel (go back to Step 3, verify both vars are there)
  - `ENOTFOUND _mongodb._tcp.cluster0.mongodb.net`: DNS issue (very rare, check cluster name is `cluster0`)
  - `SSL/TLS alert`: IP still not whitelisted (go back to Step 2, verify `0.0.0.0/0` is showing with a green checkmark)

---

### STEP 6: Test Create + Read
**What we're checking**: Can you add a check and have it persist?

#### 6a: Create a check (HTTP POST)

From your terminal, run this **on a single line** (replace `<DOMAIN>` with your actual domain):

```bash
curl -i -X POST https://bouncedb-check-manager.vercel.app/api/checks \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-04","checkNumber":"TEST001","amount":5000,"name":"Test User","building":"Test Building","unitNumber":"5","paymentWay":"","status":"bounced","staff":"","email":"test@example.com","phone":"+201234567890","followUpDate":"2025-12-18","returnDate":"2025-12-04","cpvNumber":"","notes":""}'
```

**Expected response (Success)**:
```
HTTP/2 201
content-type: application/json
...
{"date":"2025-12-04","checkNumber":"TEST001","amount":5000,"name":"Test User",...,"id":"507f1f77bcf86cd799439011"}
```

The `id` field in the response = MongoDB ObjectId (save this for later testing).

**If you get 400 or 503**:
- Paste the error response here

#### 6b: Read all checks (HTTP GET)

From your terminal, run:

```bash
curl -i https://bouncedb-check-manager.vercel.app/api/checks
```

**Expected response (Success)**:
```
HTTP/2 200
content-type: application/json
...
[{"date":"2025-12-04","checkNumber":"TEST001",...,"id":"507f1f77bcf86cd799439011"}]
```

You should see the check you just created.

---

### STEP 7: Test in Your Web Browser
**What we're checking**: Full user workflow (UI → API → DB → UI)

1. Open: https://bouncedb-check-manager.vercel.app in your browser
2. Log in (username: `yassen`, password: `9569633`)
3. Click **+ Add New Check**
4. Fill in a form:
   - Check Number: `TEST002`
   - Name: `Browser Test`
   - Building: `TestBld`
   - Amount: `10000`
   - Email: `browser@test.com`
   - Phone: `+201234567890`
   - Other fields: leave as default
5. Click **Add Check**

**Expected**:
- No error alert ("Error saving check")
- Check appears in the list below
- User is logged in and username "yassen" shows in top right

6. **Refresh the page** (F5 or Cmd+R):

**Expected**:
- ✅ After login, the check you just created is still visible
- ✅ No data loss

---

## Troubleshooting

### Problem: "Error saving check. Please try again."
**Possible causes**:
1. Vercel env vars not set (go to Step 3, verify both `MONGODB_URI` and `MONGODB_DB` are there)
2. MongoDB Atlas IP not whitelisted (go to Step 2, confirm `0.0.0.0/0` shows with a green checkmark)
3. Wrong password in `MONGODB_URI` (go to Step 1, copy the correct connection string from Atlas)

### Problem: `/api/health` returns 503
**Error message**: `ENOTFOUND _mongodb._tcp.cluster0.mongodb.net`
- **Fix**: Check that your cluster is named `cluster0` in Atlas. If it's different, update the connection string.

### Problem: `/api/health` returns 503
**Error message**: `SSL/TLS alert internal error`
- **Fix**: This means the DNS lookup worked but TLS negotiation failed. Usually means IP is still blocked. Confirm `0.0.0.0/0` is whitelisted (Step 2).

### Problem: Data disappears after refresh
**Cause**: App is falling back to localStorage because DB is not reachable.
- **Fix**: Verify `/api/health` returns 200 (Step 5). If it returns 503, fix the MongoDB connection first.

---

## After Confirming It Works (Production Hardening)

Once you confirm the app works end-to-end:

1. **Restrict MongoDB access** (instead of `0.0.0.0/0`):
   - Vercel uses dynamic IPs, so you have two options:
     - Option A: Keep `0.0.0.0/0` (less secure but simpler)
     - Option B: Restrict to Vercel IPs (more secure; requires setup with Vercel support or VPC peering)

2. **Enable database audit logging** in MongoDB Atlas (optional)

3. **Set up automated backups** in MongoDB Atlas (optional)

---

## Summary Checklist

- [ ] Step 1: Verified connection string and credentials in Atlas
- [ ] Step 2: Added `0.0.0.0/0` to Atlas Network Access
- [ ] Step 3: Added `MONGODB_URI` and `MONGODB_DB` to Vercel Production env vars
- [ ] Step 4: Redeployed on Vercel
- [ ] Step 5: Tested `/api/health` → got 200 with `{"ok":true}`
- [ ] Step 6a: Tested POST `/api/checks` → got 201 with created check
- [ ] Step 6b: Tested GET `/api/checks` → got the created check back
- [ ] Step 7: Tested in browser: add check → refresh → data persists

---

## Questions?

If you get stuck on any step, paste:
1. The step number
2. What you see on screen (or the error message)
3. The full response from any curl command

I'll help debug.

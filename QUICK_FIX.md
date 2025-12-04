# ⚡ QUICK FIX - 5 MINUTES TO WORKING APP

## The Issue (2 words)
Missing environment variable.

## The Solution (2 steps)

### Step 1: Add Environment Variable
```
Vercel → Settings → Environment Variables → Add
Name: GOOGLE_APPS_SCRIPT_URL
Value: https://script.google.com/macros/s/AKfycbzbHfWQTt-t3_9tUxn6vE4IqZu3FW9fVEhgtR10O06naEJ6EtNI2F62xNjKTdsK0no-QQ/exec
Environments: ✅ Production
Click: Save
```

### Step 2: Redeploy
```
Vercel → Deployments → Latest → ••• → Redeploy
Wait for green checkmark (2-3 minutes)
```

## Test It
```
1. Go to your app URL
2. Log in: yassen / 9569633
3. Add a check
4. Refresh page (data should still be there!)
5. Check Google Sheet (data should be there!)
```

---

## Why It Was Failing

Your app code is fine. The issue:
- Vercel didn't know the Google Apps Script URL
- So it couldn't send data to your sheet
- Now it will! ✅

---

## Done?
See `ERROR_FIX_GUIDE.md` for detailed instructions.

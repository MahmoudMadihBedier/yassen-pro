# Quick Start: Google Sheets Deployment

## TL;DR (5 Steps)

### 1. Deploy Apps Script
```
Extensions → Apps Script
→ Delete default code
→ Paste GOOGLE_APPS_SCRIPT.js contents
→ Ctrl+S (save)
→ Deploy → Web app → Execute as: [your account] → Anyone can access
→ Copy deployment URL
```

### 2. Add Environment Variable (Local)
Create `.env.local`:
```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
```

### 3. Test Locally
```bash
npm run dev
# Log in: yassen / 9569633
# Add/edit/delete checks
# Check appears in Google Sheet
```

### 4. Add Environment Variable (Vercel)
```
Vercel Dashboard
→ Settings → Environment Variables
→ Add: GOOGLE_APPS_SCRIPT_URL = [your URL from step 1]
→ Save
```

### 5. Redeploy to Vercel
```
Vercel Dashboard → Deployments
→ Click latest deployment (...)
→ Redeploy
→ Test at production URL
```

---

## What's Already Done
✅ Google Apps Script code created (`GOOGLE_APPS_SCRIPT.js`)  
✅ API routes updated (`/api/checks` and `/api/checks/[id]`)  
✅ All routes ready to call Apps Script  
✅ TypeScript compiles with no errors  

## What You Need to Do
1. Paste Apps Script code into Google Sheet
2. Get deployment URL
3. Add URL to `.env.local` and Vercel
4. Redeploy and test

---

## Files Modified
- `app/api/checks/route.ts` — Now calls Google Apps Script (GET/POST)
- `app/api/checks/[id]/route.ts` — Now calls Google Apps Script (GET/PUT/DELETE)
- Created: `GOOGLE_SHEETS_DEPLOYMENT.md` — Full deployment guide
- Created: `QUICK_START.md` — This file

---

## Validation
- No TypeScript errors
- All imports correct
- All functions exported properly
- Ready for testing

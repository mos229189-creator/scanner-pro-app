# Cloud Build Setup — Scanner Pro (Codemagic)

This guide gets you from zero to a downloadable APK/AAB with no software
installed on your computer.

---

## What you need (free accounts)

| Service | Link | Cost |
|---------|------|------|
| GitHub | https://github.com/signup | Free |
| Codemagic | https://codemagic.io/signup | Free (500 min/month) |

---

## Step 1 — Push the project to GitHub

1. Create a new **private** repo on GitHub (https://github.com/new)
   - Name it `scanner-pro` (or anything you like)
   - Leave it empty (no README)

2. In your Replit terminal, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/scanner-pro.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Create a signing keystore

You need this once. Keep the file and passwords safe — you'll need them
for every future update.

Run this in **any** terminal (Git Bash, Mac Terminal, Linux) or use
Codemagic's key management UI (Step 3b below):

```bash
keytool -genkeypair \
  -alias scanpro \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore scanpro-release.jks \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Scanner Pro, OU=App, O=YourName, L=City, S=State, C=US"
```

Then encode it to base64 for Codemagic:
```bash
# Mac / Linux
base64 -i scanpro-release.jks | pbcopy     # copies to clipboard

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("scanpro-release.jks")) | clip
```

---

## Step 3 — Configure Codemagic

1. Sign up at https://codemagic.io/signup
2. Click **Add application** → connect your GitHub account → select `scanner-pro`
3. Codemagic will detect `codemagic.yaml` automatically — click **Finish**

### 3b — Add signing secrets

Go to **Teams → Global variables & secrets** → create a group named
exactly `keystore_credentials`, then add these four variables:

| Variable name | Value | Secure? |
|---|---|---|
| `CM_KEYSTORE` | The base64 string from Step 2 | ✅ Yes |
| `CM_KEYSTORE_PASSWORD` | Your `--storepass` value | ✅ Yes |
| `CM_KEY_ALIAS` | `scanpro` | No |
| `CM_KEY_PASSWORD` | Your `--keypass` value | ✅ Yes |

### 3c — Update the email

Open `codemagic.yaml` in the repo and replace `your@email.com` with
your real email so Codemagic can notify you when the build finishes.

---

## Step 4 — Start a build

1. In Codemagic, open your `scanner-pro` app
2. Click **Start new build** → select workflow `android-release` → **Start**
3. Build takes about 10–15 minutes

---

## Step 5 — Download your APK / AAB

When the build finishes you'll receive an email with a download link.
You can also find the files in Codemagic:

**Builds → [your build] → Artifacts**

| File | Use for |
|---|---|
| `app-release.apk` | Direct installation on Android (share link / sideload) |
| `app-release.aab` | Upload to Google Play Console |

---

## Play Store upload checklist

Once you have the `.aab`:

1. Go to https://play.google.com/console
2. **Create app** → fill in name, language, type (App), category (Tools)
3. **Store listing** → paste text from `playstore-assets/listing-text.md`
4. Upload screenshots and feature graphic from `playstore-assets/` folder
5. Upload `icon-512x512.png` as the high-res icon
6. **Production → Create release** → upload `app-release.aab`
7. Submit for review (usually 3–7 days)

---

## Updating the app in the future

1. Make your changes in Replit
2. `git add . && git commit -m "Update" && git push`
3. Codemagic picks up the push and can auto-build (enable in Settings → Build triggers)
4. Download the new `.aab`, go to Play Console → create a new release

---

## AdMob IDs (already wired in)

| | ID |
|---|---|
| App ID | `ca-app-pub-4796587410639477~1906161927` |
| Banner | `ca-app-pub-4796587410639477/2365472715` |
| Interstitial / Rewarded | `ca-app-pub-4796587410639477/1052391042` |

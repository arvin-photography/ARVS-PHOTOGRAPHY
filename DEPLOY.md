# Putting the portfolio online (Vercel) + the owner's admin

This guide takes the site from your computer to a live address on Vercel, then switches on:

- **/admin**: where the owner signs in and edits text, projects and photos.
- **The contact form**: enquiries arrive by email.

Each step is done once. Allow about 30 minutes.

**How editing works:** when the owner presses **Publish** in /admin, the change is saved to the GitHub repository. Vercel notices and rebuilds the site automatically, and the update is live in **about 1–2 minutes**. There's no database: the content lives in `client/src/content/*.json` and the photos in `client/public/images/uploads/`.

---

## 1. Push the latest code to GitHub

```powershell
git add -A
git commit -m "Add owner admin and Vercel setup"
git push
```

## 2. Create the Vercel project

1. Go to **https://vercel.com/signup** and choose **Continue with GitHub**.
2. Click **Add New… → Project** and **Import** the `ARVS-PHOTOGRAPHY` repository.
   If it isn't listed, click **Adjust GitHub App Permissions** and allow access to it.
3. Leave these settings as they are, because `vercel.json` already sets them:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - Build and install commands: leave the defaults.
4. Click **Deploy** and wait for it to finish (about 1–2 minutes).
5. Copy your address from the project page, e.g. `https://arvs-photography.vercel.app`.
   Steps 3–5 call it **YOUR-SITE**.

At this point the site works. **/admin** and the **contact form** don't work yet; steps 3–5 switch them on.

> **Plan note:** Vercel's free **Hobby** plan is for personal, non-commercial projects. If the portfolio is used to sell commissions, Vercel's terms may require the **Pro** plan.

## 3. Let the owner sign in to /admin (GitHub login)

1. Open **https://github.com/settings/developers → OAuth Apps → New OAuth App**.
   (This must be done on the GitHub account that owns the repository.)
2. Fill in:
   - **Application name:** `Portfolio admin`
   - **Homepage URL:** `https://YOUR-SITE`
   - **Authorization callback URL:** `https://YOUR-SITE/api/callback`
3. Click **Register application**. Then:
   - Copy the **Client ID**.
   - Click **Generate a new client secret** and copy the secret. GitHub shows it only once.
4. In **Vercel → your project → Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `OAUTH_GITHUB_CLIENT_ID` | the Client ID |
   | `OAUTH_GITHUB_CLIENT_SECRET` | the client secret |

5. Go to **Deployments**, open the **⋯** menu on the latest deployment and choose **Redeploy**.
   Environment variables only take effect after a redeploy.

**Who can edit:** anyone whose GitHub account can push to the repository.
- If the owner is you, you're done.
- Otherwise, the owner creates a free GitHub account. You add them under **GitHub → the repository → Settings → Collaborators → Add people**, and they accept the email invite.

## 4. Make the contact form email the owner

Vercel can't save files, so the form sends each enquiry by email through **Resend** (free plan).

1. Sign up at **https://resend.com** with **the email address that should receive enquiries**.
2. Go to **API Keys → Create API Key** (permission: *Sending access*) and copy the key.
3. In **Vercel → Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key (starts with `re_`) |
   | `CONTACT_TO_EMAIL` | the email you signed up to Resend with |

4. **Redeploy** again, as in step 3.5.

Until you add your own domain in Resend, it only delivers to the email you signed up with, which is all this form needs. Enquiries arrive from `onboarding@resend.dev`, and pressing **Reply** answers the visitor directly.

If you've verified your own domain in Resend, you can also set `CONTACT_FROM_EMAIL`, e.g. `Portfolio <hello@yourdomain.com>`.

## 5. Try it

1. Open `https://YOUR-SITE/admin`, click **Sign in with GitHub** and approve.
2. Click any text on the page, change something small, then click **Publish** at the top right.
3. Watch **Vercel → Deployments**: a new build starts by itself. After about 1–2 minutes, refresh the site and the change is there.
4. Send yourself a test message through the contact form.

---

## Using the editor (for the owner)

`/admin` shows each part of the website as it looks to visitors. Pick a part in the left menu (on a phone, the row of tabs at the top), then edit it right there:

| To… | Do this |
| --- | --- |
| Change text | Click it and type. A purple label shows what you're editing. Press Enter (or click elsewhere) to finish, or Esc to cancel. |
| Change a photo | Hover it and click **Replace**, or drag a photo from your computer onto it. |
| Add photos | Click a dashed **Add** tile and pick one or more, or drop photos onto it. |
| Move or delete something | Use the small buttons that appear on it (← → / ↑ ↓ and the bin). In photo grids you can also drag photos to reorder them. |
| Fix a mistake | **Undo** / **Redo** at the top (or Ctrl+Z / Ctrl+Shift+Z). **Discard** throws away everything you haven't published. |
| Make it live | **Publish** (top right). The site updates in about a minute. |

| Section | What it changes on the site |
| --- | --- |
| **Opening & portrait** | Studio name (big title, menu, browser tab), tagline, your portrait, its caption, your name and intro |
| **About** | Statement, the big numbers, the About photo, "In the bag" |
| **Selected work** | The film-strip projects: cover, title, details, story, and the series photos shown when a project is opened. **Use as cover** picks the cover from the series. |
| **Contact sheet** | The archive grid. Rows of six look best (6, 12, 18, 24…). |
| **Services** | The scrolling words, and each service with its hover photo |
| **Contact & footer** | Availability, email, social links, and your name (drawn as the signature) |

- **Keeping track:** a dot next to a section in the menu means it has unpublished changes, and the top bar says how many. Leaving the page with unpublished changes asks you first.
- **Photos:** upload straight from the camera or phone (JPG, PNG or WebP). The editor shrinks big photos (max 3000px) before uploading, and each build makes web-sized copies and thumbnails.
- **Portrait:** a 3:2 landscape photo works best. The blurred and negative versions used in the intro are made automatically.
- **Changes aren't instant:** a change is live after Vercel finishes rebuilding, which you can see under **Vercel → Deployments**.
- **If Publish says the site was changed somewhere else:** another device or tab published in the meantime. Choose **Load the latest version** (drops your unpublished edits) or **Publish mine anyway**.
- **Mistakes:** every Publish is a commit, so earlier versions can be restored from the repository's history on GitHub.

## Optional: your own domain

1. In **Vercel → Settings → Domains**, add the domain and follow the DNS instructions.
2. Then go back to the **GitHub OAuth App** from step 3 and change both URLs to the new domain.
   Otherwise /admin login only works on the old `.vercel.app` address.

## Editing on your own computer (no GitHub login)

```powershell
npm run install:all   # once
npm run dev           # site + API
```

Open **http://localhost:5173/admin/**. It works the same as online, but **Save** writes straight to the files on your computer and doesn't need a GitHub login. Commit and push them yourself when you're happy.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| /admin login says "GitHub login is not set up yet" | Step 3.4: the env vars are missing, or you didn't redeploy. |
| GitHub says "redirect_uri is not associated with this application" | The OAuth App's callback URL must be exactly `https://YOUR-SITE/api/callback`, using the address you're actually opening. |
| Editor says the GitHub account "can't edit this website" | The signed-in account doesn't have write access to the repository (step 3, "Who can edit"). Click your picture at the top right to sign out, then sign in with the owner's account. |
| "Your browser blocked the sign-in window" | Allow pop-ups for the site (icon at the right of the address bar), then click Sign in again. |
| Contact form says "The form is not connected yet" | Step 4: `RESEND_API_KEY` / `CONTACT_TO_EMAIL` are missing, or you didn't redeploy. |
| A new photo doesn't show | Wait for the Vercel deployment to finish. If the build failed, open it in Vercel → Deployments to see why (e.g. an unreadable file). |

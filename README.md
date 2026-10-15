# Dreamy Needle by Shruti — Atelier Web Application

Bespoke, handcrafted embroidery atelier website featuring interactive customization, dynamic review showcase, continuous animated scroll stitch, and instant zero-flicker client-side routing.

---

## ✨ Features

- **Instant Zero-Flicker Navigation**: Fluid client-side tab switching across all 5 studio views (`Home`, `Creations & Gallery`, `Custom Ordering`, `About Studio`, `Contact & FAQ`) while preserving clean, bookmarkable URLs and smooth active indicator animations.
- **Handcrafted Running Stitch Engine**: Responsive SVG-based continuous cotton embroidery seam with real needle translation and tilt along the left border as the user scrolls.
- **Dynamic Review Storage**: Client review submission modal with interactive star rating selection, saving to `reviews.json` on local/server environments and falling back gracefully to `localStorage`.
- **Artisanal Custom Dropdowns**: Luxury boutique select menu replacement eliminating default OS dropdowns.
- **Fast WhatsApp Order Builder**: Interactive garment & motif builder compiling pre-formatted WhatsApp commission messages.
- **Mobile-First Responsive Layout**: Drawer navigation with backdrop blur, touch-friendly tap targets, and 0 horizontal scroll overflow on all viewports.
- **SEO & Social Share Ready**: Complete Open Graph and Twitter card meta tags for rich previews on WhatsApp, iMessage, and social media.

---

## 📁 Project Structure

```text
dreamy-needle/
├── api/
│   └── reviews.js          # Zero-dependency Vercel Serverless Function for /api/reviews
├── assets/
│   └── img/                # High-resolution embroidery lookbook & logo assets
├── index.html              # Studio Home View
├── creations.html          # 11 Styles Catalog & Gallery Lookbook
├── custom-order.html       # Ordering Guide & Interactive WhatsApp Message Builder
├── about.html              # Atelier Story & Hand vs Machine Embroidery Philosophy
├── contact.html            # Contact Cards & Accessible FAQ Accordions
├── styles.css              # Artisanal styling, stitch animations & boutique UI
├── script.js               # Shared SPA router, stitch engine & review handlers
├── reviews.json            # Folder directory persistent review storage
├── vercel.json             # Vercel deployment config (clean URLs, caching, API rewrites)
├── package.json            # Node.js project manifest & scripts
├── server.js               # Lightweight Node.js local development server
└── .gitignore              # Ignores .vercel, node_modules, and test files
```

---

## 🚀 Quick Start (Local Development)

```bash
npm start
# Server runs at http://localhost:8000
```

---

## 🌐 Deploy to Vercel

### Option 1: Git Integration (Recommended)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Deploy with default settings.

### Option 2: Vercel CLI
```bash
npx vercel
```

---

## 💬 Live Cloud Reviews (Approach B — Vercel KV)

To enable live, public review submissions stored across all visitors globally:

1. In your **[Vercel Dashboard](https://vercel.com/dashboard)**, open the `dreamy-needle` project.
2. Go to the **Storage** tab.
3. Click **Create Database** → Select **KV** (Free tier).
4. Click **Connect to Project**.

The `/api/reviews` endpoint automatically connects to Vercel KV with zero code modifications.

### Managing & Deleting Reviews

#### On Live Vercel:
```bash
# View all reviews live in the cloud
node manage-reviews.js live-list https://your-site.vercel.app

# Delete a specific review from the live site
node manage-reviews.js live-delete https://your-site.vercel.app <review_id> [admin_secret]
```

#### On Local Machine:
```bash
node manage-reviews.js list
node manage-reviews.js delete <review_id>
node manage-reviews.js clear
```


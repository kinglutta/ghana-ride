# YENKO RIDE — Deployment Guide

Deploy the YENKO RIDE web app to production with **Render** (Node backend) and **Vercel** (Vite frontend). The stack is 100% free: OpenStreetMap tiles, Nominatim geocoding, and OSRM routing — no map API keys required.

## Prerequisites

- GitHub repository pushed to `main` ([github.com/kinglutta/ghana-ride](https://github.com/kinglutta/ghana-ride))
- MongoDB Atlas account (M0 free tier) — or any MongoDB-compatible host
- Render account ([render.com](https://render.com))
- Vercel account ([vercel.com](https://vercel.com))

---

## 1. MongoDB Atlas

1. Create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) (M0 Sandbox is free).
2. **Database Access** → Add a database user with read/write privileges. Save the password.
3. **Network Access** → Add IP `0.0.0.0/0` (Render's outbound IPs are dynamic).
4. **Database** → Connect → Connect your application → Node.js 4.1+.
5. Copy the connection string and append the database name:

```
mongodb+srv://USER:PASSWORD@cluster.mongodb.net/yenko_ride?retryWrites=true&w=majority
```

---

## 2. Backend → Render

`render.yaml` is included in `Backend/` and preconfigures the service. If deploying via the dashboard instead:

| Setting | Value |
| --- | --- |
| Name | `yenkoroide-backend` |
| Environment | Node |
| Branch | `main` |
| Root Directory | `Backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Set these environment variables in Render:

```env
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/yenko_ride?retryWrites=true&w=majority
JWT_SECRET=<random-32+-character-secret>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-app.vercel.app
ADMIN_SIGNUP_CODES=<private-admin-code>
```

> `ADMIN_SIGNUP_CODES` is server-side only. Never put it in the frontend or Vercel environment variables. MongoDB is supplied by Atlas; `render.yaml` does not create a database.

> Generate `JWT_SECRET` with `openssl rand -hex 32`. Never commit real secrets.

Deploy and note the backend URL, e.g. `https://yenkoroide-backend.onrender.com`.

Verify: `GET https://yenkoroide-backend.onrender.com/health` returns JSON with `"status":"healthy"`.

---

## 3. Frontend → Vercel

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `Frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Set this environment variable in Vercel:

```env
VITE_API_URL=https://yenkoroide-backend.onrender.com
```

`Frontend/vercel.json` already rewrites all paths to `/index.html` for client-side routing.

Deploy and note the frontend URL, e.g. `https://yenkoroide.vercel.app`.

---

## 4. Update CORS

The backend allows `FRONTEND_URL` plus any `*.vercel.app` origin in production, so CORS works out of the box. Set `FRONTEND_URL` to your exact Vercel URL for the tightest configuration, then Render redeploys automatically.

---

## 5. Verification checklist

- [ ] `GET /health` on the backend returns `{"status":"healthy", ...}`
- [ ] Frontend loads at the Vercel URL with no console errors
- [ ] Register a new rider; log in
- [ ] Book a ride (map tiles load from OpenStreetMap; fare uses OSRM)
- [ ] Wallet top-up, promo code, referrals, notifications
- [ ] SOS alert; driver verification submission; dispute creation
- [ ] Admin dashboard analytics charts render
- [ ] PWA install prompt appears (manifest + service worker)

For a full phone-based pilot, use **[docs/REAL_WORLD_TESTING.md](./docs/REAL_WORLD_TESTING.md)**.

---

## Environment variable reference

### Backend (`Backend/.env`)

| Variable | Example | Required |
| --- | --- | --- |
| `PORT` | `3000` | Yes |
| `NODE_ENV` | `production` | Yes |
| `MONGODB_URL` | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | random 32+ chars | Yes |
| `JWT_EXPIRES_IN` | `24h` | Yes |
| `FRONTEND_URL` | `https://yenkoroide.vercel.app` | Yes |
| `ADMIN_SIGNUP_CODES` | private code, comma-separated | Recommended |

### Frontend (`Frontend/.env`)

| Variable | Example | Required |
| --- | --- | --- |
| `VITE_API_URL` | `https://yenkoroide-backend.onrender.com` | Yes |

No map/API keys are needed — OpenStreetMap, Nominatim, and OSRM are free and keyless.

---

## Troubleshooting

**Backend won't start** — check `MONGODB_URL`, verify env vars, read Render logs.

**CORS errors** — confirm `FRONTEND_URL` matches the Vercel URL exactly and that `NODE_ENV=production` is set.

**Blank map** — confirm tiles load from `tile.openstreetmap.org`; check the browser console for mixed-content errors.

**API connection failed** — confirm `VITE_API_URL` is the Render URL (no trailing slash) and redeploy the frontend after changing it.

**Cold starts** — Render's free tier sleeps after inactivity; the first request may take ~30s. Use a ping service if needed.

---

## Security checklist

- [ ] No secrets committed to Git (`.env` files are gitignored)
- [ ] Strong random `JWT_SECRET`
- [ ] Atlas network access configured
- [ ] Production CORS restricted to known domains
- [ ] HTTPS enabled (automatic on Render and Vercel)

Your YENKO RIDE deployment is live.

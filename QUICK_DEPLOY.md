# YENKO RIDE — Quick Deploy Checklist

Full instructions: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

- [ ] Code pushed to `origin/main`
- [ ] MongoDB Atlas cluster created; user added; network access `0.0.0.0/0`
- [ ] Backend deployed to Render (`Backend/` root; `render.yaml` or dashboard)
- [ ] Render env vars: `NODE_ENV`, `PORT`, `MONGODB_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`
- [ ] Frontend deployed to Vercel (`Frontend/` root; Vite preset)
- [ ] Vercel env var: `VITE_API_URL=https://<your-backend>.onrender.com`
- [ ] `GET /health` returns `{"status":"healthy"}`
- [ ] Register/login, book a ride, wallet top-up, SOS, analytics all verified

**No map API keys needed** — OpenStreetMap tiles, Nominatim geocoding, and OSRM routing are free and keyless.

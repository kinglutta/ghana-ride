# Real-World Testing Guide

This is the pilot checklist for testing YENKO RIDE outside localhost with real phones, GPS, HTTPS and a shared database.

## 1. What you need

- GitHub repo pushed to `main` — already done.
- MongoDB Atlas cluster — M0 free tier is enough for a pilot.
- Backend deployed on Render.
- Frontend deployed on Vercel.
- Two or three phones with location permissions enabled.
- One Rider account, two verified Captain accounts, one Operations account.

No Google Maps key, paid maps API, or payment gateway is required.

---

## 2. Deploy the backend

Deploy `Backend/` on Render:

| Setting | Value |
| --- | --- |
| Build command | `npm install` |
| Start command | `npm start` |
| Health path | `/health` |
| Root directory | `Backend` |

Set these backend environment variables in Render:

```env
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/yenko_ride
JWT_SECRET=<random-32-character-secret>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-app.vercel.app
ADMIN_SIGNUP_CODES=<private-admin-code>
```

`ADMIN_SIGNUP_CODES` is server-side only. Never put it in Vercel or frontend code.

Verify:

```text
GET https://your-backend.onrender.com/health
```

Expected: JSON with `"status":"healthy"`.

---

## 3. Deploy the frontend

Deploy `Frontend/` on Vercel:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | `Frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |

Set:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Open the Vercel URL in a phone browser. It must be HTTPS. Phone browsers block geolocation on plain HTTP.

---

## 4. Prepare accounts

1. Create a Rider account from `/onboarding?mode=signup&role=rider`.
2. Create two Captain accounts from `/onboarding?mode=signup&role=captain`.
3. Approve both Captains in Operations verification so `isVerified` is true.
4. Create the Operations account with the private `ADMIN_SIGNUP_CODES` value.

Keep all Captains within roughly 10 km of the Rider so the dispatch radius can find them.

---

## 5. Pilot run script

### Booking

- [ ] Rider signs in.
- [ ] Pickup and destination suggestions load from OpenStreetMap.
- [ ] Fare matrix shows GH₵ prices for every vehicle type.
- [ ] Rider selects Motor, Okada, Pragya or Car.
- [ ] Rider chooses Cash or Mobile Money.
- [ ] Ride is created successfully.

### Dispatch

- [ ] Each available Captain receives exactly one `new-ride` alert.
- [ ] Unverified Captains receive nothing.
- [ ] Captains already on a ride receive nothing.
- [ ] No duplicate alert or double vibration.

### Claim and OTP

- [ ] One Captain accepts.
- [ ] A second Captain cannot accept the same ride.
- [ ] Rider receives the 6-digit OTP privately.
- [ ] Captain response and Captain UI contain no OTP.
- [ ] Wrong OTP is rejected.
- [ ] Correct OTP starts the ride.

### Live ride

- [ ] Rider sees the Captain marker moving.
- [ ] Captain location updates carry the ride ID.
- [ ] Chat works only between Rider and assigned Captain.
- [ ] Trip share link opens and shows read-only tracking.
- [ ] SOS appears in Operations once, not twice.

### Completion and money

- [ ] Captain completes the ride.
- [ ] Captain ride count and earnings increase.
- [ ] Rider sees receipt with distance, duration, fare and vehicle.
- [ ] Cash rides show cash acknowledgement.
- [ ] Wallet/Mobile Money rides can be paid from the receipt or Payments page.
- [ ] Rider rating updates the Captain average without changing earnings.

### Failure and recovery

- [ ] Rider cancels while searching; Captain offer clears.
- [ ] Refresh mid-ride keeps the session.
- [ ] Disconnect/reconnect rejoins the ride room.
- [ ] Expired or wrong-role token is rejected.

---

## 6. Watch these during the pilot

- Browser console on all phones.
- Render backend logs.
- Vercel frontend logs.
- MongoDB Atlas documents for rides, captain state and chat.
- `/health` response.

Wake the Render backend before the pilot. Free services can sleep; the first request may be slow.

---

## 7. Pass criteria

The pilot passes when:

1. A real Rider can book from one phone.
2. A verified Captain receives the offer on another phone.
3. OTP starts the ride without leaking to the Captain.
4. Live tracking updates during the trip.
5. Completion credits the Captain and gives the Rider a real receipt.
6. No console errors, CORS errors or duplicate socket events appear.

---

## 8. Limits to remember

- Payments are simulated. Do not collect real money expecting automatic settlement.
- Public Nominatim and OSRM are for light testing. For heavy traffic, self-host or use a proper free quota-aware provider.
- Keep `ADMIN_SIGNUP_CODES`, `JWT_SECRET` and MongoDB credentials out of Git and frontend env vars.

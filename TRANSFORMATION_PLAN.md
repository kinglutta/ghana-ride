# YENKO RIDE PLUS (TRANSFORMATION PLAN)

## Vision
A 100% free-stack ride-hailing platform that sets a new standard for the Ghana/Africa market:
- **Mobile Money first** (MTN MoMo, Vodafone Cash, AirtelTigo Money) — no credit card dependency
- **Safety first** (SOS, trip sharing, driver verification, emergency contacts)
- **Multi-service** (Rides, Delivery, Courier, Bike Taxi)
- **Driver-first economics** (transparent earnings, surge pricing, instant payout requests)
- **Zero paid APIs** — Leaflet/OSM, OSRM, Socket.IO, MongoDB, Firebase (optional push)

---

## GAP ANALYSIS: YENKO RIDE → YENKO RIDE PLUS

| Category | YENKO RIDE (Current) | Global Benchmark | YENKO RIDE Plus (Target) |
|----------|---------------------|------------------|--------------------------|
| Platform | Web (React + Vite) | Mobile + Web | **PWA + Web** (installable) |
| Maps | Leaflet + OSM | Paid map provider | **Leaflet + OSM** (free) |
| Routing | OSRM | Paid directions API | **OSRM** (free) |
| Payments | ❌ None | Cards + MoMo | **Mobile Money + Cash + Wallet** |
| Auth | JWT + bcrypt | Phone + OTP + Email | **Phone OTP + Email + Social** |
| Safety | ❌ None | SOS + Share Trip | **SOS + Emergency Contacts + Trip Share + Driver Verification** |
| Services | Rides only | Ride + Delivery + Courier | **Ride + Delivery + Courier + Bike** |
| Vehicle Types | Basic | Economy, Premium, XL, Bike | **Economy, Comfort, XL, Bike, Delivery** |
| Driver Earnings | ❌ None | ✅ Dashboard | **Earnings + Payout Requests + Weekly Summary** |
| Surge Pricing | ❌ None | ✅ | **Dynamic surge based on demand** |
| Scheduled Rides | ❌ None | ✅ | **Book for later** |
| Promo Codes | ❌ None | ✅ | **Referral + Promo + First-ride discount** |
| Push Notifications | ❌ None | ✅ | **Firebase / Web Push** |
| Ratings | Basic (1-5) | Two-way | **Two-way + Detailed feedback** |
| Admin Dashboard | Basic | Fleet management | **Full fleet + analytics + dispute management** |

---

## TRANSFORMATION ROADMAP

### Phase 1: Core Payments + Safety (Week 1) — CRITICAL
- [x] Mobile Money payment model & endpoints (MTN, Vodafone, AirtelTigo)
- [x] Wallet system (deposit, pay, refund)
- [x] SOS / Emergency button with location broadcast
- [x] Emergency contacts management
- [ ] Trip sharing (share live ride with contacts)

### Phase 2: Multi-Service + Driver Tools (Week 2)
- [x] Service categories (Ride, Delivery, Courier, Bike)
- [x] Vehicle sub-categories (Economy, Comfort, XL)
- [x] Driver earnings dashboard
- [x] Payout request system
- [x] Surge pricing engine

### Phase 3: Advanced Features (Week 3)
- [x] Scheduled rides
- [x] Promo codes & referral system
- [x] Push notifications (Web Push + in-app center)
- [ ] Ride pooling / shared rides
- [x] In-app chat (passenger ↔ driver)

### Phase 4: Polish & Launch (Week 4)
- [x] PWA manifest + offline support
- [x] Driver document verification upload
- [x] Dispute management (admin)
- [ ] Analytics & reports
- [ ] Production deployment

---

## KEY DESIGN PRINCIPLES (YANGO PLUS)

1. **Mobile Money First** — Ghana users pay with MoMo, not credit cards
2. **Safety by Default** — SOS button visible on every active ride
3. **Transparent Pricing** — Fare shown before booking, surge clearly marked
4. **Driver Respect** — Earnings visible, payout requests easy, ratings fair
5. **Works on Weak Networks** — Optimized for 3G, PWA for offline resilience
6. **Zero API Costs** — No paid maps, no Stripe, no paid auth

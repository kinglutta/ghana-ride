# YENKO RIDE → YANGO STANDARD PLUS (TRANSFORMATION PLAN)

## Vision
A 100% free-stack ride-hailing platform that exceeds Yango's standard for the Ghana/Africa market:
- **Mobile Money first** (MTN MoMo, Vodafone Cash, AirtelTigo Money) — no credit card dependency
- **Safety first** (SOS, trip sharing, driver verification, emergency contacts)
- **Multi-service** (Rides, Delivery, Courier, Bike Taxi)
- **Driver-first economics** (transparent earnings, surge pricing, instant payout requests)
- **Zero paid APIs** — Leaflet/OSM, OSRM, Socket.IO, MongoDB, Firebase (optional push)

---

## GAP ANALYSIS: YENKO RIDE vs YANGO

| Category | YENKO RIDE (Current) | Yango Standard | YENKO RIDE Plus (Target) |
|----------|---------------------|----------------|--------------------------|
| Platform | Web (React + Vite) | Mobile + Web | **PWA + Web** (installable) |
| Maps | Leaflet + OSM | Google Maps | **Leaflet + OSM** (free) |
| Routing | OSRM | Google Directions | **OSRM** (free) |
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
- [ ] Mobile Money payment model & endpoints (MTN, Vodafone, AirtelTigo)
- [ ] Wallet system (deposit, pay, refund)
- [ ] SOS / Emergency button with location broadcast
- [ ] Emergency contacts management
- [ ] Trip sharing (share live ride with contacts)

### Phase 2: Multi-Service + Driver Tools (Week 2)
- [ ] Service categories (Ride, Delivery, Courier, Bike)
- [ ] Vehicle sub-categories (Economy, Comfort, XL)
- [ ] Driver earnings dashboard
- [ ] Payout request system
- [ ] Surge pricing engine

### Phase 3: Advanced Features (Week 3)
- [ ] Scheduled rides
- [ ] Promo codes & referral system
- [ ] Push notifications (Firebase Web Push)
- [ ] Ride pooling / shared rides
- [ ] In-app chat (passenger ↔ driver)

### Phase 4: Polish & Launch (Week 4)
- [ ] PWA manifest + offline support
- [ ] Driver document verification upload
- [ ] Dispute management (admin)
- [ ] Analytics & reports
- [ ] Production deployment

---

## KEY DESIGN PRINCIPLES (YANGO PLUS)

1. **Mobile Money First** — Ghana users pay with MoMo, not credit cards
2. **Safety by Default** — SOS button visible on every active ride
3. **Transparent Pricing** — Fare shown before booking, surge clearly marked
4. **Driver Respect** — Earnings visible, payout requests easy, ratings fair
5. **Works on Weak Networks** — Optimized for 3G, PWA for offline resilience
6. **Zero API Costs** — No Google Maps, no Stripe, no paid auth

import React, { lazy, Suspense } from 'react'
import Start from './pages/Start'
import { Navigate, Routes, Route } from 'react-router-dom'
import UserProtectedWrapper from './pages/UserProtectedWrapper'
import CaptainProtectedWrapper from './pages/CaptainProtectedWrapper'
import AdminProtectedWrapper from './pages/AdminProtectedWrapper'
import SocketStatus from './components/SocketStatus'
import YenkoShell from './components/ui/YenkoShell'
import AuthGateMessage from './components/ui/AuthGateMessage'
import usePageTitle from './hooks/usePageTitle'

// Feature pages are loaded on demand — the landing screen stays lightweight.
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Home = lazy(() => import('./pages/Home'))
const UserLogout = lazy(() => import('./pages/UserLogout'))
const CaptainLogout = lazy(() => import('./pages/CaptainLogout'))
const CaptainHome = lazy(() => import('./pages/CaptainHome'))
const CaptainRiding = lazy(() => import('./pages/CaptainRiding'))
const Riding = lazy(() => import('./pages/Riding'))
const RideHistory = lazy(() => import('./pages/RideHistory'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const SafetyPage = lazy(() => import('./pages/SafetyPage'))
const DriverEarnings = lazy(() => import('./pages/DriverEarnings'))
const ScheduledRide = lazy(() => import('./pages/ScheduledRide'))
const ScheduledRides = lazy(() => import('./pages/ScheduledRides'))
const RiderApp = lazy(() => import('./pages/RiderApp'))
const DriverApp = lazy(() => import('./pages/DriverApp'))
const Referral = lazy(() => import('./pages/Referral'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Chat = lazy(() => import('./pages/Chat'))
const DriverVerification = lazy(() => import('./pages/DriverVerification'))
const Disputes = lazy(() => import('./pages/Disputes'))

/** Applies a YENKO browser title without adding page chrome (auth / ride screens). */
const Titled = ({ title, children }) => {
  usePageTitle(title)
  return <>{children}</>
}

/** Wraps feature pages in the standard YENKO header + footer. */
const Feature = ({ title, children }) => (
  <YenkoShell title={title}>{children}</YenkoShell>
)

const PageLoader = () => (
  <AuthGateMessage title='Loading YENKO…' message='Preparing your ride experience.' />
)

const App = () => {
  return (
    <div>
      <SocketStatus />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path='/' element={<Titled title="Welcome"><Start /></Titled>} />
          <Route path='/onboarding' element={<Onboarding />} />
          <Route path='/login' element={<Navigate to='/onboarding?mode=signin&role=rider' replace />} />
          <Route path='/signup' element={<Navigate to='/onboarding?mode=signup&role=rider' replace />} />
          <Route path='/captain-login' element={<Navigate to='/onboarding?mode=signin&role=captain' replace />} />
          <Route path='/captain-signup' element={<Navigate to='/onboarding?mode=signup&role=captain' replace />} />
          <Route path='/admin-login' element={<Navigate to='/onboarding?mode=signin&role=admin' replace />} />
          <Route path='/admin-signup' element={<Navigate to='/onboarding?mode=signup&role=admin' replace />} />
          <Route path='/rider' element={
            <UserProtectedWrapper>
              <RiderApp />
            </UserProtectedWrapper>
          } />
          <Route path='/home' element={
            <UserProtectedWrapper>
              <Titled title="Book a Ride"><Home /></Titled>
            </UserProtectedWrapper>
          } />
          <Route path='/users/logout' element={
            <UserProtectedWrapper>
              <Titled title="Signing Out"><UserLogout /></Titled>
            </UserProtectedWrapper>
          } />
          <Route path='/driver' element={
            <CaptainProtectedWrapper>
              <DriverApp />
            </CaptainProtectedWrapper>
          } />
          <Route path='/captain-home' element={
            <CaptainProtectedWrapper>
              <Titled title="Captain Home"><CaptainHome /></Titled>
            </CaptainProtectedWrapper>
          } />
          <Route path='/captains/logout' element={
            <CaptainProtectedWrapper>
              <Titled title="Signing Out"><CaptainLogout /></Titled>
            </CaptainProtectedWrapper>
          } />
          <Route path='/captain-riding' element={
            <CaptainProtectedWrapper>
              <Titled title="On a Ride"><CaptainRiding /></Titled>
            </CaptainProtectedWrapper>
          } />
          <Route path='/riding' element={
            <UserProtectedWrapper>
              <Titled title="Your Ride"><Riding /></Titled>
            </UserProtectedWrapper>
          } />
          <Route path='/ride-history' element={
            <UserProtectedWrapper>
              <Feature title="Ride History"><RideHistory /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/admin' element={
            <AdminProtectedWrapper>
              <AdminDashboard />
            </AdminProtectedWrapper>
          } />
          <Route path='/payment' element={
            <UserProtectedWrapper>
              <Feature title="Payments"><PaymentPage /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/safety' element={
            <UserProtectedWrapper>
              <Feature title="Safety"><SafetyPage /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/driver-earnings' element={
            <UserProtectedWrapper>
              <Feature title="Driver Earnings"><DriverEarnings /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/scheduled-rides/book' element={
            <UserProtectedWrapper>
              <Feature title="Schedule a Ride"><ScheduledRide /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/scheduled-rides/my-rides' element={
            <UserProtectedWrapper>
              <ScheduledRides />
            </UserProtectedWrapper>
          } />
          <Route path='/referrals' element={
            <UserProtectedWrapper>
              <Feature title="Refer & Earn"><Referral /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/notifications' element={
            <UserProtectedWrapper>
              <Feature title="Notifications"><Notifications /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/chat/:rideId' element={
            <UserProtectedWrapper>
              <Feature title="Ride Chat"><Chat /></Feature>
            </UserProtectedWrapper>
          } />
          <Route path='/driver-verification' element={
            <CaptainProtectedWrapper>
              <Feature title="Driver Verification"><DriverVerification /></Feature>
            </CaptainProtectedWrapper>
          } />
          <Route path='/disputes' element={
            <UserProtectedWrapper>
              <Feature title="Disputes & Support"><Disputes /></Feature>
            </UserProtectedWrapper>
          } />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App

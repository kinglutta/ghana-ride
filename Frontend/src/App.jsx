import React from 'react'
import Start from './pages/Start'
import { Routes, Route } from 'react-router-dom'
import UserSignup from './pages/UserSignup'
import UserLogin from './pages/UserLogin'
import CaptainLogin from './pages/Captainlogin'
import CaptainSignup from './pages/CaptainSignup'
import Home from './pages/Home'
import UserProtectedWrapper from './pages/UserProtectedWrapper'
import CaptainProtectedWrapper from './pages/CaptainProtectedWrapper'
import UserLogout from './pages/UserLogout'
import CaptainLogout from './pages/CaptainLogout'
import CaptainHome from './pages/CaptainHome'
import CaptainRiding from './pages/CaptainRiding'
import Riding from './pages/Riding'
import RideHistory from './pages/RideHistory'
import AdminDashboard from './pages/AdminDashboard'
import PaymentPage from './pages/PaymentPage'
import SafetyPage from './pages/SafetyPage'
import DriverEarnings from './pages/DriverEarnings'
import ScheduledRide from './pages/ScheduledRide'
import Referral from './pages/Referral'
import Notifications from './pages/Notifications'
import Chat from './pages/Chat'
import DriverVerification from './pages/DriverVerification'
import Disputes from './pages/Disputes'
import SocketStatus from './components/SocketStatus'
import YenkoShell from './components/ui/YenkoShell'
import usePageTitle from './hooks/usePageTitle'

/** Applies a YENKO browser title without adding page chrome (auth / ride screens). */
const Titled = ({ title, children }) => {
  usePageTitle(title)
  return <>{children}</>
}

/** Wraps feature pages in the standard YENKO header + footer. */
const Feature = ({ title, children }) => (
  <YenkoShell title={title}>{children}</YenkoShell>
)

const App = () => {
  return (
    <div>
      <SocketStatus />
      <Routes>
        <Route path='/' element={<Titled title="Welcome"><Start /></Titled>} />
        <Route path='/login' element={<Titled title="Rider Login"><UserLogin /></Titled>} />
        <Route path='/signup' element={<Titled title="Join YENKO"><UserSignup /></Titled>} />
        <Route path='/captain-login' element={<Titled title="Captain Login"><CaptainLogin /></Titled>} />
        <Route path='/captain-signup' element={<Titled title="Become a Captain"><CaptainSignup /></Titled>} />
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
          <UserProtectedWrapper>
            <Feature title="Fleet Dashboard"><AdminDashboard /></Feature>
          </UserProtectedWrapper>
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
            <Feature title="My Scheduled Rides"><RideHistory /></Feature>
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
    </div>
  )
}

export default App

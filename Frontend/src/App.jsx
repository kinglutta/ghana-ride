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
import SocketStatus from './components/SocketStatus'

const App = () => {
  return (
    <div>
      <SocketStatus />
      <Routes>
        <Route path='/' element={<Start />} />
        <Route path='/login' element={<UserLogin />} />
        <Route path='/signup' element={<UserSignup />} />
        <Route path='/captain-login' element={<CaptainLogin />} />
        <Route path='/captain-signup' element={<CaptainSignup />} />
        <Route path='/home' element={
          <UserProtectedWrapper>
            <Home />
          </UserProtectedWrapper>
        } />
        <Route path='/users/logout' element={
          <UserProtectedWrapper>
            <UserLogout />
          </UserProtectedWrapper>
        } />
        <Route path='/captain-home' element={
          <CaptainProtectedWrapper>
            <CaptainHome />
          </CaptainProtectedWrapper>
        } />
        <Route path='/captains/logout' element={
          <CaptainProtectedWrapper>
            <CaptainLogout />
          </CaptainProtectedWrapper>
        } />
        <Route path='/captain-riding' element={
          <CaptainProtectedWrapper>
            <CaptainRiding />
          </CaptainProtectedWrapper>
        } />
        <Route path='/riding' element={
          <UserProtectedWrapper>
            <Riding />
          </UserProtectedWrapper>
        } />
        <Route path='/ride-history' element={
          <UserProtectedWrapper>
            <RideHistory />
          </UserProtectedWrapper>
        } />
        <Route path='/admin' element={
          <UserProtectedWrapper>
            <AdminDashboard />
          </UserProtectedWrapper>
        } />
        <Route path='/payment' element={
          <UserProtectedWrapper>
            <PaymentPage />
          </UserProtectedWrapper>
        } />
        <Route path='/safety' element={
          <UserProtectedWrapper>
            <SafetyPage />
          </UserProtectedWrapper>
        } />
        <Route path='/driver-earnings' element={
          <UserProtectedWrapper>
            <DriverEarnings />
          </UserProtectedWrapper>
        } />
        <Route path='/scheduled-rides/book' element={
          <UserProtectedWrapper>
            <ScheduledRide />
          </UserProtectedWrapper>
        } />
        <Route path='/scheduled-rides/my-rides' element={
          <UserProtectedWrapper>
            <RideHistory />
          </UserProtectedWrapper>
        } />
        <Route path='/referrals' element={
          <UserProtectedWrapper>
            <Referral />
          </UserProtectedWrapper>
        } />
        <Route path='/notifications' element={
          <UserProtectedWrapper>
            <Notifications />
          </UserProtectedWrapper>
        } />
        <Route path='/chat/:rideId' element={
          <UserProtectedWrapper>
            <Chat />
          </UserProtectedWrapper>
        } />
        <Route path='/driver-verification' element={
          <UserProtectedWrapper>
            <DriverVerification />
          </UserProtectedWrapper>
        } />
      </Routes>
    </div>
  )
}

export default App
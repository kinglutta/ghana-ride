import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import Chat from './Chat'
import ShareRideButton from '../components/ShareRideButton'
import { Brand } from '../components/ui/YenkoShell'

const CaptainRiding = () => {

    const [finishRidePanel, setFinishRidePanel] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride



    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [finishRidePanel])


    return (
        <div className='h-screen relative flex flex-col justify-end'>

            <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                <div className='rounded-xl bg-white/95 px-3 py-2 shadow-md backdrop-blur'>
                    <Brand compact />
                </div>
                <div className='flex items-center gap-2'>
                    <ShareRideButton ride={rideData} role='captain' />
                    <button
                        type='button'
                        onClick={() => setChatOpen(true)}
                        title='Chat with your rider'
                        className='flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c400] text-[#111] shadow-md'
                    >
                        💬
                    </button>
                    <Link to='/captain-home' title='Back to Captain home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md'>
                        <i className="text-lg font-medium ri-home-5-line"></i>
                    </Link>
                </div>
            </div>

            <div className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0' onClick={() => {

                }}><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <h4 className='text-xl font-semibold'>{'4 KM away'}</h4>
                <button className=' bg-green-600 text-white font-semibold p-3 px-10 rounded-lg'>Complete Ride</button>
            </div>
            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

            <div className='h-screen fixed w-screen top-0 z-[-1]'>
                <LiveTracking
                    ride={rideData}
                    showCaptain={false}
                    showRoute={true}
                    showSos={false}
                />
            </div>

            {chatOpen && (
                <Chat ride={rideData} viewerRole='captain' onClose={() => setChatOpen(false)} />
            )}
        </div>
    )
}

export default CaptainRiding
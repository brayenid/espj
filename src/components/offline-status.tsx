/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [show, setShow] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const goOnline = () => {
      setIsOnline(true)
      setShow(true)
      setTimeout(() => setShow(false), 3000)
    }
    const goOffline = () => {
      setIsOnline(false)
      setShow(true)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!show && isOnline) return null

  return (
    <div
      className={`fixed bottom-4 left-4 z-9999 flex items-center gap-3 rounded-lg px-4 py-3 shadow-2xl transition-all duration-500 ${
        isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
      }`}>
      {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-widest">
          {isOnline ? 'Terhubung Kembali' : 'Mode Offline'}
        </span>
      </div>
    </div>
  )
}

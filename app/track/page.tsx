'use client'
import { useState } from 'react'
import { Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react'
import { CONFIG } from '@/lib/config'

const COURIERS = [
  { name: 'DTDC', url: (awb: string) => `https://www.dtdc.in/tracking.asp?awbno=${awb}` },
  { name: 'BlueDart', url: (awb: string) => `https://www.bluedart.com/tracking?trackfor=${awb}` },
  { name: 'Delhivery', url: (awb: string) => `https://www.delhivery.com/track/package/${awb}` },
  { name: 'India Post', url: (_: string) => `https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx` },
  { name: 'Ekart', url: (awb: string) => `https://ekartlogistics.com/shipmenttrack/${awb}` },
]

const STEPS = [
  { label: 'Order Placed', icon: Package },
  { label: 'Picked Up', icon: Clock },
  { label: 'In Transit', icon: Truck },
  { label: 'Out for Delivery', icon: MapPin },
  { label: 'Delivered', icon: CheckCircle },
]

export default function TrackPage() {
  const [tab, setTab] = useState<'awb' | 'order'>('awb')
  const [awb, setAwb] = useState('')
  const [courier, setCourier] = useState('DTDC')
  const [orderId, setOrderId] = useState('')

  const handleTrack = () => {
    if (!awb) return alert('Enter AWB number')
    const c = COURIERS.find(c => c.name === courier)
    if (c) window.open(c.url(awb), '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-3xl mb-8">Track Your Order</h1>

      {/* Step Tracker Visual */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
        <h2 className="font-display font-700 mb-6 text-lg">Order Journey</h2>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex flex-col items-center gap-2 z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-center text-gray-500 max-w-12">{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {[['awb', 'Track by AWB'], ['order', 'Track by Order ID']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'awb' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block">Select Courier</label>
            <select value={courier} onChange={e => setCourier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500">
              {COURIERS.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block">AWB Number</label>
            <input value={awb} onChange={e => setAwb(e.target.value)}
              placeholder="Enter your AWB / tracking number"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
          </div>
          <button onClick={handleTrack} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors mb-3">
            Track Shipment
          </button>
          <a href={`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I need help tracking my shipment. AWB: ${awb}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors text-sm">
            💬 Need Help? WhatsApp Us
          </a>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <input value={orderId} onChange={e => setOrderId(e.target.value)}
            placeholder="Enter your Order ID (e.g. ORD4821)"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 mb-4" />
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-400">
            📱 Your AWB tracking number will be sent to you on <strong>WhatsApp</strong> after payment is confirmed. Once you receive it, you can track your shipment using the AWB tab above.
          </div>
        </div>
      )}
    </div>
  )
}
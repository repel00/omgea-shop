'use client'
import { useState } from 'react'
import { User, Gift, ShoppingBag } from 'lucide-react'

export default function AccountPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={36} className="text-orange-500" />
        </div>
        <h1 className="font-display font-700 text-3xl">My Account</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {[['login', 'Login'], ['signup', 'Sign Up']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`flex-1 py-3 font-semibold text-sm transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'signup' && (
            <input placeholder="Full Name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
          )}
          <input placeholder="Email" type="email" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
          <input placeholder="Password" type="password" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors">
            {tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift size={24} />
          <h3 className="font-display font-700 text-lg">Loyalty Points</h3>
        </div>
        <p className="text-sm opacity-90 mb-1">Earn 1 point for every ₹10 spent</p>
        <p className="font-display font-700 text-3xl">0 <span className="text-base font-normal opacity-80">points</span></p>
      </div>
    </div>
  )
}
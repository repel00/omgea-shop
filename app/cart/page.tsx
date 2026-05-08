'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Trash2, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '../providers'
import { CONFIG } from '@/lib/config'

export default function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [usedCoupons] = useState<string[]>([])

  const gst = cartTotal * CONFIG.GST_RATE
  const discount = appliedCoupon
    ? appliedCoupon.type === 'flat' ? appliedCoupon.value
    : Math.round(cartTotal * appliedCoupon.value / 100)
    : 0
  const total = Math.max(1, cartTotal + gst - discount)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    if (usedCoupons.includes(couponCode.toUpperCase())) {
      setCouponMsg('🔒 Already Used'); return
    }
    if (appliedCoupon) { setCouponMsg('Remove current coupon first'); return }
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single()
    if (!data) { setCouponMsg('❌ Invalid coupon code'); return }
    if (new Date(data.expiry_date) < new Date()) { setCouponMsg('⏳ Coupon expired'); return }
    if (cartTotal < data.min_order) { setCouponMsg(`🛒 Add ₹${(data.min_order - cartTotal).toLocaleString()} more to use this coupon`); return }
    setAppliedCoupon(data)
    setCouponMsg('✅ Coupon applied!')
  }

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponMsg('') }

  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart size={64} className="mx-auto mb-4 opacity-20" />
      <h2 className="font-display font-700 text-2xl mb-3">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Add some products to get started</p>
      <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
        Continue Shopping
      </Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-3xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex gap-4">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
              <div className="flex-1">
                <h3 className="font-display font-600">{item.name}</h3>
                {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                {item.custom_text && <p className="text-sm text-gray-500">Text: {item.custom_text}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-orange-500">-</button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-orange-500">+</button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <p className="font-display font-700 text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm justify-end">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 h-fit sticky top-20">
          <h2 className="font-display font-700 text-xl mb-5">Order Summary</h2>

          {/* Coupon */}
          <div className="mb-5">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code" disabled={!!appliedCoupon}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
              </div>
              {appliedCoupon
                ? <button onClick={removeCoupon} className="text-xs text-red-500 font-semibold px-3 border border-red-300 rounded-xl">Remove</button>
                : <button onClick={applyCoupon} className="bg-orange-500 text-white px-4 rounded-xl text-sm font-semibold hover:bg-orange-600">Apply</button>
              }
            </div>
            {couponMsg && <p className="text-xs mt-1">{couponMsg}</p>}
          </div>

          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span>₹{Math.round(gst).toLocaleString()}</span></div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between font-display font-700 text-lg">
              <span>Total</span><span>₹{Math.round(total).toLocaleString()}</span>
            </div>
          </div>

          <Link href="/checkout" className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-xl font-semibold transition-colors">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="block w-full text-center text-gray-500 hover:text-orange-500 mt-3 text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
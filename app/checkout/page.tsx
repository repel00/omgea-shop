'use client'
import { useState } from 'react'
import { CheckCircle, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '../layout'
import { CONFIG } from '@/lib/config'

export default function CheckoutPage() {
  const { cart = [], cartTotal, clearCart } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' })
  const [orderId] = useState('ORD' + Math.floor(1000 + Math.random() * 9000))
  const [submitted, setSubmitted] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const gst = cartTotal * CONFIG.GST_RATE
  const total = Math.round(cartTotal + gst - discount)
  const itemsText = cart.map(i => `${i.name}${i.size ? ` (Size: ${i.size})` : ''}${i.color ? ` (Color: ${i.color})` : ''} x${i.quantity}`).join(', ')

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    if (appliedCoupon) return setCouponMsg('Remove current coupon first')
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single()
    if (!data) return setCouponMsg('❌ Invalid coupon code')
    if (new Date(data.expiry_date) < new Date()) return setCouponMsg('⏳ Coupon expired')
    if (cartTotal < data.min_order) return setCouponMsg(`🛒 Min order ₹${data.min_order} required`)
    const d = data.type === 'flat' ? data.value : Math.round(cartTotal * data.value / 100)
    setDiscount(d)
    setAppliedCoupon(data)
    setCouponMsg(`✅ Saved ₹${d}!`)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    setCouponCode('')
    setCouponMsg('')
  }

  const handleOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.pincode)
      return alert('Please fill all fields')

    await supabase.from('orders').insert({
      order_id: orderId, customer_name: form.name, phone: form.phone,
      address: form.address, city: form.city, state: form.state, pincode: form.pincode,
      items: cart, subtotal: cartTotal, discount, gst: Math.round(gst), total, status: 'Pending',
      coupon_code: appliedCoupon?.code || null
    })

    const msg = encodeURIComponent(
      `Hi! I want to place an order:\n🆔 Order ID: ${orderId}\n🛒 Items: ${itemsText}\n💰 Total: ₹${total}\n📦 Address: ${form.address}, ${form.city}, ${form.pincode}\n📞 Phone: ${form.phone}`
    )
    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`, '_blank')
    clearCart()
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
      <h2 className="font-display font-700 text-2xl mb-3">Order Sent! 🎉</h2>
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 mb-4">
        <p className="font-display font-700 text-xl text-orange-500">{orderId}</p>
        <p className="text-sm text-gray-500 mt-1">Save this Order ID</p>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">We'll send your AWB tracking number on WhatsApp after payment confirmation.</p>
    </div>
  )

  if (cart.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-xl font-display font-700 mb-4">Your cart is empty!</p>
      <a href="/products" className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold">Shop Now</a>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-3xl mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">

        {/* Delivery Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-display font-700 text-xl mb-5">Delivery Details</h2>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 mb-5">
            <p className="text-sm text-gray-500">Your Order ID</p>
            <p className="font-display font-700 text-2xl text-orange-500">{orderId}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['name','Full Name','text','col-span-2'],
              ['phone','Phone Number','tel','col-span-2'],
              ['address','Address','text','col-span-2'],
              ['city','City','text','col-span-1'],
              ['state','State','text','col-span-1'],
              ['pincode','Pincode','text','col-span-1']
            ].map(([field, label, type, span]) => (
              <input key={field as string} type={type as string} placeholder={label as string}
                value={(form as any)[field as string]}
                onChange={e => setForm(p => ({ ...p, [field as string]: e.target.value }))}
                className={`${span} px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm`} />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 h-fit">
          <h2 className="font-display font-700 text-xl mb-5">Order Summary</h2>

          {/* Items */}
          <div className="space-y-3 mb-5">
            {cart.map((item, i) => (
              <div key={i} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{item.name}</p>
                  {item.size && <p className="text-gray-500">Size: {item.size}</p>}
                  {item.color && <p className="text-gray-500">Color: {item.color}</p>}
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mb-5">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  disabled={!!appliedCoupon}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
              </div>
              {appliedCoupon
                ? <button onClick={removeCoupon} className="text-xs text-red-500 font-semibold px-3 border border-red-300 rounded-xl">Remove</button>
                : <button onClick={applyCoupon} className="bg-orange-500 text-white px-4 rounded-xl text-sm font-semibold hover:bg-orange-600">Apply</button>
              }
            </div>
            {couponMsg && <p className="text-xs mt-1">{couponMsg}</p>}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Discount</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">GST (18%)</span>
              <span>₹{Math.round(gst).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-display font-700 text-lg pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={handleOrder}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            💬 Pay via WhatsApp
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            You'll be redirected to WhatsApp to complete your order
          </p>
        </div>
      </div>
    </div>
  )
}
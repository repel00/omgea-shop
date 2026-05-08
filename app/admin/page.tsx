'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { LogOut, Plus, Trash2, Eye, EyeOff, Upload, X, Package, ShoppingBag, Tag, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const supabase = createClient(
  "https://olgiiqkywisxspxqwsrs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZ2lpcWt5d2lzeHNweHF3c3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA0OTUsImV4cCI6MjA5MjUyNjQ5NX0.ZB6TFYyM1GS9ryWYtuNQr52szKtbIvifBqkGnr0NTf4"
)

async function uploadToR2(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const filename = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      contentType: file.type,
      data: Array.from(new Uint8Array(arrayBuffer))
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Upload failed')
  }
  const result = await res.json()
  return result.url
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('upload')
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', price: '', discount_price: '', category: 'Fashion',
    stock: '', description: '', colors: '', sizes: '', allow_custom_text: false,
  })

  const [newCoupon, setNewCoupon] = useState({
    code: '', type: 'flat', value: '', min_order: '', expiry_date: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/admin/login')
      else setUser(user)
    })
    loadAll()
  }, [])

  const loadAll = async () => {
    const [p, o, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('coupons').select('*')
    ])
    if (p.data) setProducts(p.data)
    if (o.data) setOrders(o.data)
    if (c.data) setCoupons(c.data)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const newUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`)
      try {
        const url = await uploadToR2(files[i])
        newUrls.push(url)
      } catch (e: any) {
        alert(`Failed to upload image ${i + 1}: ${e.message}`)
      }
    }
    setUploadedImages(prev => [...prev, ...newUrls])
    setUploading(false)
    setUploadProgress('')
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleImageSelect(e.dataTransfer.files)
  }

  const saveProduct = async () => {
    if (!form.name || !form.price || uploadedImages.length === 0) {
      alert('Please fill product name, price and upload at least 1 image!')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      category: form.category,
      stock: Number(form.stock) || 0,
      description: form.description,
      images: uploadedImages,
      colors: form.colors ? form.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      sizes: form.sizes ? form.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      allow_custom_text: form.allow_custom_text,
      is_active: true,
    })
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Product added!')
      setForm({ name: '', price: '', discount_price: '', category: 'Fashion', stock: '', description: '', colors: '', sizes: '', allow_custom_text: false })
      setUploadedImages([])
      loadAll()
    }
    setSaving(false)
  }

  const deleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      await supabase.from('products').delete().eq('id', id)
      loadAll()
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('products').update({ is_active: !active }).eq('id', id)
    loadAll()
  }

  const addCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value || !newCoupon.expiry_date) return alert('Fill all fields')
    await supabase.from('coupons').insert({
      ...newCoupon, value: Number(newCoupon.value),
      min_order: Number(newCoupon.min_order) || 0, is_active: true
    })
    setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', expiry_date: '' })
    loadAll()
  }

  const deleteCoupon = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id)
    loadAll()
  }

  const salesData = orders.reduce((acc: any[], o) => {
    const date = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const existing = acc.find((a: any) => a.date === date)
    if (existing) existing.sales += o.total
    else acc.push({ date, sales: o.total })
    return acc
  }, []).slice(-7)

  const TABS = [
    ['upload', '➕ Add Product'],
    ['products', '📦 Products'],
    ['orders', '🛒 Orders'],
    ['coupons', '🎟️ Coupons'],
    ['analytics', '📊 Analytics'],
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-display font-700 text-xl">🏪 Omgea Admin</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">{user?.email}</span>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['📦 Products', products.length, 'text-blue-500'],
          ['🛒 Orders', orders.length, 'text-green-500'],
          ['💰 Revenue', `₹${orders.reduce((a, o) => a + (o.total || 0), 0).toLocaleString()}`, 'text-orange-500'],
          ['🎟️ Coupons', coupons.filter(c => c.is_active).length, 'text-purple-500'],
        ].map(([label, val, color]) => (
          <div key={label as string} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`font-display font-700 text-2xl ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ADD PRODUCT TAB */}
        {tab === 'upload' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-display font-700 text-2xl mb-6">➕ Add New Product</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">
                📸 Product Images <span className="text-red-500">*</span>
                <span className="text-green-500 font-normal ml-2">(☁️ Cloudflare R2 — 10GB free)</span>
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors mb-4">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleImageSelect(e.target.files)} />
                {uploading ? (
                  <div>
                    <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-orange-500 font-semibold">{uploadProgress}</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto mb-3 text-orange-400" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Click or drag images here</p>
                    <p className="text-sm text-gray-400 mt-1">Upload multiple images • JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                      <button onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-md">Main</span>}
                    </div>
                  ))}
                  <div onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400">
                    <Plus size={24} className="text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Product Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. G-Shock MTG Watch"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Original Price ₹ <span className="text-red-500">*</span></label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="999"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Selling Price ₹ <span className="text-orange-500">(discount)</span></label>
                <input type="number" value={form.discount_price} onChange={e => setForm(p => ({ ...p, discount_price: e.target.value }))}
                  placeholder="799"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none text-sm">
                  {['Fashion', 'Electronics', 'Home', 'Toys'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Stock Quantity</label>
                <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  placeholder="50"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Colors <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input value={form.colors} onChange={e => setForm(p => ({ ...p, colors: e.target.value }))}
                  placeholder="Red, Blue, Black, Gold"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sizes <span className="text-gray-400 font-normal">(leave empty if no sizes)</span></label>
                <input value={form.sizes} onChange={e => setForm(p => ({ ...p, sizes: e.target.value }))}
                  placeholder="S, M, L, XL (or leave empty)"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Write a short description..." rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, allow_custom_text: !p.allow_custom_text }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.allow_custom_text ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allow_custom_text ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm font-semibold">Allow Custom Text</span>
                </label>
              </div>
            </div>

            <button onClick={saveProduct} disabled={saving || uploading}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-4 rounded-2xl font-display font-700 text-lg transition-colors flex items-center justify-center gap-2">
              {saving
                ? <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                : <><Plus size={20} /> Add Product to Store</>}
            </button>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>{['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0]} alt="" className="w-12 h-12 object-cover rounded-xl" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">₹{(p.discount_price ?? p.price).toLocaleString()}</span>
                        {p.discount_price && <span className="text-xs text-gray-400 line-through ml-1">₹{p.price}</span>}
                      </td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {p.is_active ? '✅ Active' : '🔴 Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleActive(p.id, p.is_active)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            {p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <div className="text-center py-12 text-gray-400">No products yet</div>}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>{['Order ID', 'Customer', 'Phone', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono font-semibold text-orange-500">{o.order_id}</td>
                      <td className="px-4 py-3">{o.customer_name}</td>
                      <td className="px-4 py-3">{o.phone}</td>
                      <td className="px-4 py-3 font-semibold">₹{o.total?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className="text-center py-12 text-gray-400">No orders yet</div>}
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {tab === 'coupons' && (
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-6">
              <h2 className="font-display font-700 text-lg mb-4">Add New Coupon</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input placeholder="Code" value={newCoupon.code}
                  onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
                <select value={newCoupon.type} onChange={e => setNewCoupon(p => ({ ...p, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none">
                  <option value="flat">Flat ₹</option>
                  <option value="percentage">Percentage %</option>
                </select>
                <input placeholder="Value" type="number" value={newCoupon.value}
                  onChange={e => setNewCoupon(p => ({ ...p, value: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
                <input placeholder="Min Order ₹" type="number" value={newCoupon.min_order}
                  onChange={e => setNewCoupon(p => ({ ...p, min_order: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
                <input type="date" value={newCoupon.expiry_date}
                  onChange={e => setNewCoupon(p => ({ ...p, expiry_date: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500" />
              </div>
              <button onClick={addCoupon} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold text-sm">
                Add Coupon
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>{['Code', 'Type', 'Value', 'Min Order', 'Expiry', 'Status', 'Delete'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                      <td className="px-4 py-3">{c.type}</td>
                      <td className="px-4 py-3">{c.type === 'flat' ? `₹${c.value}` : `${c.value}%`}</td>
                      <td className="px-4 py-3">₹{c.min_order}</td>
                      <td className="px-4 py-3">{c.expiry_date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteCoupon(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="font-display font-700 text-xl mb-6">📊 Sales Last 7 Days</h2>
            {salesData.length === 0
              ? <div className="text-center py-12 text-gray-400">No orders yet</div>
              : <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [`₹${v}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import './globals.css'
import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, User, Menu, X, Moon, Sun } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import Chatbot from './components/Chatbot'  // 👈 ADDED

type CartItem = {
  id: string; name: string; price: number; quantity: number;
  image: string; color?: string; size?: string; custom_text?: string;
}
type CartContextType = {
  cart: CartItem[]; addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void; updateQty: (id: string, qty: number) => void;
  clearCart: () => void; cartCount: number; cartTotal: number;
}
export const CartContext = createContext<CartContextType>({} as CartContextType)
export const useCart = () => useContext(CartContext)

type WishlistContextType = { wishlist: string[]; toggleWishlist: (id: string) => void }
export const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType)
export const useWishlist = () => useContext(WishlistContext)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const c = localStorage.getItem('cart'); if (c) setCart(JSON.parse(c))
    const w = localStorage.getItem('wishlist'); if (w) setWishlist(JSON.parse(w))
    const d = localStorage.getItem('dark'); if (d === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  const saveCart = (c: CartItem[]) => { setCart(c); localStorage.setItem('cart', JSON.stringify(c)) }
  const saveWishlist = (w: string[]) => { setWishlist(w); localStorage.setItem('wishlist', JSON.stringify(w)) }

  const addToCart = (item: CartItem) => {
    const existing = cart.find(c => c.id === item.id && c.color === item.color && c.size === item.size)
    if (existing) {
      saveCart(cart.map(c => c.id === item.id && c.color === item.color && c.size === item.size ? { ...c, quantity: c.quantity + item.quantity } : c))
    } else {
      saveCart([...cart, item])
    }
  }
  const removeFromCart = (id: string) => saveCart(cart.filter(c => c.id !== id))
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id)
    saveCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c))
  }
  const clearCart = () => saveCart([])
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0)
  const cartTotal = cart.reduce((a, c) => a + c.price * c.quantity, 0)
  const toggleWishlist = (id: string) => {
    const w = wishlist.includes(id) ? wishlist.filter(i => i !== id) : [...wishlist, id]
    saveWishlist(w)
  }
  const toggleDark = () => {
    const d = !dark; setDark(d)
    localStorage.setItem('dark', String(d))
    document.documentElement.classList.toggle('dark', d)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{CONFIG.STORE_NAME}</title>
        <meta name="description" content={CONFIG.STORE_TAGLINE} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors font-body">
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }}>
          <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>

            <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-100 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-display font-800 text-2xl tracking-tight">{CONFIG.STORE_NAME}</Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                  <Link href="/products" className="hover:text-orange-500 transition-colors">Products</Link>
                  <Link href="/track" className="hover:text-orange-500 transition-colors">Track Order</Link>
                  <Link href="/contact" className="hover:text-orange-500 transition-colors">Contact</Link>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={toggleDark} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    {dark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <Link href="/wishlist" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative">
                    <Heart size={18} />
                    {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>}
                  </Link>
                  <button onClick={() => setDrawerOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative">
                    <ShoppingCart size={18} />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                  </button>
                  <Link href="/account" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full hidden md:block">
                    <User size={18} />
                  </Link>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </div>
              </div>
              {menuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-4 py-4 flex flex-col gap-4 text-sm">
                  <Link href="/products" onClick={() => setMenuOpen(false)}>Products</Link>
                  <Link href="/track" onClick={() => setMenuOpen(false)}>Track Order</Link>
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
                  <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
                </div>
              )}
            </nav>

            {drawerOpen && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
                <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="font-display font-700 text-lg">Cart ({cartCount})</h2>
                    <button onClick={() => setDrawerOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : cart.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                          {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 border rounded flex items-center justify-center text-sm">-</button>
                            <span className="text-sm">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 border rounded flex items-center justify-center text-sm">+</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 mt-1">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="p-4 border-t dark:border-gray-700">
                      <div className="flex justify-between mb-3 font-semibold">
                        <span>Total</span><span>₹{cartTotal.toLocaleString()}</span>
                      </div>
                      <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-xl font-semibold transition-colors">
                        Proceed to Checkout
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <main>{children}</main>
            <Chatbot />  {/* 👈 ADDED - right after main */}

            <footer className="bg-gray-950 text-gray-400 pt-12 pb-6 mt-16">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h3 className="text-white font-display font-700 text-lg mb-3">{CONFIG.STORE_NAME}</h3>
                  <p className="text-sm">{CONFIG.STORE_TAGLINE}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
                  <div className="space-y-2 text-sm">
                    <Link href="/products" className="block hover:text-white">Products</Link>
                    <Link href="/track" className="block hover:text-white">Track Order</Link>
                    <Link href="/wishlist" className="block hover:text-white">Wishlist</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">Help</h4>
                  <div className="space-y-2 text-sm">
                    <Link href="/contact" className="block hover:text-white">Contact Us</Link>
                    <Link href="/account" className="block hover:text-white">My Account</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">Connect</h4>
                  <a href={`https://wa.me/${CONFIG.WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="block text-sm hover:text-green-400 mb-2">📞 WhatsApp Us</a>
                  <a href={CONFIG.WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="block text-sm hover:text-green-400">💬 Join Group</a>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-4 border-t border-gray-800 pt-6 text-center text-sm">
                © {new Date().getFullYear()} {CONFIG.STORE_NAME}. All rights reserved.
              </div>
            </footer>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-white dark:bg-gray-900 shadow-2xl rounded-full px-4 py-2 border border-gray-100 dark:border-gray-700">
              <a href={`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_HELP_TEXT)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-green-500">📞 Need Help</a>
              <span className="text-gray-300">|</span>
              <a href={CONFIG.WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-green-500">💬 Join Group</a>
            </div>

          </WishlistContext.Provider>
        </CartContext.Provider>
      </body>
    </html>
  )
}
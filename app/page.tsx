'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Star, ChevronRight } from 'lucide-react'
import { supabase, Product } from '@/lib/supabase'
import { useCart } from './layout'

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 30, s: 0 })
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s--; if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) return { h: 5, m: 59, s: 59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex gap-2 text-white">
      {[['H', time.h], ['M', time.m], ['S', time.s]].map(([label, val]) => (
        <div key={label as string} className="text-center">
          <div className="bg-white/20 rounded-lg px-3 py-1 font-display font-700 text-2xl">{pad(val as number)}</div>
          <div className="text-xs mt-1 uppercase tracking-wide opacity-70">{label}</div>
        </div>
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const savings = product.discount_price ? product.price - product.discount_price : 0
  const displayPrice = product.discount_price ?? product.price
  const rating = 4 + Math.random() * 0.9

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img src={product.images[0] || 'https://picsum.photos/400/400'} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {savings > 0 && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Save ₹{savings}
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Only {product.stock} left!
          </span>
        )}
      </Link>
      <div className="p-4">
        <span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">{product.category}</span>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-display font-600 mt-1 mb-2 line-clamp-2 hover:text-orange-500 transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={12} className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
          ))}
          <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
        </div>
        <div className="mb-3">
          <span className="font-display font-700 text-lg">₹{displayPrice.toLocaleString()}</span>
          {product.discount_price && (
            <span className="text-sm text-gray-400 line-through ml-2">₹{product.price.toLocaleString()}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}`} className="flex-1 text-center border border-gray-200 dark:border-gray-700 text-sm py-2 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-colors">
            View
          </Link>
          <button onClick={() => addToCart({ id: product.id, name: product.name, price: displayPrice, quantity: 1, image: product.images[0] || '' })}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-xl transition-colors font-semibold">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = [
  { name: 'Electronics', image: 'https://i.ibb.co/C5ssBMVh/ele.webp' },
  { name: 'Fashion', image: 'https://i.ibb.co/hRD5655L/fac.webp' },
  { name: 'Home', image: 'https://i.ibb.co/QFdZ4GJp/hom.webp' },
  { name: 'Toys', image: 'https://i.ibb.co/MkwNYPQg/toy.webp' },
]

function InstaBanner({ handle, name, followers, posts, following, bio, link, profileImg, gradient }: {
  handle: string, name: string, followers: string, posts: string, following: string,
  bio: string[], link: string, profileImg: string, gradient: string
}) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block h-full">
      <div className={`${gradient} rounded-3xl min-h-[200px] h-full overflow-hidden relative`}>
        {/* Dark overlay like Instagram dark mode */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 p-6">
          {/* Top row — handle + icons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xl">{handle}</span>
              <span className="text-white/60 text-sm">✓</span>
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex gap-3 text-white/70 text-lg">
              <span>⊕</span>
              <span>☰</span>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex items-start gap-5 mb-4">
            {/* Profile picture */}
            <div className="relative flex-shrink-0">
              <img src={profileImg} alt={handle}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">+</span>
              </div>
              <p className="text-white/50 text-xs text-center mt-1 truncate w-20">{handle}</p>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <p className="text-white font-semibold text-base mb-3">{name}</p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-lg leading-tight">{posts}</p>
                  <p className="text-white/60 text-xs">posts</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg leading-tight">{followers}</p>
                  <p className="text-white/60 text-xs">followers</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg leading-tight">{following}</p>
                  <p className="text-white/60 text-xs">following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            {bio.map((line, i) => (
              <p key={i} className="text-white/80 text-sm">{line}</p>
            ))}
          </div>

          {/* Follow button */}
          <div className="flex gap-2">
            <div className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg text-center transition-colors">
              Follow
            </div>
            <div className="flex-1 bg-white/20 text-white text-sm font-semibold py-2 rounded-lg text-center">
              Message
            </div>
            <div className="bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-lg">
              ▾
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setProducts(data); setLoading(false) })
  }, [])

  // 🚀 Updated: Banner rotation speed increased from 4000ms to 2000ms
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % 3)
    }, 2000)   // 👈 Changed from 4000 to 2000 for faster rotation
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fb923c 0%, transparent 40%)'}} />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <span className="inline-block bg-orange-500/20 text-orange-400 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-orange-500/30">
              🔥 Flash Sale — Up to 50% OFF
            </span>
            <h1 className="font-display font-800 text-5xl md:text-7xl text-white leading-tight mb-6">
              Shop Smart.<br /><span className="text-orange-400">Live Better.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Premium products at unbeatable prices. Order on WhatsApp, delivered to your door.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 flex items-center gap-2">
                Shop Now <ArrowRight size={20} />
              </Link>
              <Link href="/track" className="border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-display font-700 text-3xl mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.name} href={`/products?category=${cat.name}`}
              className="relative rounded-2xl overflow-hidden aspect-square hover:scale-105 transition-transform cursor-pointer group">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-white font-display font-700 text-xl drop-shadow-lg">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ROTATING BANNER */}
      <section className="mx-4 mb-16">
        <div className="relative overflow-hidden rounded-3xl" style={{minHeight: '220px'}}>

          {/* Slide 0 — Flash Sale */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${slideIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 min-h-[220px] h-full flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={28} className="fill-white" />
                  <span className="font-display font-800 text-3xl">Flash Sale!</span>
                </div>
                <p className="opacity-90">Hurry up! Deals expire soon</p>
              </div>
              <CountdownTimer />
              <Link href="/products" className="bg-white text-orange-500 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-2">
                Grab Deals <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Slide 1 — omgea_shop */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${slideIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <InstaBanner
              handle="omgea_shop"
              name="omgea shop"
              followers="25.8K"
              posts="398"
              following="2"
              bio={['Product/service', 'Since 2020', 'Dm for orders 😊', 'Pan IND delivery']}
              link="https://www.instagram.com/omgea_shop?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              profileImg="https://i.ibb.co/q3TX4Wy4/image.png"
              gradient="bg-gradient-to-br from-purple-900 to-pink-900"
            />
          </div>

          {/* Slide 2 — omgea_store */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${slideIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <InstaBanner
              handle="omgea_store"
              name="omgea 2.0"
              followers="21.3K"
              posts="167"
              following="2"
              bio={['omgea 2.0', 'New arrivals every week!']}
              link="https://www.instagram.com/omgea_store?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              profileImg="https://i.ibb.co/hFHkvXpY/image.png"
              gradient="bg-gradient-to-br from-pink-900 to-rose-900"
            />
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {[0,1,2].map(i => (
              <button key={i} onClick={() => setSlideIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === slideIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display font-700 text-3xl">Trending Now 🔥</h2>
          <Link href="/products" className="text-orange-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* NEW ARRIVALS */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display font-700 text-3xl mb-8">New Arrivals ✨</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {products.slice(0, 6).map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                <img src={p.images[0]} alt={p.name} className="w-full h-48 object-cover" />
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                  <p className="text-orange-500 font-bold text-sm mt-1">₹{(p.discount_price ?? p.price).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
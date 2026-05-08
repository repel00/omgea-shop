'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { supabase, Product } from '@/lib/supabase'
import { useWishlist, useCart } from '../providers'

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (wishlist.length === 0) { setProducts([]); return }
    supabase.from('products').select('*').in('id', wishlist)
      .then(({ data }) => { if (data) setProducts(data) })
  }, [wishlist])

  if (wishlist.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Heart size={64} className="mx-auto mb-4 opacity-20" />
      <h2 className="font-display font-700 text-2xl mb-3">Your wishlist is empty</h2>
      <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
        Browse Products
      </Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-3xl mb-8">My Wishlist ({wishlist.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="relative aspect-square">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              <button onClick={() => toggleWishlist(p.id)} className="absolute top-3 right-3 bg-white/80 p-2 rounded-full">
                <Heart size={16} className="fill-red-500 text-red-500" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-display font-600 text-sm mb-1 line-clamp-2">{p.name}</h3>
              <p className="text-orange-500 font-bold mb-3">₹{(p.discount_price ?? p.price).toLocaleString()}</p>
              <div className="flex gap-2">
                <Link href={`/products/${p.id}`} className="flex-1 text-center border border-gray-200 dark:border-gray-700 text-xs py-2 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-colors">
                  View
                </Link>
                <button onClick={() => addToCart({ id: p.id, name: p.name, price: p.discount_price ?? p.price, quantity: 1, image: p.images[0] })}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                  <ShoppingCart size={12} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
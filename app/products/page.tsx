'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Star, Heart } from 'lucide-react'
import { supabase, Product } from '@/lib/supabase'
import { useCart, useWishlist } from '../layout'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(10000)
  const [inStock, setInStock] = useState(false)
  const { addToCart } = useCart()
  const { wishlist = [], toggleWishlist } = useWishlist()

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true)
      .then(({ data }) => { if (data) { setProducts(data); setFiltered(data) } setLoading(false) })
  }, [])

  useEffect(() => {
    let result = [...products]
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (category) result = result.filter(p => p.category === category)
    if (inStock) result = result.filter(p => p.stock > 0)
    result = result.filter(p => (p.discount_price ?? p.price) <= maxPrice)
    if (sort === 'price_asc') result.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price))
    else if (sort === 'price_desc') result.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price))
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setFiltered(result)
  }, [search, category, sort, maxPrice, inStock, products])

  const categories = ['', 'Electronics', 'Fashion', 'Toys', 'Sports']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-3xl mb-6">All Products</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:border-orange-500" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 sticky top-20">
            <h3 className="font-display font-700 mb-4">Filters</h3>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-3">Category</p>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${category === c ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {c || 'All Categories'}
                </button>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-3">Max Price: ₹{maxPrice.toLocaleString()}</p>
              <input type="range" min={100} max={10000} step={100} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-orange-500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="accent-orange-500" />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-square animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-xl font-display font-700">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => {
                const price = p.discount_price ?? p.price
                const rating = 4 + Math.random() * 0.9
                return (
                  <div key={p.id} className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="relative overflow-hidden aspect-square">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <button onClick={() => toggleWishlist(p.id)}
                        className="absolute top-3 right-3 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white transition-colors">
                        <Heart size={16} className={wishlist.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                      </button>
                      {p.discount_price && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          Save ₹{p.price - p.discount_price}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-orange-500 font-semibold">{p.category}</span>
                      <h3 className="font-display font-600 mt-1 mb-2 text-sm line-clamp-2">{p.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-700 font-display">₹{price.toLocaleString()}</span>
                          {p.discount_price && <span className="text-xs text-gray-400 line-through ml-1">₹{p.price.toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/products/${p.id}`} className="flex-1 text-center border border-gray-200 dark:border-gray-700 text-xs py-2 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-colors">
                          View
                        </Link>
                        <button onClick={() => addToCart({ id: p.id, name: p.name, price, quantity: 1, image: p.images[0] })}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 rounded-xl transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
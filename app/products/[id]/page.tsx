'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Heart, ShoppingCart, ChevronLeft } from 'lucide-react'
import { supabase, Product, Review } from '@/lib/supabase'
import { useCart, useWishlist } from '../../layout'

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [customText, setCustomText] = useState('')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' })
  const { addToCart } = useCart()
  const { wishlist = [], toggleWishlist } = useWishlist()

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setProduct(data)
          setSelectedColor(data.colors[0] || '')
          setSelectedSize(data.sizes[0] || '')
          supabase.from('products').select('*').eq('category', data.category).neq('id', id).limit(4)
            .then(({ data: rel }) => { if (rel) setRelated(rel) })
        }
      })
    supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id, name: product.name,
      price: product.discount_price ?? product.price,
      quantity: qty, image: product.images[0],
      color: selectedColor, size: selectedSize, custom_text: customText
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push('/checkout')
  }

  const submitReview = async () => {
    if (!reviewForm.name || !reviewForm.comment) return alert('Please fill all fields')
    await supabase.from('reviews').insert({ product_id: id, ...reviewForm })
    setReviews(prev => [{ id: Date.now().toString(), product_id: id as string, reviewer_name: reviewForm.name, rating: reviewForm.rating, comment: reviewForm.comment, created_at: new Date().toISOString() }, ...prev])
    setReviewForm({ name: '', rating: 5, comment: '' })
  }

  if (!product) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  const price = product.discount_price ?? product.price
  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 4.5

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-orange-500 mb-6 text-sm">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
            <img src={product.images[selectedImage] || 'https://picsum.photos/600/600'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-orange-500' : 'border-transparent'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <span className="text-sm text-orange-500 font-semibold">{product.category}</span>
          <h1 className="font-display font-700 text-3xl mt-1 mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={16} className={i <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display font-800 text-4xl">₹{price.toLocaleString()}</span>
            {product.discount_price && (
              <>
                <span className="text-xl text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded-full">
                  {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Color: <span className="text-orange-500">{selectedColor}</span></p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 rounded-full text-sm border-2 transition-colors ${selectedColor === c ? 'border-orange-500 text-orange-500' : 'border-gray-200 dark:border-gray-700'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Size: <span className="text-orange-500">{selectedSize}</span></p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-colors ${selectedSize === s ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 dark:border-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Text */}
          {product.allow_custom_text && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Custom Text (optional)</p>
              <input value={customText} onChange={e => setCustomText(e.target.value)}
                placeholder="Enter your custom text..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:border-orange-500" />
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm font-semibold">Quantity:</p>
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">-</button>
              <span className="px-4 py-2 font-semibold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-3">
            <button onClick={handleAddToCart}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors">
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button onClick={() => toggleWishlist(product.id)}
              className={`p-4 rounded-2xl border-2 transition-colors ${wishlist.includes(product.id) ? 'border-red-500 text-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
              <Heart size={20} className={wishlist.includes(product.id) ? 'fill-red-500' : ''} />
            </button>
          </div>

          {/* Buy Now */}
          <button onClick={handleBuyNow}
            className="w-full bg-white dark:bg-gray-800 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all">
            ⚡ Buy Now
          </button>

          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-red-500 text-sm mt-3 font-semibold">⚡ Only {product.stock} left in stock!</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-6">
          {['description', 'specifications', 'reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 font-semibold text-sm capitalize border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500'}`}>
              {t} {t === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'description' && <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>}
      {tab === 'specifications' && (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {[['Category', product.category], ['Stock', `${product.stock} units`],
            ['Colors', product.colors.join(', ') || 'N/A'],
            ['Sizes', product.sizes.join(', ') || 'N/A']].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{k}</p>
              <p className="font-semibold text-sm mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'reviews' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 mb-6">
            <h3 className="font-display font-700 mb-4">Write a Review</h3>
            <input value={reviewForm.name} onChange={e => setReviewForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-orange-500" />
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setReviewForm(p => ({ ...p, rating: i }))}>
                  <Star size={24} className={i <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
              placeholder="Your review..." rows={3}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-orange-500 resize-none" />
            <button onClick={submitReview} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors">
              Submit Review
            </button>
          </div>
          {reviews.length === 0 && <p className="text-gray-400 text-center py-8">No reviews yet. Be the first!</p>}
          {reviews.map(r => (
            <div key={r.id} className="border-b border-gray-100 dark:border-gray-800 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{r.reviewer_name}</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={12} className={i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display font-700 text-2xl mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => (
              <a href={`/products/${p.id}`} key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <img src={p.images[0]} alt={p.name} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-2">{p.name}</p>
                  <p className="text-orange-500 font-bold text-sm mt-1">₹{(p.discount_price ?? p.price).toLocaleString()}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://olgiiqkywisxspxqwsrs.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZ2lpcWt5d2lzeHNweHF3c3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA0OTUsImV4cCI6MjA5MjUyNjQ5NX0.ZB6TFYyM1GS9ryWYtuNQr52szKtbIvifBqkGnr0NTf4"
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  name: string
  description: string
  price: number
  discount_price: number | null
  category: string
  stock: number
  images: string[]
  colors: string[]
  sizes: string[]
  allow_custom_text: boolean
  is_active: boolean
  created_at: string
}

export type Coupon = {
  id: string
  code: string
  type: 'flat' | 'percentage'
  value: number
  min_order: number
  expiry_date: string
  is_active: boolean
}

export type Order = {
  id: string
  order_id: string
  customer_name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  items: CartItem[]
  subtotal: number
  discount: number
  gst: number
  total: number
  coupon_code: string | null
  status: string
  created_at: string
}

export type Review = {
  id: string
  product_id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
}

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  color?: string
  size?: string
  custom_text?: string
}
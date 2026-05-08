'use client'
import { CONFIG } from '@/lib/config'
import { Mail, Phone, MessageCircle, Users } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display font-700 text-4xl mb-3">Get in Touch</h1>
      <p className="text-gray-500 mb-10">We're here to help! Reach out on WhatsApp for the fastest response.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {[
          { icon: MessageCircle, label: 'WhatsApp Us', desc: 'Fastest response — usually within minutes', color: 'bg-green-500', href: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_HELP_TEXT)}`, text: 'Chat on WhatsApp' },
          { icon: Users, label: 'Join Our Group', desc: 'Get deals, offers and updates instantly', color: 'bg-blue-500', href: CONFIG.WHATSAPP_GROUP_LINK, text: 'Join WhatsApp Group' },
        ].map(item => (
          <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow flex gap-4 items-start">
            <div className={`${item.color} p-3 rounded-xl text-white`}><item.icon size={24} /></div>
            <div>
              <h3 className="font-display font-700 text-lg">{item.label}</h3>
              <p className="text-gray-500 text-sm mb-3">{item.desc}</p>
              <span className="text-sm font-semibold text-orange-500">{item.text} →</span>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="font-display font-700 text-xl mb-5">Send a Message</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input placeholder="Your Name" className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
          <input placeholder="Your Email" type="email" className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm" />
        </div>
        <textarea placeholder="Your message..." rows={4} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm resize-none mb-4" />
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors">Send Message</button>
      </div>
    </div>
  )
}
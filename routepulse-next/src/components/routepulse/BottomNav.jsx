'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, BookOpen, Plus, ArrowLeftRight, User } from 'lucide-react'

const tabs = [
  { href: '/',        icon: Map,            label: 'Carte'  },
  { href: '/feed',    icon: BookOpen,       label: 'Fil'    },
  { href: '/report',  icon: Plus,           label: null,    isCTA: true },
  { href: '/trajet',  icon: ArrowLeftRight, label: 'Trajet' },
  { href: '/profile', icon: User,           label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-2 py-2">
      {tabs.map((tab, i) => {
        if (tab.isCTA) {
          return (
            <Link
              key={i}
              href={tab.href}
              className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-lg -mt-5 transition-transform active:scale-95"
            >
              <Plus size={26} color="white" strokeWidth={2.5} />
            </Link>
          )
        }

        const isActive = pathname === tab.href ||
          (tab.href !== '/' && pathname.startsWith(tab.href))

        return (
          <Link
            key={i}
            href={tab.href}
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <tab.icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              color={isActive ? '#F97316' : '#9CA3AF'}
            />
            <span
              className="text-xs"
              style={{
                color:      isActive ? '#F97316' : '#9CA3AF',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
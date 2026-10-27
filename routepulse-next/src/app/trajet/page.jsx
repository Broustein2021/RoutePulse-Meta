import BottomNav from '@/components/routepulse/BottomNav'

export default function TrajetPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔀</p>
          <p className="font-bold text-gray-700">Avant de partir</p>
          <p className="text-gray-400 text-sm mt-1">En construction</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
export type StatCardColor = 'blue' | 'green' | 'orange' | 'purple'

const chipClasses: Record<StatCardColor, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  orange: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
}

export default function StatCard({ icon, label, value, color = 'blue' }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: StatCardColor
}) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ${chipClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}

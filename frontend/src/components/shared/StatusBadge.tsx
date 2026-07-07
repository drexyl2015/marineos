const map: Record<string, { badge: string; dot: string }> = {
  onboard: { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  available: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  leave: { badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  inactive: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = map[status] || map.inactive
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

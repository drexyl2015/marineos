export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    onboard: 'bg-blue-100 text-blue-800',
    available: 'bg-green-100 text-green-800',
    leave: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

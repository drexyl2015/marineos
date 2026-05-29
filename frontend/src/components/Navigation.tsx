import { Ship, Menu, X, ArrowLeft, Sun, Moon, LogOut } from 'lucide-react'
import { useState } from 'react'
import type { Theme } from '../App'
import { useAuth } from '../context/AuthContext'

interface NavigationProps {
  selectedRole: string
  onRoleChange: (role: string) => void
  onBackToLanding: () => void
  onLogout: () => void
  theme: Theme
  onThemeChange: (t: Theme) => void
}

const roles = [
  { id: 'super_admin',        label: 'Super Admin',        icon: '👑' },
  { id: 'crew_manager',       label: 'Crew Manager',       icon: '👥' },
  { id: 'compliance_officer', label: 'Compliance Officer', icon: '✅' },
  { id: 'master',             label: 'Master',             icon: '⚓' },
  { id: 'seafarer',           label: 'Seafarer',           icon: '🧑‍✈️' },
  { id: 'fleet_ops',          label: 'Fleet Ops',          icon: '🚢' },
  { id: 'port_authority',     label: 'Port Authority',     icon: '🏛️' },
  { id: 'crew_agency',        label: 'Crew Agency',        icon: '📋' },
  { id: 'vessel_manager',     label: 'Vessel Manager',     icon: '⚓' },
]

export default function Navigation({ selectedRole, onRoleChange, onBackToLanding, onLogout, theme, onThemeChange }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const isDark = theme === 'dark'

  return (
    <nav className="bg-navy-900 border-b border-white/5 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo + back link */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-steel-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Ship className="w-6 h-6 text-sea-500" />
              <span className="font-bold text-white text-base">MarineOS</span>
            </div>
          </div>

          {/* Desktop role switcher */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => onRoleChange(role.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  selectedRole === role.id
                    ? 'bg-sea-600 text-white'
                    : 'text-steel-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <span className="mr-1">{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* User badge */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-steel-400 max-w-[120px] truncate">{user.full_name || user.email}</span>
                <span className="text-xs bg-sea-900 text-sea-300 px-2 py-0.5 rounded-full font-medium capitalize">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {/* Dark / Light toggle */}
            <button
              type="button"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="p-2 text-steel-400 hover:text-white rounded-lg transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout */}
            {user && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="flex items-center gap-1.5 p-2 text-steel-400 hover:text-red-400 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              className="md:hidden p-2 text-steel-400 hover:text-white rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile role menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-white/5">
            {user && (
              <div className="px-4 py-2 text-xs text-steel-400 border-b border-white/5">
                {user.full_name || user.email} · <span className="capitalize">{user.role.replace(/_/g, ' ')}</span>
              </div>
            )}
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => { onRoleChange(role.id); setMobileMenuOpen(false) }}
                className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedRole === role.id
                    ? 'bg-sea-600 text-white'
                    : 'text-steel-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

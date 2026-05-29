import { useEffect, useState } from 'react'
import {
  Ship, FileText, Shield, Users, Anchor, Globe,
  CheckCircle, ArrowRight, Play, BarChart2,
  Zap, Search, AlertTriangle, ChevronDown, Menu, X
} from 'lucide-react'
import SubscribeModal from './SubscribeModal'

interface LandingPageProps {
  onEnterDashboard: () => void
  onSubscribe: (email: string) => void
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export default function LandingPage({ onEnterDashboard, onSubscribe }: LandingPageProps) {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  useReveal()

  return (
    <div className="min-h-screen bg-navy-950 text-white overflow-x-hidden">
      <MarketingNav
        onEnterDashboard={onEnterDashboard}
        onOpenSubscribe={() => setShowSubscribeModal(true)}
      />
      <HeroSection
        onEnterDashboard={onEnterDashboard}
        onOpenSubscribe={() => setShowSubscribeModal(true)}
      />
      <StatsBar />
      <FeaturesSection />
      <DashboardsShowcase />
      <HowItWorksSection />
      <PricingSection onOpenSubscribe={() => setShowSubscribeModal(true)} />
      <SubscribeCTASection
        onEnterDashboard={onEnterDashboard}
        onOpenSubscribe={() => setShowSubscribeModal(true)}
      />
      <FooterSection />

      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          onSubmit={(email) => {
            onSubscribe(email)
            setShowSubscribeModal(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Marketing Nav ────────────────────────────────────────────────────────────

function MarketingNav({ onEnterDashboard, onOpenSubscribe }: {
  onEnterDashboard: () => void
  onOpenSubscribe: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed w-full top-0 z-50 ${scrolled ? 'nav-solid' : 'nav-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Ship className="w-7 h-7 text-sea-500" />
            <span className="text-lg font-bold text-white">MarineOS</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features"   className="text-steel-300 hover:text-white text-sm transition-colors duration-200">Features</a>
            <a href="#dashboards" className="text-steel-300 hover:text-white text-sm transition-colors duration-200">Dashboards</a>
            <a href="#how-it-works" className="text-steel-300 hover:text-white text-sm transition-colors duration-200">How It Works</a>
            <a href="#subscribe"  className="text-steel-300 hover:text-white text-sm transition-colors duration-200">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={onEnterDashboard} className="btn-secondary py-2 px-4 text-sm">
              Try Demo
            </button>
            <button type="button" onClick={onOpenSubscribe} className="btn-primary py-2 px-4 text-sm">
              Get Access
            </button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-steel-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 bg-navy-900/95 rounded-b-xl">
            <a href="#features"     onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-steel-300 hover:text-white text-sm">Features</a>
            <a href="#dashboards"   onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-steel-300 hover:text-white text-sm">Dashboards</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-steel-300 hover:text-white text-sm">How It Works</a>
            <a href="#subscribe"    onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-steel-300 hover:text-white text-sm">Pricing</a>
            <div className="px-4 pt-3 flex flex-col gap-2">
              <button type="button" onClick={() => { onEnterDashboard(); setMobileOpen(false) }} className="btn-secondary text-sm py-2 justify-center">Try Demo</button>
              <button type="button" onClick={() => { onOpenSubscribe(); setMobileOpen(false) }} className="btn-primary text-sm py-2 justify-center">Get Access</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onEnterDashboard, onOpenSubscribe }: {
  onEnterDashboard: () => void
  onOpenSubscribe: () => void
}) {
  const [email, setEmail] = useState('')

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background — browser shows poster if video file is absent */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Subtle bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-20">
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm text-sea-400 mb-8 animate-fade-in">
          <Zap className="w-4 h-4" />
          AI-Powered Maritime Compliance Platform
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-fade-in">
          Maritime Operations,{' '}
          <span className="text-gradient-sea">Intelligently</span>{' '}
          Managed
        </h1>

        <p className="text-xl md:text-2xl text-steel-300 mb-10 max-w-3xl mx-auto animate-fade-in leading-relaxed">
          Automate crew documentation, ensure STCW/MLC compliance, and manage
          your entire maritime workforce — powered by Claude AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
          <button type="button" onClick={onEnterDashboard} className="btn-primary text-base px-8 py-4">
            <Play className="w-5 h-5" />
            Try Demo — Free
          </button>
          <button type="button" onClick={onOpenSubscribe} className="btn-secondary text-base px-8 py-4">
            Get Full Access
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-fade-in">
          <label htmlFor="hero-email" className="sr-only">Work email</label>
          <input
            id="hero-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenSubscribe()}
            placeholder="Enter your work email"
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20
                       text-white placeholder-steel-400 focus:outline-none
                       focus:ring-2 focus:ring-sea-500"
          />
          <button type="button" onClick={onOpenSubscribe} className="btn-primary whitespace-nowrap">
            Start Free Trial
          </button>
        </div>

        <p className="text-steel-500 text-xs mt-4 animate-fade-in">
          No credit card required · Instant demo access · Cancel anytime
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ChevronDown className="w-6 h-6 text-white/40" />
      </div>
    </section>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const stats = [
  { value: '500+', label: 'Crew Managed' },
  { value: '99%',  label: 'Compliance Rate' },
  { value: '8',    label: 'Role Dashboards' },
  { value: '15+',  label: 'Countries Served' },
]

function StatsBar() {
  return (
    <section className="bg-navy-900 border-y border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label} className="reveal">
            <p className="text-4xl font-black text-gradient-sea">{s.value}</p>
            <p className="text-steel-400 text-sm mt-2 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Features Section ─────────────────────────────────────────────────────────

const features = [
  {
    icon: <FileText className="w-7 h-7" />,
    title: 'Document Parsing',
    description: 'AI extracts crew certificates, ranks, and expiry dates from any PDF or image automatically.',
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'Compliance Check',
    description: 'Real-time STCW, MLC 2006, and SOLAS compliance validation across your entire crew.',
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: 'Crew Matching',
    description: 'Intelligent matching of seafarers to vessel positions based on certificates and availability.',
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: 'Port Briefings',
    description: 'AI-generated port-specific compliance briefings tailored to your vessel and destination.',
  },
  {
    icon: <AlertTriangle className="w-7 h-7" />,
    title: 'Risk Assessment',
    description: 'Predictive alerts for PSC inspection risk, expiring documents, and manning gaps.',
  },
  {
    icon: <BarChart2 className="w-7 h-7" />,
    title: 'Pool Analytics',
    description: 'Strategic analytics on crew utilisation, nationality spread, and succession planning.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* Parallax background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1920&q=70')" }}
      />
      <div className="absolute inset-0 bg-navy-950/90" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <p className="text-sea-500 font-semibold uppercase tracking-widest text-xs mb-4">
            Platform Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything Maritime Teams Need
          </h2>
          <p className="text-steel-400 text-lg max-w-2xl mx-auto">
            Purpose-built AI features for the complexities of maritime operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card-md rounded-2xl p-7 reveal hover:border-sea-500/40
                         hover:bg-white/[0.09] transition-all duration-300 group"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-sea-500/15 border border-sea-500/20
                              flex items-center justify-center text-sea-400 mb-5
                              group-hover:bg-sea-500/25 transition-colors duration-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-steel-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Dashboards Showcase ──────────────────────────────────────────────────────

const dashboards = [
  { icon: '👑', title: 'Super Admin',        desc: 'Full system oversight and analytics' },
  { icon: '👥', title: 'Crew Manager',       desc: 'Assignments, availability, utilisation' },
  { icon: '✅', title: 'Compliance Officer', desc: 'STCW, MLC, SOLAS audit trails' },
  { icon: '⚓', title: 'Master',             desc: 'Vessel command and crew manifest' },
  { icon: '🧑‍✈️', title: 'Seafarer',         desc: 'Personal certs and training tracker' },
  { icon: '🚢', title: 'Fleet Ops',          desc: 'Fleet-wide deployment dashboard' },
  { icon: '🏛️', title: 'Port Authority',    desc: 'PSC inspection readiness checker' },
  { icon: '📋', title: 'Crew Agency',        desc: 'Available pool search and placement' },
]

function DashboardsShowcase() {
  return (
    <section id="dashboards" className="py-28 bg-navy-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <p className="text-sea-500 font-semibold uppercase tracking-widest text-xs mb-4">
            Role-Based Access
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">8 Tailored Dashboards</h2>
          <p className="text-steel-400 text-lg max-w-2xl mx-auto">
            Every stakeholder gets a purpose-built view — from captain to port inspector
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboards.map((d, i) => (
            <div
              key={d.title}
              className="glass-card rounded-xl p-6 reveal text-center
                         hover:border-sea-500/35 hover:bg-white/[0.07]
                         transition-all duration-300 cursor-default"
              style={{ transitionDelay: `${i * 55}ms` }}
            >
              <div className="text-4xl mb-3">{d.icon}</div>
              <h3 className="font-semibold text-sm mb-1.5">{d.title}</h3>
              <p className="text-steel-400 text-xs leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Upload Documents',
    description: 'Upload crew certificates, passports, and maritime documents in any format — PDF, image, or scan.',
    icon: <FileText className="w-8 h-8" />,
  },
  {
    number: '02',
    title: 'AI Analyses & Validates',
    description: 'Claude AI extracts data, cross-references with STCW/MLC requirements, and flags compliance gaps instantly.',
    icon: <Search className="w-8 h-8" />,
  },
  {
    number: '03',
    title: 'Act with Confidence',
    description: 'Get actionable alerts, deploy crew, generate port briefings, and maintain audit-ready compliance.',
    icon: <CheckCircle className="w-8 h-8" />,
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 bg-navy-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-20 reveal">
          <p className="text-sea-500 font-semibold uppercase tracking-widest text-xs mb-4">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold">Up and Running in Minutes</h2>
        </div>

        <div className="space-y-16">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row items-center gap-10 reveal ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-sea-500/15
                              border border-sea-500/30 flex items-center justify-center text-sea-400">
                {step.icon}
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-sea-500 font-mono font-bold text-sm tracking-widest">{step.number}</span>
                <h3 className="text-2xl font-bold mt-1 mb-3">{step.title}</h3>
                <p className="text-steel-400 text-lg leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Subscribe CTA Section ────────────────────────────────────────────────────

function SubscribeCTASection({ onEnterDashboard, onOpenSubscribe }: {
  onEnterDashboard: () => void
  onOpenSubscribe: () => void
}) {
  const [email, setEmail] = useState('')

  return (
    <section id="subscribe" className="py-28 bg-navy-800 relative overflow-hidden">
      {/* Teal ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[700px] rounded-full bg-sea-500/8 blur-3xl" />
      </div>
      {/* Background maritime image with heavy overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549985657-4f6e63523b28?w=1920&q=60')" }}
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="reveal">
          <p className="text-sea-500 font-semibold uppercase tracking-widest text-xs mb-5">
            Get Started Today
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Transform Your Maritime Operations?
          </h2>
          <p className="text-steel-300 text-lg mb-10 leading-relaxed">
            Join maritime companies already saving hours per week on compliance and crew management.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6 reveal">
          <label htmlFor="cta-email" className="sr-only">Work email</label>
          <input
            id="cta-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenSubscribe()}
            placeholder="your@company.com"
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20
                       text-white placeholder-steel-400 focus:outline-none
                       focus:ring-2 focus:ring-sea-500"
          />
          <button type="button" onClick={onOpenSubscribe} className="btn-primary whitespace-nowrap">
            Subscribe
          </button>
        </div>

        <div className="reveal">
          <p className="text-steel-500 text-sm mb-5">— or try without signing up —</p>
          <button type="button" onClick={onEnterDashboard} className="btn-secondary">
            <Play className="w-4 h-4" />
            Explore Live Demo
          </button>
          <p className="text-steel-500 text-xs mt-4">
            No credit card required · Instant access · No installation
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection({ onOpenSubscribe }: { onOpenSubscribe: () => void }) {
  const tiers = [
    {
      name: 'Starter',
      price: '$49',
      period: '/mo',
      limit: 'Up to 25 crew',
      features: ['Crew & certificate tracking', 'AI document scanning', 'Expiry alerts', 'AI assistant chat'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$149',
      period: '/mo',
      limit: 'Up to 100 crew',
      features: ['Everything in Starter', 'Fleet & vessel management', 'Port compliance briefings', 'Multi-role access', 'Priority email support'],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      limit: 'Unlimited crew',
      features: ['Everything in Professional', 'API access', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-28 bg-navy-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-steel-400 text-lg">Scale from a single vessel to a global fleet</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? 'bg-sea-600 border-2 border-sea-400 shadow-xl shadow-sea-900/40'
                  : 'bg-navy-900 border border-white/10'
              }`}
            >
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${tier.highlighted ? 'text-white' : 'text-steel-200'}`}>{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${tier.highlighted ? 'text-white' : 'text-white'}`}>{tier.price}</span>
                  {tier.period && <span className={`text-sm ${tier.highlighted ? 'text-sea-100' : 'text-steel-400'}`}>{tier.period}</span>}
                </div>
                <p className={`text-sm mt-1 ${tier.highlighted ? 'text-sea-100' : 'text-steel-500'}`}>{tier.limit}</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {tier.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${tier.highlighted ? 'text-sea-50' : 'text-steel-300'}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${tier.highlighted ? 'text-sea-200' : 'text-sea-400'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {tier.name === 'Enterprise' ? (
                <a
                  href="mailto:daresadiq2008@yahoo.com"
                  className={`text-center py-3 rounded-xl font-semibold text-sm transition border ${
                    tier.highlighted
                      ? 'bg-white text-sea-700 hover:bg-sea-50 border-white'
                      : 'border-sea-500 text-sea-400 hover:bg-sea-900'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSubscribe}
                  className={`py-3 rounded-xl font-semibold text-sm transition ${
                    tier.highlighted
                      ? 'bg-white text-sea-700 hover:bg-sea-50'
                      : 'bg-sea-600 text-white hover:bg-sea-500'
                  }`}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer className="bg-navy-950 border-t border-white/5 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Ship className="w-7 h-7 text-sea-500" />
              <span className="text-xl font-bold">MarineOS</span>
            </div>
            <p className="text-steel-400 text-sm leading-relaxed max-w-xs">
              AI-powered maritime compliance and crew management for modern shipping companies.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <Anchor className="w-4 h-4 text-sea-500" />
              <span className="text-steel-400 text-xs">Built for maritime professionals</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-steel-200">Product</h4>
            <ul className="space-y-2.5 text-steel-400 text-sm">
              <li><a href="#features"     className="hover:text-sea-400 transition-colors">Features</a></li>
              <li><a href="#dashboards"   className="hover:text-sea-400 transition-colors">Dashboards</a></li>
              <li><a href="#how-it-works" className="hover:text-sea-400 transition-colors">How It Works</a></li>
              <li><a href="#subscribe"    className="hover:text-sea-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-steel-200">Contact</h4>
            <ul className="space-y-2.5 text-steel-400 text-sm">
              <li>daresadiq2008@yahoo.com</li>
              <li className="text-steel-500 text-xs mt-2">Maritime Operations Support</li>
              <li className="text-steel-500 text-xs">Response within 1 business day</li>
            </ul>
          </div>
        </div>

        <div className="section-divider mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-steel-500 text-xs">
          <p>© {new Date().getFullYear()} MarineOS. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-steel-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-steel-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

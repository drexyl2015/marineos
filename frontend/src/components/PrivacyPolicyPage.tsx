import { ArrowLeft, Ship } from 'lucide-react'

interface Props {
  onBack: () => void
}

export default function PrivacyPolicyPage({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-navy-950 text-steel-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-steel-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Ship className="w-5 h-5 text-sea-400" />
            <span className="text-white font-bold">MarineOS</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-steel-500 text-sm mb-2">Datenschutzerklärung</p>
        <p className="text-steel-500 text-sm mb-10">Pursuant to Art. 13 GDPR (EU General Data Protection Regulation)</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Data Controller</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 space-y-1">
              <p className="font-medium text-white">Dare Sadiq</p>
              <p>Walter Arnold Str. 7, 01219 Dresden, Germany</p>
              <p>
                Email:{' '}
                <a href="mailto:daresadiq2008@yahoo.com" className="text-sea-400 hover:text-sea-300 transition-colors">
                  daresadiq2008@yahoo.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. What Data We Collect</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 space-y-4">
              <div>
                <p className="font-medium text-white mb-1">Access Request Form</p>
                <p className="text-sm">
                  When you submit the "Start Free Trial" or "Get Full Access" form, we collect: your name,
                  email address, company name, job role, and any optional message you provide. This data
                  is used solely to respond to your enquiry.
                </p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Server Logs</p>
                <p className="text-sm">
                  Our hosting provider (Render.com) automatically records server access logs including
                  IP address, browser type, and request timestamps. These logs are retained for up to
                  30 days for security purposes.
                </p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Account Data</p>
                <p className="text-sm">
                  If you create an account, we store your username, hashed password, and role. Passwords
                  are encrypted using bcrypt and are never stored in plain text.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Legal Basis for Processing</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 text-sm space-y-2">
              <p>We process your data on the following legal bases under Art. 6 GDPR:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><span className="text-white">Consent (Art. 6(1)(a))</span> — when you voluntarily submit the contact form</li>
                <li><span className="text-white">Contract (Art. 6(1)(b))</span> — when you create an account to use the platform</li>
                <li><span className="text-white">Legitimate interest (Art. 6(1)(f))</span> — server security logs</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 text-sm space-y-3">
              <div>
                <p className="font-medium text-white">Render.com (Hosting)</p>
                <p>The backend API is hosted on Render.com (USA). Render is GDPR-compliant. Privacy policy: render.com/privacy</p>
              </div>
              <div>
                <p className="font-medium text-white">Vercel (Frontend Hosting)</p>
                <p>The frontend is hosted on Vercel (USA). Vercel is GDPR-compliant. Privacy policy: vercel.com/legal/privacy-policy</p>
              </div>
              <div>
                <p className="font-medium text-white">Resend (Email Delivery)</p>
                <p>Access request notifications are sent via Resend.com. Your submitted form data is passed to Resend for delivery purposes only.</p>
              </div>
              <div>
                <p className="font-medium text-white">Neon (Database)</p>
                <p>Account and operational data is stored in a PostgreSQL database hosted by Neon.tech.</p>
              </div>
              <div>
                <p className="font-medium text-white">Anthropic / Claude AI</p>
                <p>AI chat queries are processed by Anthropic's API. Messages you send to the AI assistant may be processed by Anthropic. See anthropic.com/privacy.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookies</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 text-sm">
              <p>
                This website uses only essential functional cookies (e.g., storing your login session
                and theme preference in <code className="bg-navy-800 px-1 rounded text-sea-400">localStorage</code>).
                We do not use tracking, advertising, or analytics cookies. No third-party cookies are set.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Your Rights under GDPR</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 text-sm">
              <p className="mb-3">You have the following rights regarding your personal data:</p>
              <ul className="space-y-2">
                {[
                  ['Art. 15', 'Right of access — request a copy of data we hold about you'],
                  ['Art. 16', 'Right to rectification — correct inaccurate data'],
                  ['Art. 17', 'Right to erasure ("right to be forgotten")'],
                  ['Art. 18', 'Right to restriction of processing'],
                  ['Art. 20', 'Right to data portability'],
                  ['Art. 21', 'Right to object to processing'],
                  ['Art. 77', 'Right to lodge a complaint with a supervisory authority'],
                ].map(([art, desc]) => (
                  <li key={art} className="flex gap-3">
                    <span className="text-sea-400 font-mono text-xs mt-0.5 shrink-0">{art}</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                To exercise any of these rights, contact:{' '}
                <a href="mailto:daresadiq2008@yahoo.com" className="text-sea-400 hover:text-sea-300 transition-colors">
                  daresadiq2008@yahoo.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Supervisory Authority</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 text-sm">
              <p>
                If you believe your data has been processed unlawfully, you have the right to lodge a
                complaint with the competent supervisory authority in Saxony, Germany:
              </p>
              <div className="mt-3 space-y-1">
                <p className="font-medium text-white">Sächsischer Datenschutzbeauftragter</p>
                <p>Devrientstr. 5, 01067 Dresden</p>
                <p>
                  Website:{' '}
                  <span className="text-sea-400">saechsdsb.de</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        <p className="text-steel-600 text-xs mt-12">Last updated: May 2026</p>
      </div>
    </div>
  )
}

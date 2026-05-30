import { ArrowLeft, Ship } from 'lucide-react'

interface Props {
  onBack: () => void
}

export default function ImpressumPage({ onBack }: Props) {
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

        <h1 className="text-3xl font-bold text-white mb-2">Impressum</h1>
        <p className="text-steel-500 text-sm mb-10">Legal Notice pursuant to § 5 TMG (German Telemedia Act)</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Responsible for Content</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 space-y-1">
              <p className="font-medium text-white">Dare Sadiq</p>
              <p>Walter Arnold Str. 7</p>
              <p>01219 Dresden</p>
              <p>Germany</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 space-y-1">
              <p>
                Email:{' '}
                <a
                  href="mailto:daresadiq2008@yahoo.com"
                  className="text-sea-400 hover:text-sea-300 transition-colors"
                >
                  daresadiq2008@yahoo.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Purpose of this Website</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300">
              <p>
                MarineOS is a portfolio and demonstration project showcasing an AI-powered maritime
                operations and crew management platform. It is not a registered commercial business.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Disclaimer</h2>
            <div className="bg-navy-900 border border-white/10 rounded-xl p-5 text-steel-300 space-y-3">
              <div>
                <p className="font-medium text-white mb-1">Liability for Content</p>
                <p className="text-sm">
                  The contents of this website have been created with greatest care. However, we cannot
                  guarantee the accuracy, completeness, or topicality of the content. As a service provider,
                  we are responsible for our own content on these pages under the general laws pursuant to
                  § 7 para. 1 TMG.
                </p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Liability for Links</p>
                <p className="text-sm">
                  Our website contains links to external websites of third parties, on whose contents we have
                  no influence. Therefore, we cannot assume any liability for these external contents.
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

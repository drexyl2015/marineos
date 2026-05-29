import { useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Eye, FileText, Upload } from 'lucide-react'
import ModalOverlay from '../shared/ModalOverlay'
import { CERT_TYPES } from '../../constants/maritime'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type CertModalStage = 'upload' | 'parsing' | 'review'

export default function AddCertModal({ crewId, crewName, onClose, onSuccess }: {
  crewId: number
  crewName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [stage, setStage] = useState<CertModalStage>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<string>('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [form, setForm] = useState({
    certificate_type: CERT_TYPES[6],
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    other_type: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setParseError('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    setPreview(URL.createObjectURL(file))
    setStage('parsing')
    setParseError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post(`${API_URL}/api/ai/parse-certificate-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const d = res.data
      setForm({
        certificate_type: d.certificate_type && CERT_TYPES.includes(d.certificate_type)
          ? d.certificate_type
          : (d.certificate_type ? 'Other' : CERT_TYPES[6]),
        issue_date: d.issue_date ?? '',
        expiry_date: d.expiry_date ?? '',
        issuing_authority: d.issuing_authority ?? '',
        other_type: d.certificate_type && !CERT_TYPES.includes(d.certificate_type)
          ? d.certificate_type : '',
      })
      setConfidence(d.confidence ?? '')
      setStage('review')
    } catch {
      setParseError('AI could not read the image. Please fill in the details manually.')
      setStage('review')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.issue_date || !form.expiry_date || !form.issuing_authority.trim()) return
    setSubmitting(true)
    setSaveError(null)
    try {
      const certType = form.certificate_type === 'Other'
        ? (form.other_type.trim() || 'Other')
        : form.certificate_type
      await axios.post(`${API_URL}/api/certificates/`, {
        crew_id: crewId,
        certificate_type: certType,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
        issuing_authority: form.issuing_authority.trim(),
        ratings: [],
        endorsements: [],
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Failed to save certificate.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-marine-600" /> Add Certificate
        </h2>
        {stage === 'review' && preview && (
          <img src={preview} alt="cert preview"
            className="w-16 h-10 object-cover rounded border border-gray-200 ml-2 flex-shrink-0" />
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        For: <span className="font-semibold text-gray-700">{crewName}</span>
      </p>

      {stage === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`transition-colors rounded-xl border-2 border-dashed ${dragOver ? 'border-marine-400 bg-marine-50' : 'border-gray-300 hover:border-marine-300 hover:bg-gray-50'}`}
        >
          <label className="flex flex-col items-center justify-center w-full h-52 cursor-pointer">
            <Upload className={`w-12 h-12 mb-3 transition-colors ${dragOver ? 'text-marine-500' : 'text-gray-300'}`} />
            <p className="font-semibold text-gray-600 text-base">Drop certificate photo here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            <p className="text-gray-300 text-xs mt-3">JPEG · PNG · WebP · GIF — max 10 MB</p>
            <span className="mt-4 px-4 py-1.5 bg-marine-600 text-white text-sm rounded-lg font-medium hover:bg-marine-700 transition">
              Browse File
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      )}

      {stage === 'parsing' && (
        <div className="flex flex-col items-center justify-center py-12 gap-5">
          {preview && (
            <div className="relative">
              <img src={preview} alt="uploading" className="w-40 h-28 object-cover rounded-xl opacity-70 border border-gray-200" />
              <div className="absolute inset-0 bg-white/40 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-600" />
              </div>
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-gray-700">Reading certificate with AI…</p>
            <p className="text-sm text-gray-400 mt-1">Claude is extracting the certificate details</p>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <form onSubmit={handleSave} className="space-y-4">
          {parseError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}
          {!parseError && confidence === 'low' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span>AI confidence is low — please verify all fields before saving.</span>
            </div>
          )}
          {!parseError && confidence === 'high' && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Certificate read successfully — review the fields below.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type *</label>
            <select value={form.certificate_type} onChange={e => setField('certificate_type', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm bg-white">
              {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {form.certificate_type === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name *</label>
              <input required type="text" value={form.other_type} onChange={e => setField('other_type', e.target.value)}
                placeholder="Enter certificate name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
              <input required type="date" value={form.issue_date} onChange={e => setField('issue_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input required type="date" value={form.expiry_date} onChange={e => setField('expiry_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority *</label>
            <input required type="text" value={form.issuing_authority} onChange={e => setField('issuing_authority', e.target.value)}
              placeholder="e.g. Maritime Administration, MCA UK"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-marine-600 text-sm" />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setStage('upload'); setPreview(null); setParseError(null) }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition">
              ← Re-upload
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 bg-marine-600 text-white rounded-lg hover:bg-marine-700 disabled:opacity-50 text-sm font-medium transition">
              {submitting ? 'Saving…' : 'Add Certificate'}
            </button>
          </div>
        </form>
      )}

      {stage === 'upload' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setStage('review')}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition">
            Skip photo — fill in manually
          </button>
        </div>
      )}
    </ModalOverlay>
  )
}

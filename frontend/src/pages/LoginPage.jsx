import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, User, Lock, Plus, ArrowRight, LogOut, CheckCircle, Server, CloudOff, Loader2 } from 'lucide-react'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'
import PINAuthComponent from '@/components/auth/PINAuthComponent'
import { listStudents, loginStudent, registerStudent } from '@/services/studentManagement'
import { syncLocalUserToBackend } from '@/services/api'
import { useAppMode } from '@/context/AppModeContext'
import { useAuthSessionCtx } from '@/context/AuthSessionContext'
import { useStudent } from '@/context/StudentContext'
import { getAnonId } from '@/utils/identity'
import logoImage from '@/assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('mode') // 'mode' | 'student-select' | 'student-register' | 'validator'
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showPINAuth, setShowPINAuth] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { appMode } = useAppMode()
  const { isAuthenticated, isInitialising } = useAuthSessionCtx()
  const { updateCurrentStudent, refreshStudentList } = useStudent()

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    class: '',
    pin: '',
    language: 'en',
  })

  // Validator form
  const [validatorForm, setValidatorForm] = useState({
    username: '',
    password: '',
  })

  // Load students on mount
  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const studentList = await listStudents()
      setStudents(studentList)
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  const saveLocalAuth = (student) => {
    localStorage.setItem('access_token', `local-${student.id}-${Date.now()}`)
    localStorage.setItem('auth_user', JSON.stringify({
      id: student.id,
      name: student.name,
      role: 'student',
      mode: 'local',
    }))
  }

  const syncAfterEntry = (student, pin) => {
    if (navigator.onLine === false) return

    setTimeout(() => {
      syncLocalUserToBackend({ ...student, pin }).catch(() => {})
    }, 0)
  }

  const enterStudent = async (studentId, pin) => {
    setIsLoading(true)
    setError('')
    try {
      const student = await loginStudent(studentId, pin)
      updateCurrentStudent(student)
      saveLocalAuth(student)
      getAnonId().catch(() => {})
      navigate('/selection', { replace: true })
      syncAfterEntry(student, pin)
    } catch (err) {
      setError('Invalid PIN')
      setIsLoading(false)
      throw err
    }
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setShowPINAuth(true)
  }

  const handlePINSuccess = async (pin) => {
    await enterStudent(selectedStudent.id, pin)
  }

  const handleRegisterStudent = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!registerForm.name || !registerForm.class || !registerForm.pin) {
        throw new Error('All fields are required')
      }

      if (registerForm.pin.length < 4) {
        throw new Error('PIN must be at least 4 digits')
      }

      const student = await registerStudent(registerForm)
      updateCurrentStudent(student)
      saveLocalAuth(student)
      getAnonId().catch(() => {})
      navigate('/selection', { replace: true })
      syncAfterEntry(student, registerForm.pin)
      loadStudents()
      refreshStudentList()
      setRegisterForm({ name: '', class: '', pin: '', language: 'en' })
    } catch (err) {
      setError(err.message || 'Could not create student')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidatorSubmit = (e) => {
    e.preventDefault()
    if (!validatorForm.username || !validatorForm.password) {
      setError('Please fill in all fields')
      return
    }
    // Mock validation
    navigate('/teacher-validation')
  }

  // ─── VIEWS ────────────────────────────────────────────────────────────────

  if (view === 'mode') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <LanguageSwitcher />
        </div>

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-surface-card rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-400/20 rounded-full blur-[100px]" />

        <div className="w-full max-w-md z-10 animate-slide-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-surface-border p-1 mb-4 shadow-glow-primary overflow-hidden">
              <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-display font-bold text-surface-text mb-2">
              Pragna Vistara
            </h1>
            <p className="text-surface-muted">Learning platform for all</p>
          </div>

          {/* Backend Connection Hero */}
          <div className={`mb-8 p-6 rounded-2xl border transition-all ${
            appMode === 'online'
              ? 'bg-gradient-to-br from-primary-500/10 to-accent-teal/5 border-primary-500/30'
              : 'bg-surface-card border-surface-border'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                appMode === 'online' ? 'bg-primary-500/20' : 'bg-surface-border'
              }`}>
                {appMode === 'online' ? (
                  <Server className="w-6 h-6 text-primary-500" />
                ) : (
                  <CloudOff className="w-6 h-6 text-surface-muted" />
                )}
              </div>
              <div className="text-left flex-1">
                <h3 className="text-base font-semibold text-surface-text">
                  {appMode === 'online' ? 'Connected to Network' : 'Offline Mode Active'}
                </h3>
                <p className="text-xs text-surface-muted mt-1 leading-relaxed">
                  {appMode === 'online'
                    ? 'AI processing and cloud synchronization are active.'
                    : 'Learning content is served directly from your device.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl border border-surface-border space-y-4">
            {/* Student Mode */}
            <button
              onClick={() => {
                loadStudents()
                setView('student-select')
              }}
              className="w-full flex items-center gap-4 p-6 bg-gradient-to-br from-primary-500/10 to-primary-600/5 hover:from-primary-500/20 hover:to-primary-600/10 border border-primary-500/30 rounded-lg transition-all group"
            >
              <div className="p-3 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
                <User size={24} className="text-primary-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-surface-muted">Student</p>
                <p className="text-base font-semibold text-surface-text">
                  {students.length > 0
                    ? `${students.length} student${students.length !== 1 ? 's' : ''} available`
                    : 'Create your account'}
                </p>
              </div>
              <ArrowRight size={20} className="text-primary-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Validator Mode */}
            <button
              onClick={() => setView('validator')}
              className="w-full flex items-center gap-4 p-6 bg-gradient-to-br from-secondary-400/10 to-secondary-500/5 hover:from-secondary-400/20 hover:to-secondary-500/10 border border-secondary-400/30 rounded-lg transition-all group"
            >
              <div className="p-3 bg-secondary-400/20 rounded-lg group-hover:bg-secondary-400/30 transition-colors">
                <Shield size={24} className="text-secondary-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-surface-muted">Educator</p>
                <p className="text-base font-semibold text-surface-text">
                  Review & validate explanations
                </p>
              </div>
              <ArrowRight size={20} className="text-secondary-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'student-select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <LanguageSwitcher />
        </div>

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-surface-card rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-400/20 rounded-full blur-[100px]" />

        <div className="w-full max-w-md z-10 animate-slide-up">
          <div className="text-center mb-8">
            <button
              onClick={() => setView('mode')}
              className="mb-4 text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-display font-bold text-surface-text mb-2">
              Select Student
            </h1>
            <p className="text-surface-muted">
              {students.length} student{students.length !== 1 ? 's' : ''} on this device
            </p>
          </div>

          {/* Auth Status Hero */}
          <div className="mb-6">
            {appMode === 'online' ? (
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center gap-3">
                {isInitialising ? (
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                ) : isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-accent-teal" />
                ) : (
                  <Shield className="w-5 h-5 text-surface-muted" />
                )}
                <div className="text-sm">
                  {isInitialising
                    ? <span className="text-primary-500 font-medium">Authenticating with server...</span>
                    : isAuthenticated
                      ? <span className="text-accent-teal font-medium">Session securely synced</span>
                      : <span className="text-surface-muted">Select a student to authenticate</span>
                  }
                </div>
              </div>
            ) : (
               <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center gap-3">
                <CloudOff className="w-5 h-5 text-surface-muted" />
                <span className="text-sm text-surface-muted">Local device mode</span>
               </div>
            )}
          </div>

          <div className="glass p-8 rounded-2xl border border-surface-border space-y-3">
            {/* Existing Students */}
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="w-full p-4 text-left bg-surface-card hover:bg-surface-border border border-surface-border rounded-lg transition-all group"
              >
                <p className="font-semibold text-surface-text group-hover:text-primary-500 transition-colors">
                  {student.name}
                </p>
                <p className="text-sm text-surface-muted">Class {student.class}</p>
              </button>
            ))}

            {/* Divider */}
            {students.length > 0 && <div className="my-4 border-t border-surface-border" />}

            {/* Register New Student */}
            <button
              onClick={() => setView('student-register')}
              className="w-full flex items-center justify-center gap-2 p-4 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-all text-primary-500 font-medium"
            >
              <Plus size={18} />
              Add New Student
            </button>

            {/* Back to Mode */}
            <button
              onClick={() => setView('mode')}
              className="w-full px-4 py-3 bg-surface-card border border-surface-border text-surface-text rounded-lg hover:bg-surface-border transition-all font-medium"
            >
              Back to Mode Selection
            </button>
          </div>
        </div>

        {/* PIN Auth Modal Overlay */}
        {showPINAuth && selectedStudent && (
          <PINAuthComponent
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
            purpose="login"
            onSuccess={handlePINSuccess}
            onCancel={() => {
              setShowPINAuth(false)
              setSelectedStudent(null)
              setError('')
            }}
          />
        )}

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-500/90 text-white rounded-xl shadow-lg animate-slide-up text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (view === 'student-register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <LanguageSwitcher />
        </div>

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-surface-card rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-400/20 rounded-full blur-[100px]" />

        <div className="w-full max-w-md z-10 animate-slide-up">
          <div className="text-center mb-8">
            <button
              onClick={() => setView('student-select')}
              className="mb-4 text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-display font-bold text-surface-text mb-2">
              Create Student Account
            </h1>
            <p className="text-surface-muted">Register on this device</p>
          </div>

          <div className="glass p-8 rounded-2xl border border-surface-border">
            <form onSubmit={handleRegisterStudent} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  placeholder="e.g., Ravi Kumar"
                  className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Class *
                </label>
                <select
                  value={registerForm.class}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, class: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  disabled={isLoading}
                  required
                >
                  <option value="">Select class</option>
                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(
                    cls => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Language
                </label>
                <select
                  value={registerForm.language}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, language: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  disabled={isLoading}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                </select>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Create PIN (4-6 digits) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={registerForm.pin}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                    })
                  }
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-surface-muted mt-1">
                  {registerForm.pin.length} / 6 digits
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-medium disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setView('student-select')}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-surface-card border border-surface-border text-surface-text rounded-lg hover:bg-surface-border transition-all font-medium"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'validator') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <LanguageSwitcher />
        </div>

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-surface-card rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-400/20 rounded-full blur-[100px]" />

        <div className="w-full max-w-md z-10 animate-slide-up">
          <div className="text-center mb-8">
            <button
              onClick={() => setView('mode')}
              className="mb-4 text-secondary-400 hover:text-secondary-500 font-medium text-sm"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-display font-bold text-surface-text mb-2">
              Educator Login
            </h1>
            <p className="text-surface-muted">Sign in to validate explanations</p>
          </div>

          <div className="glass p-8 rounded-2xl border border-surface-border">
            <form onSubmit={handleValidatorSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-muted">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={validatorForm.username}
                    onChange={(e) =>
                      setValidatorForm({ ...validatorForm, username: e.target.value })
                    }
                    placeholder="educator@school.edu"
                    className="w-full pl-10 px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-400 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-surface-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-muted">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={validatorForm.password}
                    onChange={(e) =>
                      setValidatorForm({ ...validatorForm, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-400 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-secondary-400 text-surface-text rounded-lg hover:bg-secondary-500 transition-all font-medium disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setView('mode')}
                className="w-full px-4 py-3 bg-surface-card border border-surface-border text-surface-text rounded-lg hover:bg-surface-border transition-all font-medium"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
  // Fallback (should not reach here)
  return null
}

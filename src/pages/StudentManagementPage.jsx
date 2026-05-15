import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Download, Upload } from 'lucide-react'
import { useStudent } from '@/context/StudentContext'
import {
  registerStudent,
  listStudents,
  editStudent,
  removeStudent,
  downloadStudentDataJSON,
  downloadStudentDataCSV,
  importStudentDataFromFile,
  getStudentProgressSummary,
} from '@/services/studentManagement'
import PINAuthComponent from '@/components/auth/PINAuthComponent'

/**
 * StudentManagementPage - Manage all students on the device
 * Features: create, edit, delete, export, import
 */
export default function StudentManagementPage() {
  const navigate = useNavigate()
  const { allStudents, refreshStudentList } = useStudent()
  
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPINAuth, setShowPINAuth] = useState(false)
  const [pinAuthAction, setPinAuthAction] = useState(null) // 'delete' | 'export-json' | 'export-csv'
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    pin: '',
    language: 'en',
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const studentList = await listStudents()
      setStudents(studentList)
    } catch (err) {
      setError('Failed to load students')
    }
  }

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!formData.name || !formData.class || !formData.pin) {
        throw new Error('All fields are required')
      }

      if (formData.pin.length < 4) {
        throw new Error('PIN must be at least 4 digits')
      }

      await registerStudent(formData)
      setFormData({ name: '', class: '', pin: '', language: 'en' })
      setShowCreateForm(false)
      setSuccessMsg(`Student ${formData.name} created successfully!`)
      
      await loadStudents()
      await refreshStudentList()
      
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStudent = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await editStudent(selectedStudent.id, {
        name: formData.name,
        class: formData.class,
        language: formData.language,
      })

      setFormData({ name: '', class: '', pin: '', language: 'en' })
      setShowEditForm(false)
      setSelectedStudent(null)
      setSuccessMsg('Student updated successfully!')

      await loadStudents()
      await refreshStudentList()

      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStudent = async (pin) => {
    setIsLoading(true)
    setError('')

    try {
      await removeStudent(selectedStudent.id, pin)
      setShowPINAuth(false)
      setPinAuthAction(null)
      setSelectedStudent(null)
      setSuccessMsg('Student deleted successfully')

      await loadStudents()
      await refreshStudentList()

      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportJSON = async (pin) => {
    setIsLoading(true)
    try {
      await downloadStudentDataJSON(selectedStudent.id, pin)
      setShowPINAuth(false)
      setPinAuthAction(null)
      setSuccessMsg('Data exported successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = async (pin) => {
    setIsLoading(true)
    try {
      await downloadStudentDataCSV(selectedStudent.id, pin)
      setShowPINAuth(false)
      setPinAuthAction(null)
      setSuccessMsg('Data exported as CSV!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      await importStudentDataFromFile(file)
      setSuccessMsg('Student data imported successfully!')
      await loadStudents()
      await refreshStudentList()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  const openEditForm = (student) => {
    setSelectedStudent(student)
    setFormData({
      name: student.name,
      class: student.class,
      pin: '',
      language: student.language,
    })
    setShowEditForm(true)
  }

  const openDeleteConfirm = (student) => {
    setSelectedStudent(student)
    setPinAuthAction('delete')
    setShowPINAuth(true)
  }

  const openExportJSON = (student) => {
    setSelectedStudent(student)
    setPinAuthAction('export-json')
    setShowPINAuth(true)
  }

  const openExportCSV = (student) => {
    setSelectedStudent(student)
    setPinAuthAction('export-csv')
    setShowPINAuth(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/5 to-secondary-400/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface-card rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-surface-text" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold text-surface-text">
                Student Management
              </h1>
              <p className="text-surface-muted mt-1">
                Manage {students.length} student{students.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-500">{successMsg}</p>
          </div>
        )}

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={() => openEditForm(student)}
              onDelete={() => openDeleteConfirm(student)}
              onExportJSON={() => openExportJSON(student)}
              onExportCSV={() => openExportCSV(student)}
            />
          ))}
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <p className="text-surface-muted mb-4">No students yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Create First Student
            </button>
          </div>
        )}

        {/* Import Button */}
        <div className="mt-8 text-center">
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-surface-border rounded-lg cursor-pointer hover:bg-surface-card transition-colors">
            <Upload size={18} />
            <span>Import Student Data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <StudentFormModal
          title="Create New Student"
          student={null}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
          onSubmit={handleCreateStudent}
          onCancel={() => {
            setShowCreateForm(false)
            setFormData({ name: '', class: '', pin: '', language: 'en' })
          }}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && selectedStudent && (
        <StudentFormModal
          title="Edit Student"
          student={selectedStudent}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
          onSubmit={handleEditStudent}
          onCancel={() => {
            setShowEditForm(false)
            setSelectedStudent(null)
            setFormData({ name: '', class: '', pin: '', language: 'en' })
          }}
          isEditMode={true}
        />
      )}

      {/* PIN Auth Modal */}
      {showPINAuth && selectedStudent && (
        <PINAuthComponent
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          purpose={
            pinAuthAction === 'delete'
              ? 'delete'
              : pinAuthAction === 'export-json'
                ? 'export'
                : 'export'
          }
          onSuccess={(pin) => {
            if (pinAuthAction === 'delete') {
              handleDeleteStudent(pin)
            } else if (pinAuthAction === 'export-json') {
              handleExportJSON(pin)
            } else if (pinAuthAction === 'export-csv') {
              handleExportCSV(pin)
            }
          }}
          onCancel={() => {
            setShowPINAuth(false)
            setPinAuthAction(null)
            setSelectedStudent(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * StudentCard - Individual student card in the grid
 */
function StudentCard({ student, onEdit, onDelete, onExportJSON, onExportCSV }) {
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const prog = await getStudentProgressSummary(student.id)
        setProgress(prog)
      } catch (err) {
        console.error('Failed to load progress:', err)
      }
    }
    loadProgress()
  }, [student.id])

  return (
    <div className="glass p-6 rounded-xl border border-surface-border hover:border-primary-500/50 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-surface-text">{student.name}</h3>
        <p className="text-sm text-surface-muted">Class {student.class}</p>
      </div>

      {progress && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-surface-muted">Attempts</span>
            <span className="font-medium text-surface-text">{progress.total_attempts}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-muted">Accuracy</span>
            <span className="font-medium text-surface-text">{progress.accuracy}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-surface-card hover:bg-primary-500/10 border border-surface-border rounded-lg transition-colors text-primary-500 font-medium"
        >
          <Edit size={16} />
          Edit
        </button>

        <button
          onClick={onExportJSON}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-surface-card hover:bg-secondary-400/10 border border-surface-border rounded-lg transition-colors text-secondary-400 font-medium"
          title="Export as JSON"
        >
          <Download size={16} />
        </button>

        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-surface-card hover:bg-red-500/10 border border-surface-border rounded-lg transition-colors text-red-500 font-medium"
          title="Delete student"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * StudentFormModal - Reusable form for create/edit
 */
function StudentFormModal({
  title,
  formData,
  setFormData,
  isLoading,
  onSubmit,
  onCancel,
  isEditMode = false,
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-8 rounded-2xl border border-surface-border shadow-xl animate-slide-up">
        <h2 className="text-2xl font-bold text-surface-text mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-text mb-2">
              Student Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Ravi Kumar"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
              required
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-surface-text mb-2">
              Class *
            </label>
            <select
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
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
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
          </div>

          {/* PIN (only for create) */}
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-surface-text mb-2">
                PIN (4-6 digits) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                required
              />
              <p className="text-xs text-surface-muted mt-1">
                {formData.pin.length} / 6 digits
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-surface-card border border-surface-border text-surface-text rounded-lg hover:bg-surface-border transition-all disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

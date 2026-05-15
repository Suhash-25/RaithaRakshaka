import { useState, useEffect } from 'react'
import { Users, LogOut, Plus, ChevronDown } from 'lucide-react'
import { useStudent } from '@/context/StudentContext'
import { switchStudent, logoutStudent } from '@/services/studentManagement'
import PINAuthComponent from '@/components/auth/PINAuthComponent'

/**
 * StudentSwitcher - Dropdown component to switch between students
 * Shows in header for quick access on shared devices
 */
export default function StudentSwitcher() {
  const { currentStudent, allStudents, refreshStudentList } = useStudent()
  const [isOpen, setIsOpen] = useState(false)
  const [showPINAuth, setShowPINAuth] = useState(false)
  const [selectedStudentForSwitch, setSelectedStudentForSwitch] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.currentTarget.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const handleSwitchStudent = (student) => {
    setSelectedStudentForSwitch(student)
    setShowPINAuth(true)
  }

  const handlePINSuccess = async (pin) => {
    setIsLoading(true)
    try {
      await switchStudent(selectedStudentForSwitch.id, pin)
      setShowPINAuth(false)
      setIsOpen(false)
      await refreshStudentList()
      window.location.href = '/selection' // Redirect to main page
    } catch (error) {
      console.error('Switch student failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutStudent()
    window.location.href = '/login'
  }

  if (!currentStudent) {
    return null
  }

  const otherStudents = allStudents.filter(s => s.id !== currentStudent.id)

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-surface-border hover:bg-surface-border transition-colors"
      >
        <Users size={18} className="text-primary-500" />
        <span className="text-sm font-medium text-surface-text max-w-[150px] truncate">
          {currentStudent.name}
        </span>
        <ChevronDown size={16} className={`text-surface-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-card border border-surface-border rounded-lg shadow-xl z-40 overflow-hidden">
          {/* Current Student Info */}
          <div className="p-3 bg-primary-500/10 border-b border-surface-border">
            <p className="text-xs text-surface-muted">Current Student</p>
            <p className="text-sm font-semibold text-surface-text">{currentStudent.name}</p>
            <p className="text-xs text-surface-muted">Class {currentStudent.class}</p>
          </div>

          {/* Other Students */}
          {otherStudents.length > 0 && (
            <div>
              <p className="px-3 pt-3 pb-1 text-xs font-medium text-surface-muted uppercase">Switch to</p>
              {otherStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleSwitchStudent(student)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-left hover:bg-surface-border transition-colors text-sm text-surface-text disabled:opacity-50"
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-surface-muted">Class {student.class}</p>
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-surface-border my-1" />

          {/* Add New Student */}
          <a
            href="/register-student"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-border transition-colors text-sm text-primary-500 font-medium"
          >
            <Plus size={16} />
            Add New Student
          </a>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-500/10 transition-colors text-sm text-red-500 font-medium border-t border-surface-border"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      {/* PIN Auth Modal */}
      {showPINAuth && selectedStudentForSwitch && (
        <PINAuthComponent
          studentId={selectedStudentForSwitch.id}
          studentName={selectedStudentForSwitch.name}
          purpose="switch"
          onSuccess={handlePINSuccess}
          onCancel={() => setShowPINAuth(false)}
        />
      )}
    </div>
  )
}

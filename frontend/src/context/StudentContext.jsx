import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getCurrentStudent, listStudents } from '@/services/studentManagement'

const StudentContext = createContext(null)

/**
 * StudentProvider - manages current student and list of students on device
 */
export function StudentProvider({ children }) {
  const [currentStudent, setCurrentStudent] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [isLoadingStudent, setIsLoadingStudent] = useState(true)
  const [studentError, setStudentError] = useState(null)

  // Load current student on mount
  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        setIsLoadingStudent(true)
        
        // Check if student is already logged in
        const student = await getCurrentStudent()
        if (active) {
          setCurrentStudent(student)
        }
        
        // Load all students for switcher UI
        const students = await listStudents()
        if (active) {
          setAllStudents(students)
        }
      } catch (error) {
        if (active) {
          setStudentError(error.message)
        }
      } finally {
        if (active) {
          setIsLoadingStudent(false)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  const updateCurrentStudent = useCallback((student) => {
    setCurrentStudent(student)
  }, [])

  const refreshStudentList = useCallback(async () => {
    try {
      const students = await listStudents()
      setAllStudents(students)
    } catch (error) {
      setStudentError(error.message)
    }
  }, [])

  const value = {
    currentStudent,
    allStudents,
    isLoadingStudent,
    studentError,
    updateCurrentStudent,
    refreshStudentList,
  }

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  )
}

/**
 * Hook to use student context
 */
export function useStudent() {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudent must be used inside StudentProvider')
  }
  return context
}

export default StudentContext

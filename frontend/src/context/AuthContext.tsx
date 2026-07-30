import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/types/domain'
import {
  login as apiLogin,
  getMe,
  getToken,
  setToken,
} from '@/api/client'
import { useIdleLogout } from '@/hooks/useIdleLogout'

interface AuthContextValue {
  currentUser: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function requestNotificationPermissionIfNeeded() {
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission()
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()

    if (token) {
      getMe()
        .then((user) => {
          setCurrentUser(user)
          requestNotificationPermissionIfNeeded()
        })
        .catch(() => {
          setToken(null)
          setCurrentUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    const { token, user } = await apiLogin(email, password)

    setToken(token)
    setCurrentUser(user)
    requestNotificationPermissionIfNeeded()
  }

  const logout = useCallback(() => {
    setToken(null)
    setCurrentUser(null)
  }, [])

  useIdleLogout({
    enabled: currentUser !== null,
    onLogout: logout,
  })

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth phải dùng trong AuthProvider')
  }

  return ctx
}

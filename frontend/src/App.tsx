import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./store/authStore"
import { usePreferencesStore } from "./store/preferencesStore"
import { AppLayout } from "./components/Layout/AppLayout"
import Login from "./pages/Login"
import Accounts from "./pages/Accounts"
import KeyManagement from "./pages/KeyManagement"
import ModelList from "./pages/ModelList"
import DataBackup from "./pages/DataBackup"
import AutoCheckin from "./pages/AutoCheckin"

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore()
  const { loadPreferences } = usePreferencesStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences()
    }
  }, [isAuthenticated, loadPreferences])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/accounts" replace /> : <Login />}
        />
        <Route
          path="/accounts"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Accounts />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/keys"
          element={
            isAuthenticated ? (
              <AppLayout>
                <KeyManagement />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/models"
          element={
            isAuthenticated ? (
              <AppLayout>
                <ModelList />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/data-backup"
          element={
            isAuthenticated ? (
              <AppLayout>
                <DataBackup />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/auto-checkin"
          element={
            isAuthenticated ? (
              <AppLayout>
                <AutoCheckin />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to="/accounts" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App


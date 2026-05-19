import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/AppShell'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PracticePage from './pages/PracticePage'
import DrillPage from './pages/DrillPage'
import SimulationPage from './pages/SimulationPage'
import WeakSpotPage from './pages/WeakSpotPage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UpgradePage from './pages/UpgradePage'
import AccountPage from './pages/AccountPage'
import SuccessPage from './pages/SuccessPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <Routes>
            {/* Public routes — no shell */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />

            {/* Authenticated shell layout */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/drill" element={
                <ProtectedRoute requirePro><DrillPage /></ProtectedRoute>
              } />
              <Route path="/simulation" element={
                <ProtectedRoute requirePro><SimulationPage /></ProtectedRoute>
              } />
              <Route path="/weakspot" element={
                <ProtectedRoute requirePro><WeakSpotPage /></ProtectedRoute>
              } />
              <Route path="/results/:sessionId" element={<ResultsPage />} />
              <Route path="/analytics" element={
                <ProtectedRoute requirePro><AnalyticsPage /></ProtectedRoute>
              } />
              <Route path="/upgrade" element={<UpgradePage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/success" element={<SuccessPage />} />
            </Route>
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

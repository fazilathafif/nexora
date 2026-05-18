import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { isSupabaseConfigured } from './lib/supabase.js'
import LandingPage         from './pages/LandingPage.jsx'
import HomePage            from './pages/HomePage.jsx'
import QuizPage            from './pages/QuizPage.jsx'
import MockPage            from './pages/MockPage.jsx'
import ResultPage          from './pages/ResultPage.jsx'
import ProgressPage        from './pages/ProgressPage.jsx'
import TeacherPage         from './pages/TeacherPage.jsx'
import AuthGate            from './pages/AuthGate.jsx'
import SysAdminPage        from './pages/SysAdminPage.jsx'
import UpdatePasswordPage  from './pages/UpdatePasswordPage.jsx'
import LoadingSpinner      from './components/LoadingSpinner.jsx'

export default function App() {
  const { user, profile, loading, refreshProfile, signOut, isPasswordRecovery } = useAuth()

  if (loading) return <LoadingSpinner />

  // Password reset flow — show update form regardless of auth state
  if (isPasswordRecovery) return <UpdatePasswordPage />

  // Require sign-in when Supabase is configured
  if (isSupabaseConfigured && !user) return <AuthGate />

  return (
    <Routes>
      {/* Public */}
      <Route path="/teacher/:token" element={<TeacherPage />} />
      <Route path="/admin" element={<SysAdminPage user={user} />} />

      {/* Stream selection */}
      <Route path="/" element={
        profile?.stream
          ? <Navigate to={`/${profile.stream}`} replace />
          : <LandingPage user={user} profile={profile} refreshProfile={refreshProfile} />
      } />

      {/* App — stream-aware */}
      <Route path="/:stream" element={
        <HomePage user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut} />
      } />
      <Route path="/:stream/quiz/:subject" element={
        <QuizPage user={user} profile={profile} refreshProfile={refreshProfile} />
      } />
      <Route path="/:stream/mock/:subject" element={
        <MockPage user={user} profile={profile} refreshProfile={refreshProfile} />
      } />
      <Route path="/:stream/result" element={
        <ResultPage user={user} profile={profile} />
      } />
      <Route path="/:stream/progress" element={
        <ProgressPage user={user} profile={profile} />
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

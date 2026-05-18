import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import LandingPage   from './pages/LandingPage.jsx'
import HomePage      from './pages/HomePage.jsx'
import QuizPage      from './pages/QuizPage.jsx'
import ResultPage    from './pages/ResultPage.jsx'
import ProgressPage  from './pages/ProgressPage.jsx'
import TeacherPage   from './pages/TeacherPage.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
    <Routes>
      {/* Public */}
      <Route path="/teacher/:token" element={<TeacherPage />} />

      {/* Stream selection */}
      <Route path="/" element={
        profile?.stream
          ? <Navigate to={`/${profile.stream}`} replace />
          : <LandingPage user={user} profile={profile} refreshProfile={refreshProfile} />
      } />

      {/* App — stream-aware */}
      <Route path="/:stream" element={
        <HomePage user={user} profile={profile} refreshProfile={refreshProfile} />
      } />
      <Route path="/:stream/quiz/:subject" element={
        <QuizPage user={user} profile={profile} refreshProfile={refreshProfile} />
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

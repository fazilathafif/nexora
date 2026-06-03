import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useTheme } from './hooks/useTheme.js'
import { getPreferences } from './lib/db.js'
import { applyPreferences, PREF_DEFAULTS } from './lib/preferences.js'
import { isSupabaseConfigured } from './lib/supabase.js'
import { trialDaysLeft } from './lib/subscription.js'
import LandingPage         from './pages/LandingPage.jsx'
import StreamOnboarding    from './pages/StreamOnboarding.jsx'
import HomePage            from './pages/HomePage.jsx'
import QuizPage            from './pages/QuizPage.jsx'
import MockPage            from './pages/MockPage.jsx'
import ResultPage          from './pages/ResultPage.jsx'
import ProgressPage        from './pages/ProgressPage.jsx'
import TeacherPage         from './pages/TeacherPage.jsx'
import AuthGate            from './pages/AuthGate.jsx'
import SysAdminPage        from './pages/SysAdminPage.jsx'
import UpdatePasswordPage  from './pages/UpdatePasswordPage.jsx'
import StudyPlanPage       from './pages/StudyPlanPage.jsx'
import FlashcardsPage      from './pages/FlashcardsPage.jsx'
import MatchPage           from './pages/MatchPage.jsx'
import LearnPage           from './pages/LearnPage.jsx'
import WellbeingPage       from './pages/WellbeingPage.jsx'
import LeaderboardPage     from './pages/LeaderboardPage.jsx'
import SettingsPage        from './pages/SettingsPage.jsx'
import SubscriptionPage    from './pages/SubscriptionPage.jsx'
import ResourcesPage      from './pages/ResourcesPage.jsx'
import TodayPage           from './pages/TodayPage.jsx'
import LearnHubPage        from './pages/LearnHubPage.jsx'
import IBSandboxPage       from './pages/IBSandboxPage.jsx'
import GroupDashboardPage  from './pages/GroupDashboardPage.jsx'
import JoinPage            from './pages/JoinPage.jsx'
import SwitchTrackPage     from './pages/SwitchTrackPage.jsx'
import PrivacyPage         from './pages/PrivacyPage.jsx'
import TermsPage           from './pages/TermsPage.jsx'
import LoadingSpinner      from './components/LoadingSpinner.jsx'
import PomodoroTimer       from './components/PomodoroTimer.jsx'
import BottomNav           from './components/BottomNav.jsx'

export default function App() {
  const { user, profile, loading, refreshProfile, signOut, isPasswordRecovery } = useAuth()
  const { isDark } = useTheme()
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!user?.id) return
    getPreferences(user.id).then(({ data }) => {
      applyPreferences({ ...PREF_DEFAULTS, ...(data ?? {}) })
    }).catch(() => {})
  }, [user?.id])

  if (loading) return <LoadingSpinner />

  // Legal pages are publicly accessible — no auth required
  if (location.pathname === '/privacy') return <PrivacyPage />
  if (location.pathname === '/terms')   return <TermsPage />

  // Password reset flow — show update form regardless of auth state
  if (isPasswordRecovery) return <UpdatePasswordPage />

  // Require sign-in when Supabase is configured (explore mode bypasses auth gate)
  if (isSupabaseConfigured && !user && sessionStorage.getItem('nx_explore') !== '1') return <AuthGate />

  // First-time user — no track chosen yet; redirect to the redesigned landing page
  const isExplore = sessionStorage.getItem('nx_explore') === '1'
  if (!isExplore && user && profile && !profile.active_stream && !profile.stream) {
    if (location.pathname !== '/landing') {
      return <Navigate to="/landing" replace />
    }
  }

  const VALID_STREAMS = ['gcse','alevel','sat','act','ap','psat','igcse','ib']
  const showNav = VALID_STREAMS.some(s => location.pathname.startsWith(`/${s}`))
  const activeStream = profile?.active_stream ?? profile?.stream

  // Trial-expired redirect — shown once per session so users can still navigate freely
  const trialJustExpired = profile?.plan === 'trial' && trialDaysLeft(profile) === 0
  const onSubscriptionPage = location.pathname.includes('/subscription')
  const trialRedirectDone  = sessionStorage.getItem('nx_trial_redirect') === '1'
  if (trialJustExpired && activeStream && !onSubscriptionPage && !trialRedirectDone) {
    sessionStorage.setItem('nx_trial_redirect', '1')
    return <Navigate to={`/${activeStream}/subscription?reason=trial_expired`} replace />
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/teacher/:token" element={<TeacherPage />} />
        <Route path="/admin" element={<SysAdminPage user={user} />} />

        {/* Stream selection */}
        <Route path="/" element={
          activeStream
            ? <Navigate to={`/${activeStream}`} replace />
            : <LandingPage user={user} profile={profile} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/landing" element={
          <LandingPage user={user} profile={profile} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/switch" element={
          <SwitchTrackPage profile={profile} />
        } />

        {/* App — stream-aware */}
        <Route path="/:stream" element={
          <HomePage user={user} profile={profile} refreshProfile={refreshProfile} signOut={signOut}
            startPomodoro={() => setPomodoroActive(true)} isDark={isDark} />
        } />
        <Route path="/:stream/quiz/:subject" element={
          <QuizPage user={user} profile={profile} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/:stream/mock/:subject" element={
          <MockPage user={user} profile={profile} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/:stream/result" element={
          <ResultPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/progress" element={
          <ProgressPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/plan" element={
          <StudyPlanPage user={user} profile={profile} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/:stream/today" element={
          <TodayPage user={user} profile={profile} isDark={isDark} />
        } />
        {/* Merged Learn Hub — replaces Practice + My Learning in nav */}
        <Route path="/:stream/learn-hub" element={
          <LearnHubPage user={user} profile={profile} isDark={isDark} signOut={signOut} />
        } />
        <Route path="/ib/sandbox" element={
          <IBSandboxPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/flashcards/:subject" element={
          <FlashcardsPage profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/match/:subject" element={
          <MatchPage isDark={isDark} />
        } />
        <Route path="/:stream/learn/:subject" element={
          <LearnPage profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/wellbeing" element={
          <WellbeingPage isDark={isDark} />
        } />
        <Route path="/:stream/leaderboard" element={
          <LeaderboardPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/settings" element={
          <SettingsPage user={user} profile={profile} signOut={signOut} refreshProfile={refreshProfile} isDark={isDark} />
        } />
        <Route path="/:stream/subscription" element={
          <SubscriptionPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/:stream/resources" element={
          <ResourcesPage user={user} profile={profile} isDark={isDark} signOut={signOut} />
        } />

        {/* Group / Invite routes */}
        <Route path="/group/dashboard" element={
          <GroupDashboardPage user={user} profile={profile} isDark={isDark} />
        } />
        <Route path="/join/:token" element={
          <JoinPage user={user} />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <PomodoroTimer active={pomodoroActive} setActive={setPomodoroActive} />
      {showNav && <BottomNav />}
    </>
  )
}

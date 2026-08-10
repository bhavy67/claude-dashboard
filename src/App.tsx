import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { SplashScreen } from '@/components/splash-screen';
import { DashboardPage } from '@/pages/dashboard-page';
import { SessionsPage } from '@/pages/sessions-page';
import { SessionDetailPage } from '@/pages/session-detail-page';
import { ProjectsPage } from '@/pages/projects-page';
import { AnalyticsPage } from '@/pages/analytics-page';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/:id" element={<SessionDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

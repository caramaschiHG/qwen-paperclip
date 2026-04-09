import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { AgentsPage } from './pages/AgentsPage';
import { TasksPage } from './pages/TasksPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { OrgChartPage } from './pages/OrgChartPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const companies = await api.getCompanies();
      setIsOnboarded(companies.length > 0);
    } catch {
      setIsOnboarded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isOnboarded) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Setup from './components/Setup';
import Header from './components/Header';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import IssueForm from './components/IssueForm';
import Toast from './components/Toast';

function AppRoutes() {
  const { config } = useApp();

  if (!config) {
    return <Setup />;
  }

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<IssueList />} />
          <Route path="/new" element={<IssueForm />} />
          <Route path="/issue/:number" element={<IssueDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

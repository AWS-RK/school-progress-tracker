import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import TabBar from './components/TabBar';
import Fab from './components/Fab';
import Home from './screens/Home';
import Timeline from './screens/Timeline';
import Goals from './screens/Goals';
import Profile from './screens/Profile';
import DomainDetail from './screens/DomainDetail';
import AddEntry from './screens/AddEntry';
import ShareInvite from './screens/ShareInvite';

// Fixed seed profile id from supabase/migrations/0001_init.sql.
// Revisit if the app grows to support multiple children.
export const PROFILE_ID = 'a0000000-0000-0000-0000-000000000000';

function TabbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      {children}
      <Fab />
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequireAuth>
        <Routes>
          <Route path="/" element={<TabbedLayout><Home /></TabbedLayout>} />
          <Route path="/timeline" element={<TabbedLayout><Timeline /></TabbedLayout>} />
          <Route path="/goals" element={<TabbedLayout><Goals /></TabbedLayout>} />
          <Route path="/profile" element={<TabbedLayout><Profile /></TabbedLayout>} />
          <Route path="/domain/:domainId" element={<div className="app-shell"><DomainDetail /></div>} />
          <Route path="/add" element={<div className="app-shell"><AddEntry /></div>} />
          <Route path="/share" element={<div className="app-shell"><ShareInvite /></div>} />
        </Routes>
      </RequireAuth>
    </AuthProvider>
  );
}

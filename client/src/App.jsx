import { Routes, Route, Navigate } from 'react-router-dom';
import CommitPage from './pages/CommitPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/repositories/:owner/:repo/commit/:sha" element={<CommitPage />} />
      <Route
        path="/"
        element={
          <Navigate to="/repositories/octocat/Hello-World/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d" replace />
        }
      />
      <Route path="*" element={<div className="not-found">Page not found.</div>} />
    </Routes>
  );
}

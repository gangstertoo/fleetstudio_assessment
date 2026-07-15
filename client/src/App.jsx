import { Routes, Route, Navigate } from 'react-router-dom';
import CommitPage from './pages/CommitPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/repositories/:owner/:repo/commit/:sha" element={<CommitPage />} />
      <Route
        path="/"
        element={
          <Navigate to="/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f" replace />
        }
      />
      <Route path="*" element={<div className="not-found">Page not found.</div>} />
    </Routes>
  );
}

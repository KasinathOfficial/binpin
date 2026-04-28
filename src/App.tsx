import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { trackPageView } from './lib/tracker';
import MainApp from './MainApp';
import AdminDashboard from './admin/Dashboard';
import AdminLogin from './admin/AdminLogin';
import ManageBins from './admin/ManageBins';
import ManageRequests from './admin/ManageRequests';
import ManageFeedback from './admin/ManageFeedback';
import SubmitAction from './pages/SubmitAction';
import TransparencyBoard from './pages/TransparencyBoard';
import MunicipalDashboard from './pages/MunicipalDashboard';

function App() {
  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        
        {/* Admin Section */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bins" element={<ManageBins />} />
        <Route path="/admin/requests" element={<ManageRequests />} />
        <Route path="/admin/comments" element={<ManageFeedback />} />
        <Route path="/admin/feedback" element={<ManageFeedback />} />

        <Route path="/submit-action/:id" element={<SubmitAction />} />
        <Route path="/transparency" element={<TransparencyBoard />} />
        <Route path="/municipal" element={<MunicipalDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

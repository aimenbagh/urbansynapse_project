import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TerritorialAnalysisPage from "./pages/TerritorialAnalysisPage";
import SimulationPage from "./pages/SimulationPage";
import MulticriteriaPage from "./pages/MulticriteriaPage";
import ForesightPage from "./pages/ForesightPage";
import DataEntryPage from "./pages/DataEntryPage";
import WilayaProfilePage from "./pages/WilayaProfilePage";
import DocumentsPage from "./pages/DocumentsPage";
import UsersPage from "./pages/UsersPage";
import ComparePage from "./pages/ComparePage";
import AboutPage from "./pages/AboutPage";
import MobilityPage from "./pages/MobilityPage";
import ResiliencePage from "./pages/ResiliencePage";
import EnergyPage from "./pages/EnergyPage";
import RisksPage from "./pages/RisksPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analyse-territoriale" element={<TerritorialAnalysisPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/multicritere" element={<MulticriteriaPage />} />
          <Route path="/prospective" element={<ForesightPage />} />
          <Route path="/ajouter" element={<DataEntryPage />} />
          <Route path="/wilaya/:id" element={<WilayaProfilePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/utilisateurs" element={<UsersPage />} />
          <Route path="/comparer" element={<ComparePage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/mobilite" element={<MobilityPage />} />
          <Route path="/resilience" element={<ResiliencePage />} />
          <Route path="/energie" element={<EnergyPage />} />
          <Route path="/risques" element={<RisksPage />} />
          <Route path="/rapports" element={<ReportsPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

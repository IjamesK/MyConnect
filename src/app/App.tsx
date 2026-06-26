import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LoginScreen } from "./components/screens/LoginScreen";
import { CustomerDashboard } from "./components/screens/CustomerDashboard";
import { ServiceStatus } from "./components/screens/ServiceStatus";
import { OutageDetails } from "./components/screens/OutageDetails";
import { Troubleshooter } from "./components/screens/Troubleshooter";
import { ZTEDiagnostic } from "./components/screens/ZTEDiagnostic";
import { DiagnosisResult } from "./components/screens/DiagnosisResult";
import { SubscriptionPage } from "./components/screens/SubscriptionPage";
import { RenewalInstructions } from "./components/screens/RenewalInstructions";
import { ReportIssue } from "./components/screens/ReportIssue";
import { TicketTracking } from "./components/screens/TicketTracking";
import { NotificationsCenter } from "./components/screens/NotificationsCenter";
import { StaffDashboard } from "./components/screens/StaffDashboard";
import { OutageManagement } from "./components/screens/OutageManagement";
import { AnalyticsDashboard } from "./components/screens/AnalyticsDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginScreen />} />

        {/* Customer portal */}
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/service-status" element={<ServiceStatus />} />
        <Route path="/outage/:id" element={<OutageDetails />} />
        <Route path="/troubleshoot" element={<Troubleshooter />} />
        <Route path="/troubleshoot/zte" element={<ZTEDiagnostic />} />
        <Route path="/troubleshoot/result" element={<DiagnosisResult />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/renewal" element={<RenewalInstructions />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/ticket/:id" element={<TicketTracking />} />
        <Route path="/notifications" element={<NotificationsCenter />} />

        {/* Staff portal */}
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/outages" element={<OutageManagement />} />
        <Route path="/staff/analytics" element={<AnalyticsDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

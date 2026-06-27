import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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
import { StaffTickets } from "./components/screens/StaffTickets";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginScreen />} />

        {/* Customer portal */}
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <CustomerDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/service-status"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <ServiceStatus />
    </ProtectedRoute>
  }
/>

<Route
  path="/outage/:id"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <OutageDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/troubleshoot"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <Troubleshooter />
    </ProtectedRoute>
  }
/>

<Route
  path="/troubleshoot/zte"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <ZTEDiagnostic />
    </ProtectedRoute>
  }
/>

<Route
  path="/troubleshoot/result"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <DiagnosisResult />
    </ProtectedRoute>
  }
/>

<Route
  path="/subscription"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <SubscriptionPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/renewal"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <RenewalInstructions />
    </ProtectedRoute>
  }
/>

<Route
  path="/report-issue"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <ReportIssue />
    </ProtectedRoute>
  }
/>

<Route
  path="/ticket/:id"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <TicketTracking />
    </ProtectedRoute>
  }
/>

<Route
  path="/notifications"
  element={
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <NotificationsCenter />
    </ProtectedRoute>
  }
/>

        {/* Staff portal */}
<Route
  path="/staff"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <StaffDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/staff/outages"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <OutageManagement />
    </ProtectedRoute>
  }
/>

<Route
  path="/staff/analytics"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <AnalyticsDashboard />
    </ProtectedRoute>
  }
/>

       <Route
  path="/staff/tickets"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <StaffTickets />
    </ProtectedRoute>
  }
/> 

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

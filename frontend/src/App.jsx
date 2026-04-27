import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminPage from "./pages/AdminPage";
import HrPage from "./pages/HrPage";
import HrCreateUserPage from "./pages/HrCreateUserPage";
import HrAttendancePage from "./pages/HrAttendancePage";
import HrPersonalDetailsPage from "./pages/HrPersonalDetailsPage";
import FrontendPage from "./pages/FrontendPage";
import TmcPage from "./pages/TmcPage";
import DataSheetMenuPage from "./pages/DataSheetMenuPage";
import DataSheetSubPage from "./pages/DataSheetSubPage";
import MainDataPage from "./pages/MainDataPage";
import CallDetailsPage from "./pages/CallDetailsPage";
import PresentationDetailsPage from "./pages/PresentationDetailsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentVisitedPage from "./pages/AppointmentVisitedPage";
import FormsPage from "./pages/FormsPage";
import GoalsPage from "./pages/GoalsPage";
import HrAttendanceSummaryPage from "./pages/HrAttendanceSummaryPage";
import HrMonthlyPerformancePage from "./pages/HrMonthlyPerformancePage";
import FrontendProfilePage from "./pages/FrontendProfilePage";
import WebsiteDeveloperPage from "./pages/WebsiteDeveloperPage";
import WebsiteBusinessesPage from "./pages/WebsiteBusinessPage";
import WebsiteProjectPlannerPage from "./pages/WebsiteProjectPlannerPage";
import DigitalMarketingWorkPlannerPage from "./pages/DigitalMarketingWorkPlannerPage";
import DigitalMarketingBusinessesPage from "./pages/DigitalMarketingBusinessesPage";
import DigitalMarketingPage from "./pages/DigitalMarketingPage";
import FrontendLayout from "./pages/FrontendLayout";
import CallbackAppointmentsPage from "./pages/CallbackAppointmentsPage";
import RejectedAppointmentsPage from "./pages/RejectedAppointmentsPage";
import CrmPage from "./pages/CrmPage";
import CrmLayout from "./pages/CrmLayout";
import OptimizationPage from "./pages/OptimizationPage";
import PhotoshootPage from "./pages/PhotoshootPage";
import ContactNumberPage from "./pages/ContactNumberPage";
import SuspendedPage from "./pages/SuspendedPage";
import PageHandlingPage from "./pages/PageHandlingPage";
import GmbProfilePage from "./pages/GmbProfilePage";
import GoogleOtherServicesPage from "./pages/GoogleOtherServicesPage";
import HrTmcPage from "./pages/HrTmcPage";
import HrCallSummary from "./pages/HrCallSummary";
import AdminUsers from "./pages/AdminUsers";
import AdminAttendance from "./pages/AdminAttendance";
import AdminPerformance from "./pages/AdminPerformance";
import AdminBusinessDetails from "./pages/AdminBusinessDetails";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BaUpdatePage from "./pages/BaUpdatePage";
import AdminCallingDataPage from "./pages/AdminCallingDataPage";
import BaCallingDataPage from "./pages/BaCallingDataPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPage />}>
          {/* <Route index element={<AdminDashboard />} /> */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="/admin/performance" element={<AdminPerformance />} />
          <Route path="/admin/business-details" element={<AdminBusinessDetails />} />
          <Route path="calling-data" element={<AdminCallingDataPage />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          {/* HR */}
          <Route path="/hr" element={<ProtectedRoute><RoleRoute allowedRoles={["hr"]}><HrPage /></RoleRoute></ProtectedRoute>}>
          <Route index element={<div />} />
          <Route path="attendance" element={<HrAttendancePage />} />
          <Route path="create-user" element={<HrCreateUserPage />} />
          <Route path="personal-details" element={<HrPersonalDetailsPage />} />
          <Route path="attendance-summary" element={<HrAttendanceSummaryPage />} />
          <Route path="tmc" element={<HrTmcPage />} />
           <Route path="call-summary" element={<HrCallSummary />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          {/* Frontend */}
          <Route path="/ba" element={<ProtectedRoute><RoleRoute allowedRoles={["ba"]}><FrontendLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<FrontendPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="tmc" element={<TmcPage />} />
          <Route path="data-sheet" element={<DataSheetMenuPage />} />
          <Route path="data-sheet/:pageId" element={<DataSheetSubPage />} />
          <Route path="data-sheet/main-data" element={<MainDataPage />} />
          <Route path="data-sheet/call-details" element={<CallDetailsPage />} />
          <Route path="data-sheet/presentation-details" element={<PresentationDetailsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="callback-appointments" element={<CallbackAppointmentsPage />} />
          <Route path="rejected-appointments" element={<RejectedAppointmentsPage />} />
          <Route path="visited-appointments" element={<AppointmentVisitedPage />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="/ba/updates" element={<BaUpdatePage />} />
          <Route path="calling-data" element={<BaCallingDataPage />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          {/* Backend */}

          <Route path="/crm" element={<ProtectedRoute><RoleRoute allowedRoles={["crm"]}><CrmLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<CrmPage />} />
          <Route path="gmb-profile" element={<GmbProfilePage />} />
          <Route path="optimization" element={<OptimizationPage />} />
          <Route path="photoshoot" element={<PhotoshootPage />} />
          <Route path="contact-number" element={<ContactNumberPage />} />
          <Route path="suspended-page" element={<SuspendedPage />} />
          <Route path="page-handling" element={<PageHandlingPage />} />
          <Route path="google-other-services" element={<GoogleOtherServicesPage />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          <Route path="/website-developer" element={<WebsiteDeveloperPage />}>
          <Route path="businesses" element={<WebsiteBusinessesPage />} />
          <Route path="project-planner" element={<WebsiteProjectPlannerPage />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          <Route path="/digital-marketing" element={<DigitalMarketingPage />}>
          <Route path="businesses" element={<DigitalMarketingBusinessesPage />} />
          <Route path="work-planner" element={<DigitalMarketingWorkPlannerPage />} />
          <Route path="my-profile" element={<FrontendProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
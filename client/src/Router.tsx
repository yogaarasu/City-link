import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import { AuthLayout } from "./layout/AuthLayout";
import { OtpVerification } from "./pages/auth/OTPVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ForgotPasswordVerify from "./pages/auth/ForgotPasswordVerify";
import ResetPassword from "./pages/auth/ResetPassword";
import { ProtectedRoute } from "./modules/auth/components/ProtectedRoute";
import CitizenLayout from "./modules/citizen/layout/CitizenLayout";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ReportIssue from "./pages/citizen/ReportIssue";
import CommunityIssues from "./pages/citizen/CommunityIssues";
import Profile from "./pages/citizen/Profile";
import Settings from "./pages/citizen/Settings";
import RoleDashboardPlaceholder from "./pages/admin/RoleDashboardPlaceholder";
import SuperAdminLayout from "./modules/super-admin/layout/SuperAdminLayout";
import SystemOverviewPage from "./pages/super-admin/SystemOverview";
import ManageCityAdminsPage from "./pages/super-admin/ManageCityAdmins";
import CityIssueDetailsPage from "./pages/super-admin/CityIssueDetails";
import CityAdminDetailsPage from "./pages/super-admin/CityAdminDetails";
import CityAdminEditPage from "./pages/super-admin/CityAdminEdit";
import CityDistrictAdminsPage from "./pages/super-admin/CityDistrictAdmins";
import SuperAdminSettingsPage from "./pages/super-admin/SuperAdminSettings";
import SuperAdminProfilePage from "./pages/super-admin/SuperAdminProfile";

const Router = () => {
  const routes = createBrowserRouter([
    { path: "/", element: <Home /> },
    {
      path: "/auth", element: <AuthLayout />, children: [
        { path: "login", element: <Login /> },
        { path: "signup", element: <Signup /> },
        { path: "otp", element: <OtpVerification /> },
        { path: "forgot-password", element: <ForgotPassword /> },
        { path: "forgot-password/verify", element: <ForgotPasswordVerify /> },
        { path: "forgot-password/reset", element: <ResetPassword /> },
      ]
    },
    {
      path: "/citizen",
      element: (
        <ProtectedRoute allowedRoles={["citizen"]}>
          <CitizenLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "dashboard", element: <CitizenDashboard /> },
        { path: "report-issue", element: <ReportIssue /> },
        { path: "community-issues", element: <CommunityIssues /> },
        { path: "profile", element: <Profile /> },
        { path: "settings", element: <Settings /> },
      ],
    },
    {
      path: "/city-admin/dashboard",
      element: (
        <ProtectedRoute allowedRoles={["city_admin"]}>
          <RoleDashboardPlaceholder title="City Admin Dashboard" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/super-admin",
      element: (
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <SuperAdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "dashboard", element: <SystemOverviewPage /> },
        { path: "city-admins", element: <ManageCityAdminsPage /> },
        { path: "city-admins/:adminId", element: <CityAdminDetailsPage /> },
        { path: "city-admins/:adminId/edit", element: <CityAdminEditPage /> },
        { path: "cities/:district", element: <CityIssueDetailsPage /> },
        { path: "cities/:district/admins", element: <CityDistrictAdminsPage /> },
        { path: "settings", element: <SuperAdminSettingsPage /> },
        { path: "profile", element: <SuperAdminProfilePage /> },
      ],
    },
    { path: "*", element: <PageNotFound /> },
  ]);

  return <RouterProvider router={routes} />
}

export default Router

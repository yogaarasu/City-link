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
import SuperAdminLayout from "./modules/super-admin/layout/SuperAdminLayout";
import SystemOverviewPage from "./pages/super-admin/SystemOverview";
import ManageCityAdminsPage from "./pages/super-admin/ManageCityAdmins";
import CityIssueDetailsPage from "./pages/super-admin/CityIssueDetails";
import CityEscalatedHistoryPage from "./pages/super-admin/CityEscalatedHistory";
import CityAdminDetailsPage from "./pages/super-admin/CityAdminDetails";
import CityAdminEditPage from "./pages/super-admin/CityAdminEdit";
import CityDistrictAdminsPage from "./pages/super-admin/CityDistrictAdmins";
import SuperAdminSettingsPage from "./pages/super-admin/SuperAdminSettings";
import SuperAdminProfilePage from "./pages/super-admin/SuperAdminProfile";
import CityAdminLayout from "./modules/city-admin/layout/CityAdminLayout";
import CityAdminDashboard from "./pages/city-admin/CityAdminDashboard";
import CityAdminManageIssues from "./pages/city-admin/CityAdminManageIssues";
import ErrorPage from "./pages/ErrorPage";

const Router = () => {
  const router = createBrowserRouter([
    { path: "/", element: <Home />, errorElement: <ErrorPage /> },
    {
      path: "/auth", element: <AuthLayout />, errorElement: <ErrorPage />, children: [
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
      errorElement: <ErrorPage />,
      children: [
        { path: "dashboard", element: <CitizenDashboard /> },
        { path: "report-issue", element: <ReportIssue /> },
        { path: "community-issues", element: <CommunityIssues /> },
        { path: "profile", element: <Profile /> },
        { path: "settings", element: <Settings /> },
      ],
    },
    {
      path: "/city-admin",
      element: (
        <ProtectedRoute allowedRoles={["city_admin"]}>
          <CityAdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        { path: "dashboard", element: <CityAdminDashboard /> },
        { path: "manage-issues", element: <CityAdminManageIssues /> },
        { path: "settings", element: <SuperAdminSettingsPage /> },
        { path: "profile", element: <SuperAdminProfilePage /> },
      ],
    },
    {
      path: "/super-admin",
      element: (
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <SuperAdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        { path: "dashboard", element: <SystemOverviewPage /> },
        { path: "city-admins", element: <ManageCityAdminsPage /> },
        { path: "city-admins/:adminId", element: <CityAdminDetailsPage /> },
        { path: "city-admins/:adminId/edit", element: <CityAdminEditPage /> },
        { path: "cities/:district", element: <CityIssueDetailsPage /> },
        { path: "cities/:district/escalated-history", element: <CityEscalatedHistoryPage /> },
        { path: "cities/:district/admins", element: <CityDistrictAdminsPage /> },
        { path: "settings", element: <SuperAdminSettingsPage /> },
        { path: "profile", element: <SuperAdminProfilePage /> },
      ],
    },
    { path: "*", element: <PageNotFound /> },
  ]);

  return <RouterProvider router={router} />
}

export default Router


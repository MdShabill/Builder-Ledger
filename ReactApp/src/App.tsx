// Path: src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/Authcontext";
import { SiteProvider } from "./context/Sitecontext";
import SessionCheck from "./components/Sessioncheck";
import RequireAuth from "./components/Requireauth";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NoSiteSelected from "./pages/Nositeselected";
import CostMasterList from "./pages/CostMaster/CostMasterList";
import CostMasterAdd from "./pages/CostMaster/CostMasterAdd";
import CostMasterEdit from "./pages/CostMaster/CostMasterEdit";
import SiteList from "./components/SiteList";
import SiteDetail from "./components/SiteDetail";
import SiteAdd from "./components/SiteAdd";
import SiteEdit from "./components/SiteEdit";
import DailyAttendanceList from "./pages/DailyAttendance/DailyAttendanceList";
import DailyAttendanceAdd from "./pages/DailyAttendance/DailyAttendanceAdd";
import MaterialPurchaseList from "./pages/MaterialPurchase/MaterialPurchaseList";
import MaterialPurchaseAdd from "./pages/MaterialPurchase/MaterialPurchaseAdd";
import ServiceProviderList from "./pages/ServiceProvider/ServiceProviderList";
import ServiceProviderAdd from "./pages/ServiceProvider/ServiceProviderAdd";
import ServiceProviderEdit from "./pages/ServiceProvider/ServiceProviderEdit";
import { APP_ROUTES } from "./constants/urls";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={APP_ROUTES.login} replace />;
  return <><Navbar /><main style={{ paddingTop: "68px" }}>{children}</main></>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path={APP_ROUTES.root} element={<Navigate to={user ? APP_ROUTES.home : APP_ROUTES.login} replace />} />
      <Route path={APP_ROUTES.login} element={user ? <Navigate to={APP_ROUTES.home} replace /> : <Login />} />

      <Route path={APP_ROUTES.home} element={<AppLayout><RequireAuth><Home /></RequireAuth></AppLayout>} />

      <Route path={APP_ROUTES.sites} element={<AppLayout><RequireAuth><SiteList /></RequireAuth></AppLayout>} />
      <Route path={APP_ROUTES.siteDetail} element={<AppLayout><RequireAuth><SiteDetail /></RequireAuth></AppLayout>} />
      <Route path={APP_ROUTES.siteAdd} element={<AppLayout><RequireAuth><SiteAdd /></RequireAuth></AppLayout>} />
      <Route path={APP_ROUTES.siteEdit} element={<AppLayout><RequireAuth><SiteEdit /></RequireAuth></AppLayout>} />
      <Route path={APP_ROUTES.noSiteSelected} element={<AppLayout><RequireAuth><NoSiteSelected /></RequireAuth></AppLayout>} />

      <Route path={APP_ROUTES.costMaster} element={<AppLayout><SessionCheck><CostMasterList /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.costMasterAdd} element={<AppLayout><SessionCheck><CostMasterAdd /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.costMasterEdit} element={<AppLayout><SessionCheck><CostMasterEdit /></SessionCheck></AppLayout>} />

      <Route path={APP_ROUTES.attendance} element={<AppLayout><SessionCheck><DailyAttendanceList /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.attendanceAdd} element={<AppLayout><SessionCheck><DailyAttendanceAdd /></SessionCheck></AppLayout>} />

      <Route path={APP_ROUTES.material} element={<AppLayout><SessionCheck><MaterialPurchaseList /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.materialAdd} element={<AppLayout><SessionCheck><MaterialPurchaseAdd /></SessionCheck></AppLayout>} />

      <Route path={APP_ROUTES.serviceProvider} element={<AppLayout><SessionCheck><ServiceProviderList /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.serviceProviderAdd} element={<AppLayout><SessionCheck><ServiceProviderAdd /></SessionCheck></AppLayout>} />
      <Route path={APP_ROUTES.serviceProviderEdit} element={<AppLayout><SessionCheck><ServiceProviderEdit /></SessionCheck></AppLayout>} />

      <Route path="*" element={<Navigate to={APP_ROUTES.login} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <AppRoutes />
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
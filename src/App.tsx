import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import type { AppRoute } from "./routes/route";
import { routes } from "./routes/route";
import { App as AntdApp, ConfigProvider } from "antd";
import theme from "./theme";
import useUserStore from "@/stores/userStore";
import { MobileProvider } from "@/provider";
import { navigation } from "@/utils/navigation";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  if (isLoggedIn) {
    return children;
  }
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
};

const NavigateSetter = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigation.navigate = navigate;
  }, [navigate]);
  return null;
};

const renderRoutes = (routes: AppRoute[]) => {
  return routes.map((route) => {
    const element = route.requiresAuth ? (
      <ProtectedRoute>
        <route.element />
      </ProtectedRoute>
    ) : (
      <route.element />
    );

    return (
      <Route key={route.path} path={route.path} element={element}>
        {route.children && renderRoutes(route.children)}
      </Route>
    );
  });
};

const App = () => {
  const BASENAME = import.meta.env.BASE_URL;

  // 创建全局 Agora 客户端（RTC 模式）
  const agoraClient = AgoraRTC.createClient({
    mode: "rtc",
    codec: "h264",
  });

  return (
    <BrowserRouter basename={BASENAME}>
      <NavigateSetter />
      <MobileProvider>
        <ConfigProvider theme={theme}>
          <AntdApp>
            <AgoraRTCProvider client={agoraClient}>
              <Routes>{renderRoutes(routes)}</Routes>
            </AgoraRTCProvider>
          </AntdApp>
        </ConfigProvider>
      </MobileProvider>
    </BrowserRouter>
  );
};

export default App;

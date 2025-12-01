import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import type { AppRoute } from "./routes/route";
import { routes } from "./routes/route";
import { App as AntdApp, ConfigProvider } from "antd";
import theme from "./theme";
import useUserStore from "@/stores/userStore";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLogined = useUserStore((s) => s.isLogined);
  if (isLogined) {
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

const renderRoutes = (routes: AppRoute[]) => {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        route.requiresAuth ? (
          <ProtectedRoute>
            <route.element />
          </ProtectedRoute>
        ) : (
          <route.element />
        )
      }
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ));
};

const App = () => {
  const BASENAME = import.meta.env.BASE_URL;
  return (
    <BrowserRouter basename={BASENAME}>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <Routes>{renderRoutes(routes)}</Routes>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;

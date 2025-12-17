import HomePage from "../pages/Home";
import LoginPage from "../pages/Login";
import LivePage from "../pages/Live";
import MainLayout from "../layouts/MainLayout";
import UserPage from "../pages/User";
export interface AppRoute {
  path: string;
  element: React.ComponentType;

  name?: string;
  requiresAuth?: boolean;
  children?: AppRoute[];
}

// 主布局下的子路由
export const mainRoutes: AppRoute[] = [
  {
    path: "/",
    element: HomePage,
    name: "home",
    requiresAuth: true,
  },
  {
    path: "/login",
    element: LoginPage,
    name: "login",
    requiresAuth: false,
  },
  {
    path: "/live",
    element: LivePage,
    name: "live",
    requiresAuth: true,
  },
  {
    path: "/user",
    element: UserPage,
    name: "user",
    requiresAuth: true,
  },
];

// 顶层路由
export const routes: AppRoute[] = [
  {
    path: "/",
    element: MainLayout,
    children: mainRoutes,
  },
];

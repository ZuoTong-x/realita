import type { NavigateFunction, NavigateOptions, To } from "react-router-dom";

/**
 * 这是一个单例对象，用于在非 React 组件/Hook 环境中（如 Axios 拦截器）进行路由跳转
 */
export const navigation = {
  navigate: null as NavigateFunction | null,

  push(to: To, options?: NavigateOptions) {
    if (this.navigate) {
      this.navigate(to, options);
    } else {
      // 如果还未初始化，回退到 window.location
      const path = typeof to === "string" ? to : to.pathname || "/";
      window.location.href = path;
    }
  },

  replace(to: To, options?: NavigateOptions) {
    this.push(to, { ...options, replace: true });
  },
};

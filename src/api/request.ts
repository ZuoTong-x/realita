import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError
} from "axios";
import { getToken } from "../utils/user_util";
import useUserStore from "../stores/userStore";
import { navigation } from "@/utils/navigation";
import { getRuntimeEnv } from "@/config/runtimeEnv";

// 创建 Axios 实例
const request: AxiosInstance = axios.create({
  baseURL: getRuntimeEnv().VITE_API_BASE, // runtime env first, fallback to build-time
  timeout: 10000 // 10 秒超时
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data.code === 401) {
      // 跳转登录页
      const userStore = useUserStore.getState();
      userStore.logoutStore(); // 清理用户状态
      navigation.replace("/login");
    }
    return response;
  },
  async (error: AxiosError) => {
    // 可以统一处理错误
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        console.error("请求超时！");
      } else if (error.response) {
        console.error("请求错误状态码：", error.response.status);
        const status = error.response.status;
        if (status === 401) {
          console.error("未授权访问，请登录后重试");

          const userStore = useUserStore.getState();
          userStore.logoutStore(); // 清理用户状态
          navigation.replace("/login");
        } else {
          console.error("请求错误状态码：", status);
        }
      } else {
        console.error("请求发生错误：", error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default request;

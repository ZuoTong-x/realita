import { useState } from "react";
import IconGoogle from "@/assets/svg/IconGoogle.svg?react";
import { useTranslation } from "react-i18next";
import { useGoogleLogin } from "@react-oauth/google";

import { signInWithGoogle } from "@/api";
import useUserStore from "@/stores/userStore";
import type { TokenInfo } from "@/types";
import { App } from "antd";
import { cn } from "@/utils/style_utils";
import { saveRefreshToken, saveToken } from "@/utils/user_util";

import useCountdown from "@/hooks/useCountdown";
import { useNavigate } from "react-router-dom";
import { useMobile } from "@/provider";

const LoginForm = () => {
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { loginStore } = useUserStore();
  const [formData, setFormData] = useState({ phone: "", captcha: "" });
  const [canLogin, setCanLogin] = useState(false);
  const [, setLogging] = useState(false);
  const [hasSendCaptcha] = useState(false);
  const [remainTime] = useCountdown(10);

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      verifyGLToken(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      console.log("Google 登录失败:", errorResponse);
      message.error(t("login_login_failed"));
      setLogging(false);
    },
    onNonOAuthError: (error) => {
      console.error("Google 取消授权:", error);
      setLogging(false);
    },
  });

  // 验证 Google Token
  const verifyGLToken = async (accessToken: string) => {
    try {
      const res = await signInWithGoogle(accessToken);
      if (res.code !== 200) {
        console.error("验证 Google Access Token 失败:", res.msg);
        return;
      }
      handleSuccessResp(res.data);
    } catch (error) {
      console.error("验证 Google Token 错误:", error);
      message.error(t("login_login_failed"));
    } finally {
      setLogging(false);
    }
  };

  // 登录成功后的处理
  const handleSuccessResp = (info: TokenInfo) => {
    saveToken(info.access_token);
    saveRefreshToken(info.refresh_token);
    loginStore();
    fetchUserInfos();
  };

  // 获取用户信息&积分信息
  const fetchUserInfos = async () => {
    // 获取用户积分信息

    console.log("Google 登录成功:");
    message.success(t("login_login_success"));
    navigate("/");
  };

  const handleGLClick = () => {
    message.loading(t("login_login_fetching"));
    setLogging(true);
    loginGoogle();
  };

  const handlePhoneLogin = async () => {
    // event.preventDefault(); // 阻止默认提交刷新页面
    // if (formData.phone === "") {
    //   message.warning(t("login_login_phone_placeholder"));
    //   return;
    // }
    // if (formData.captcha === "") {
    //   message.warning(t("login_login_captcha_placeholder"));
    //   return;
    // }
    // const tost = message.loading(t("login_login_fetching"));
    // setLogging(true);
    // try {
    //   const res = await verifyCaptcha(formData.phone, formData.captcha);
    //   if (res.code !== 200) {
    //     message.error(res.msg || t("login_login_failed"));
    //     return;
    //   }
    //   handleSuccessResp(res.data);
    // } catch (error) {
    //   console.error("手机号登录失败:", error);
    //   message.error(t("login_login_failed"));
    // } finally {
    //   setLogging(false);
    //   tost();
    // }
  };

  // 发送验证码
  const handleCaptchaClick = async () => {
    // if (formData.phone === "") {
    //   message.warning(t("login_login_phone_placeholder"));
    //   return;
    // }
    // if (disabled) {
    //   return;
    // }
    // try {
    //   const ret = await sendCaptcha(formData.phone);
    //   if (ret.code !== 200) {
    //     message.error(ret.msg || t("login.send_captcha_failed"));
    //     return;
    //   }
    //   const tost = message.loading(t("login.login_sending_captcha"), 0);
    //   tost();
    //   setHasSendCaptcha(true);
    //   message.success(t("login.login_captcha_sent"));
    //   startCountdown(ret.data.resend_delay_seconds);
    // } catch (error) {
    //   console.error("发送验证码失败:", error);
    //   message.error(t("login.send_captcha_failed"));
    // }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setCanLogin(
      name === "phone"
        ? value !== "" && formData.captcha !== ""
        : formData.phone !== "" && value !== ""
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className={cn("w-full", isMobile ? "max-w-[100%]" : "max-w-[320px]")}
      >
        <div className="flex flex-col gap-2 z-[20]">
          <span className="mx-auto text-3xl font-bold text-[#3B3D2C]">
            {t("login_login_welcome")}
          </span>
          <span className="text-sm font-normal text-[#3B3D2C] text-center mb-4">
            {t("login_login_continue")}
          </span>

          {/* 使用 Google 登录 */}
          <button
            className="mt-5 h-10 w-full flex gap-2 justify-center items-center rounded-xl bg-[#F5F5F1] border border-[#0000000D]"
            onClick={() => handleGLClick()}
          >
            <IconGoogle className="w-5 h-5" />
            <span className="text-sm font-medium text-[#3B3D2C]">
              {t("login_login_google")}
            </span>
          </button>

          {/* 使用手机号登录 */}
          <form
            className="mt-[30px] flex flex-col z-[20]"
            action=""
            onSubmit={handlePhoneLogin}
          >
            {/* 手机号码 */}
            <div className="h-10 flex items-center rounded-xl border border-[#0000001A] overflow-hidden text-sm font-normal text-[#3B3D2C]">
              <button
                className="h-full pl-3 pr-2 flex items-center cursor-not-allowed bg-[#fff] "
                type="button"
              >
                <span className="text-primary">+86</span>
              </button>
              <div className="h-2.5 w-[1px] bg-[#fff]"></div>
              <input
                className="flex-1 bg-[#fff] px-2 h-full pr-2 border-none outline-none"
                type="text"
                name="phone"
                maxLength={11}
                value={formData.phone}
                placeholder={t("login_login_phone_placeholder")}
                onChange={handleChange}
              />
            </div>

            {/* 验证码 */}
            <div className="h-10 mt-2 flex items-center rounded-xl border border-[#0000001A] overflow-hidden text-sm font-normal text-[#3B3D2C]">
              <input
                className="flex-1 bg-[#fff] px-2 h-full border-none outline-none"
                type="text"
                name="captcha"
                maxLength={6}
                placeholder={t("login_login_captcha_placeholder")}
                value={formData.captcha}
                onChange={handleChange}
              />
              <button
                className={`
                  min-w-[70px]  h-full flex justify-center items-center bg-[#fff]  px-2 
                  ${remainTime > 0 ? "text-[#A0A0A0] cursor-not-allowed" : "text-[#3B3D2C] cursor-pointer"}
                `}
                type="button"
                onClick={handleCaptchaClick}
              >
                {remainTime > 0
                  ? `${remainTime}秒`
                  : hasSendCaptcha
                    ? t("login_login_resend_captcha")
                    : t("login_login_get_captcha")}
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              className={`
                mt-[60px] h-9 flex justify-center items-center rounded-lg
                ${canLogin ? "bg-[#fff] text-[#000]" : "bg-[#F5F5F1] text-[#A0A0A0]"}
                ${canLogin ? "cursor-pointer" : "cursor-not-allowed"}
              `}
              onClick={handlePhoneLogin}
            >
              <span className="text-sm font-medium">
                {t("login_login_verify")}
              </span>
            </button>

            {/* 协议 */}
            <span className="mt-6 mx-auto text-xs font-normal text-[#3B3D2C] text-center">
              {t("login_login_agreement")} <br />
              <a href="#" className="text-[#23B9BC]">
                {t("login_login_privacy")}
              </a>{" "}
              {t("login_login_terms")}
              <a href="#" className="text-[#23B9BC]">
                {t("login_login_service")}
              </a>
            </span>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

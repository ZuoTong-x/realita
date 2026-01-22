import IconLogoName from "@/assets/svg/IconLogoName.svg?react";

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";

import { getLanguage, saveLanguage } from "../utils/user_util";

import IconShare from "@/assets/svg/IconShare.svg?react";
import IconUser from "@/assets/svg/IconUser.svg?react";
import IconCredit from "@/assets/svg/IconCredit.svg?react";
import CommonButton from "./Common/Button";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utils/style_utils";
import { App, Popover } from "antd";
import useUserStore from "@/stores/userStore";
import IconAvatar from "@/assets/svg/IconAvatar.svg?react";
import { getUserInfo } from "@/api";
import UserInfoModal from "./UserInfoModal";

const Header = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const [curLng, setCurLng] = useState<string>("zh");
  const [routerName, setRouterName] = useState<string>("home");
  const { userInfo, isLoggedIn, setUserStore } = useUserStore();
  const [isLogged, setIsLogged] = useState<boolean>(false);

  const handleLangClick = () => {
    if (curLng === "zh") {
      i18n.changeLanguage("en");
      saveLanguage("en");
      setCurLng("en");
    } else {
      i18n.changeLanguage("zh");
      saveLanguage("zh");
      setCurLng("zh");
    }
  };

  // 获取用户信息

  const fetchUserInfo = useCallback(async () => {
    try {
      const ret = await getUserInfo();
      if (ret.code !== 200 || !ret.data) {
        message.error(ret.msg || t("login_fetch_user_info_failed"));
        return;
      }
      setUserStore(ret.data);
    } catch {
      message.error(t("common_network_error"));
    }
  }, [setUserStore, message, t]);

  // 复制当前页面链接
  const handleShareClick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    message.success(t("common_copied_to_clipboard"));
  };
  useEffect(() => {
    setCurLng(getLanguage() || "en");
  }, [i18n.language]);

  useEffect(() => {
    const pathName = location.pathname.split("/")[1] || "home";
    setRouterName(pathName);
  }, [location]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn, fetchUserInfo]);

  useEffect(() => {
    setIsLogged(isLoggedIn);
  }, [isLoggedIn]);
  return (
    <div className="w-full h-full px-6 flex justify-between items-center relative bg-transparent">
      <div
        className={cn(
          "flex items-center cursor-pointer",
          routerName === "live" ? "text-white" : "text-black"
        )}
        onClick={() => {
          navigate("/");
        }}
      >
        <IconLogoName className={cn("w-[116px] h-9")} />
      </div>
      <div className="flex items-center z-[22]">
        {/** 分享 */}
        <CommonButton
          className="w-7 h-7 flex items-center mr-2"
          onClick={handleShareClick}
        >
          <span className="flex items-center text-sm font-normal text-[#3B3D2C]">
            <IconShare className="w-3.5 h-3.5" />
          </span>
        </CommonButton>
        {/* 语言切换 */}
        <CommonButton
          className="w-7 h-7 flex items-center mr-2"
          onClick={handleLangClick}
        >
          <span className="flex items-center text-sm font-normal text-[#3B3D2C]">
            {curLng === "zh" ? "EN" : "中"}
          </span>
        </CommonButton>
        {/* 积分 */}
        {isLogged && (
          <CommonButton className="w-14 h-7 flex items-center mr-2">
            <span className="flex items-center text-sm font-normal text-[#3B3D2C]">
              {userInfo?.credits || 0}
              <IconCredit className="w-3.5 h-3.5 ml-1 text-[#2A343D]" />
            </span>
          </CommonButton>
        )}
        {/* 头像或登录按钮 */}
        {isLogged ? (
          <Popover
            content={<UserInfoModal />}
            trigger="hover"
            placement="bottomRight"
            arrow={false}
            styles={{
              container: {
                padding: 0,
              },
            }}
          >
            <div
              className="cursor-pointer"
              onClick={() => {
                navigate("/user");
              }}
            >
              {userInfo?.avatar_url ? (
                <img
                  className="w-7 h-7 rounded-full object-cover"
                  src={userInfo?.avatar_url}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  alt=""
                />
              ) : (
                <IconAvatar className="w-7 h-7" />
              )}
            </div>
          </Popover>
        ) : (
          <CommonButton
            onClick={() => {
              navigate("/login");
            }}
          >
            <span className="flex items-center text-sm font-normal text-[#3B3D2C]">
              <IconUser className="w-3.5 h-3.5" />
            </span>
          </CommonButton>
        )}
      </div>
    </div>
  );
};

export default Header;

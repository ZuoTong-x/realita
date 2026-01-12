import React from "react";
import { Divider } from "antd";
import { useTranslation } from "react-i18next";
import useUserStore from "@/stores/userStore";
import IconAvatar from "@/assets/svg/IconAvatar.svg?react";
import IconCredit from "@/assets/svg/IconCredit.svg?react";
import IconLogOut from "@/assets/svg/IconLogOut.svg?react";

const UserInfoModal: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo, credits, logoutStore } = useUserStore();

  return (
    <div className="w-[300px] p-4 bg-white rounded-2xl shadow-xl border border-gray-100">
      {/* Top Profile Card */}
      <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4 relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden mb-3 bg-white">
            {userInfo?.avatar_url ? (
              <img
                src={userInfo.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <IconAvatar className="w-full h-full text-gray-300" />
            )}
          </div>

          <div className="w-full flex justify-between items-end gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-base font-bold text-[#3B3D2C] truncate">
                {userInfo?.nickname || userInfo?.username || "User"}
              </span>
              <span className="text-xs text-gray-400 truncate">
                {userInfo?.email || ""}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 mb-1">Credits</span>
              <div className="bg-[#3B3D2C] rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                <IconCredit className="w-3 h-3 text-[#FFBC36]" />
                <span className="text-xs font-bold text-white leading-none">
                  {credits?.credits ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
        onClick={() => logoutStore()}
      >
        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
          <IconLogOut className="w-4 h-4 text-[#3B3D2C]" />
        </div>
        <span className="text-sm font-medium text-[#3B3D2C]">
          {t("login.login_out") || "Log Out"}
        </span>
      </div>

      <Divider className="my-3 border-gray-100" />

      {/* Footer */}
      <div className="px-2 pb-1 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Version:</span>
        <span className="text-xs text-gray-500 font-bold tracking-wider">
          v1.0
        </span>
      </div>
    </div>
  );
};

export default UserInfoModal;

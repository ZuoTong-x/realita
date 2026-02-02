import { useEffect, useState, useMemo } from "react";

import { Avatar, List, Card } from "antd";
import CommonButton from "@/components/Common/Button";
import RadioTabs from "@/components/RadioTabs";
import IconUser from "@/assets/svg/IconUser.svg?react";
// import IconHistory from "@/assets/svg/IconHistory.svg?react";
import IconLike from "@/assets/svg/IconLike.svg?react";
import IconLogout from "@/assets/svg/IconLogOut.svg?react";
import IconChat from "@/assets/svg/IconChat.svg?react";
import { useTranslation } from "react-i18next";
import CharacterCreate from "@/pages/Home/modules/CharacterCreate";
import CharacterPreview from "@/pages/Home/modules/CharacterPreview";
import type { CharacterInfo } from "@/types/Character";
import LikeTag from "@/components/LikeTag";
import { useNavigate } from "react-router-dom";
import useUserStore from "@/stores/userStore";
import {
  getNonPublicCharacterList,
  getUserLikedCharacters,
  getPublicCharacterList,
} from "@/api";
import { Ratio } from "@/types/Live";
import { useMobile } from "@/provider";
import { cn } from "@/utils/style_utils";

// Like Tag Component with animation

const UserPage = () => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const [activeValue, setActiveValue] = useState<string>("assets");
  const [createOpen, setCreateOpen] = useState(false);
  const [createCharacterInfo, setCreateCharacterInfo] =
    useState<CharacterInfo | null>(null);
  const navigate = useNavigate();
  const { userInfo, logoutStore } = useUserStore();
  const [userLikedCharacters, setUserLikedCharacters] = useState<string[]>([]);

  const [publicCharacterList, setPublicCharacterList] = useState<
    CharacterInfo[]
  >([]);
  const [nonPublicCharacterList, setNonPublicCharacterList] = useState<
    CharacterInfo[]
  >([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCharacterId, setPreviewCharacterId] = useState("");
  const [previewRatio, setPreviewRatio] = useState<Ratio>(Ratio.PORTRAIT);
  const tabsList = [
    // { label: t("user_history"), value: "history", icon: <IconHistory /> },
    {
      label: t("user_assets"),
      value: "assets",
      icon: <IconUser className="w-5 h-5" />,
    },
    { label: t("user_likes"), value: "likes", icon: <IconLike /> },
  ];

  // 从列表直接打开预览
  const handleChat = (_character: CharacterInfo) => {
    setPreviewCharacterId(_character.character_id);
    setPreviewRatio(Ratio.PORTRAIT); // 默认使用竖屏比例
    setPreviewOpen(true);
  };

  // 从预览切换到编辑
  const handleEditFromPreview = (character: CharacterInfo) => {
    setPreviewOpen(false);
    setCreateCharacterInfo(character);
    setCreateOpen(true);
  };

  // 创建/编辑成功后打开预览
  const handleCharacterSuccess = (characterId: string, ratio: Ratio) => {
    setPreviewCharacterId(characterId);
    setPreviewRatio(ratio);
    setPreviewOpen(true);
  };

  const handleLogOut = () => {
    logoutStore();
    navigate("/login");
  };

  const handleGetCharacterList = async () => {
    const nonPublicCharacters = await getNonPublicCharacterList();
    const publicCharacters = await getPublicCharacterList();
    setPublicCharacterList(publicCharacters.data);
    setNonPublicCharacterList(nonPublicCharacters.data);
  };

  const handleGetUserLikedCharacters = async () => {
    const res = await getUserLikedCharacters();
    if (res.code === 200) {
      setUserLikedCharacters(res.data);
    }
  };
  const handleLikeChange = async () => {
    handleGetUserLikedCharacters();
  };
  const characterList = useMemo(() => {
    if (activeValue === "history") {
      return [];
    }
    if (activeValue === "likes") {
      return publicCharacterList.filter((item) =>
        userLikedCharacters.includes(item.character_id)
      );
    }
    if (activeValue === "assets") {
      return nonPublicCharacterList;
    }
    return [];
  }, [
    activeValue,
    nonPublicCharacterList,
    publicCharacterList,
    userLikedCharacters,
  ]);
  useEffect(() => {
    handleGetCharacterList();
    handleGetUserLikedCharacters();
  }, []);

  return (
    <div
      className={cn(
        "w-full h-full mx-auto flex flex-col justify-start items-center default-bg-container relative gap-6",
        isMobile
          ? "min-w-[100vw] px-4 pt-20 pb-4"
          : "min-w-[800px] max-w-[1280px] px-10 pt-24 pb-4"
      )}
    >
      <div className="w-full flex">
        <div>
          <Avatar src={userInfo?.avatar_url} size={isMobile ? 48 : 58} />
        </div>
        <div
          className={cn(
            "flex-1 flex flex-col justify-between items-start py-1",
            isMobile ? "ml-3" : "ml-4"
          )}
        >
          <div
            className={cn(
              "font-medium text-[#32333D]",
              isMobile ? "text-base" : "text-lg"
            )}
          >
            {userInfo?.username}
          </div>
          <div
            className={cn("text-[#B1B6BD]", isMobile ? "text-xs" : "text-sm")}
          >
            {userInfo?.email}
          </div>
        </div>
        <div className="py-1 flex-col justify-between items-end">
          <CommonButton size="small" onClick={handleLogOut}>
            <span
              className={cn(
                "font-medium text-[#333] flex items-center gap-2 justify-center",
                isMobile ? "text-xs px-2" : "text-sm px-3"
              )}
            >
              <IconLogout
                className={cn(isMobile ? "w-2.5 h-2.5" : "w-3 h-3")}
              />
              {t("login_login_out")}
            </span>
          </CommonButton>
        </div>
      </div>
      <div className="w-full flex justify-start items-center">
        <RadioTabs
          tabsList={tabsList}
          activeValue={activeValue}
          iconPosition="right"
          tabsClassName="w-auto"
          onChange={(value) => {
            setActiveValue(value);
          }}
        />
      </div>
      <div
        className={cn(
          "w-full flex-1 overflow-y-auto custom-scrollbar min-h-0",
          isMobile ? "pr-0" : "pr-2"
        )}
      >
        <List
          grid={{
            gutter: isMobile ? 12 : 16,
            column: isMobile ? 2 : 4,
          }}
          dataSource={characterList}
          renderItem={(item) => (
            <List.Item key={item.character_id}>
              <Card className="w-full h-full cursor-pointer user-card-item transition-all duration-300">
                <div
                  className={cn(
                    "w-full flex flex-col relative group",
                    isMobile ? "gap-1.5" : "gap-2"
                  )}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={item.image.url}
                      alt={item.character_name || ""}
                      className="w-full h-full object-cover"
                    />
                    {/* Chat button overlay - 移动端始终显示，桌面端 hover 显示 */}
                    <div
                      className={cn(
                        "absolute inset-0 flex items-end justify-center bg-black/0 transition-all duration-300",
                        isMobile
                          ? "opacity-100"
                          : "group-hover:bg-black/20 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <CommonButton
                        size={isMobile ? "middle" : "large"}
                        className={cn(
                          "px-0 hover:scale-110 transition-transform duration-300",
                          isMobile ? "h-8 mb-2" : "h-10 mb-4"
                        )}
                        borderRadiusPx={54}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChat(item);
                        }}
                      >
                        <span
                          className={cn(
                            "font-medium text-[#333] flex items-center gap-2 justify-center",
                            isMobile ? "text-sm px-3" : "text-xl gap-4 px-6"
                          )}
                        >
                          {t("common_chat")}
                          <IconChat
                            className={cn(isMobile ? "w-4 h-3" : "w-6 h-4")}
                          />
                        </span>
                      </CommonButton>
                    </div>
                  </div>

                  {activeValue === "likes" && (
                    <div className="w-full flex items-center justify-between">
                      <LikeTag
                        characterId={item.character_id}
                        likeCount={item.number_of_likes || 0}
                        isLiked={userLikedCharacters.includes(
                          item.character_id
                        )}
                        onLikeChange={() => {
                          handleLikeChange();
                        }}
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "w-full flex flex-col",
                      isMobile ? "gap-0.5" : "gap-1"
                    )}
                  >
                    <div
                      className={cn(
                        "font-semibold text-[#32333D] line-clamp-1",
                        isMobile ? "text-sm" : "text-base"
                      )}
                    >
                      {item.character_name}
                    </div>
                    <div
                      className={cn(
                        "text-[#B1B6BD] line-clamp-2 leading-relaxed",
                        isMobile ? "text-[11px] h-8" : "text-xs h-10"
                      )}
                    >
                      {item.llm_prompt}
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
      {/* Character Create Modal */}
      <CharacterCreate
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateCharacterInfo(null);
        }}
        characterInfo={createCharacterInfo}
        onSuccess={handleCharacterSuccess}
      />
      {/* Character Preview Modal */}
      <CharacterPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        characterId={previewCharacterId}
        ratio={previewRatio}
        onEdit={handleEditFromPreview}
      />
    </div>
  );
};

export default UserPage;

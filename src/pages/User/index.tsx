import { useEffect, useState, useMemo } from "react";

import { Avatar, List, Card } from "antd";
import CommonButton from "@/components/Common/Button";
import RadioTabs from "@/components/RadioTabs";
import IconUser from "@/assets/svg/IconUser.svg?react";
import IconHistory from "@/assets/svg/IconHistory.svg?react";
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

// Like Tag Component with animation

const UserPage = () => {
  const { t } = useTranslation();
  const [activeValue, setActiveValue] = useState<string>("history");
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
    { label: t("user_history"), value: "history", icon: <IconHistory /> },
    { label: t("user_likes"), value: "likes", icon: <IconLike /> },
    {
      label: t("user_assets"),
      value: "assets",
      icon: <IconUser className="w-5 h-5" />,
    },
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
    <div className="w-full h-full min-w-[800px] max-w-[1280px] mx-auto flex flex-col justify-start items-center default-bg-container relative px-10 pt-24 pb-4 gap-6">
      <div className="w-full flex">
        <div>
          <Avatar src={userInfo?.avatar_url} size={58} />
        </div>
        <div className="flex-1 ml-4 flex flex-col justify-between items-start py-1">
          <div className="text-lg font-medium text-[#32333D]">
            {userInfo?.username}
          </div>
          <div className="text-sm text-[#B1B6BD]">{userInfo?.email}</div>
        </div>
        <div className="py-1 flex-col justify-between items-end">
          <CommonButton size="large" className=" h-10 " onClick={handleLogOut}>
            <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
              <IconLogout className="w-5 h-5" />
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
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2">
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={characterList}
          renderItem={(item) => (
            <List.Item key={item.character_id}>
              <Card className="w-full h-full cursor-pointer user-card-item transition-all duration-300">
                <div className="w-full flex flex-col gap-2 relative group">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={item.image.url}
                      alt={item.character_name || ""}
                      className="w-full h-full object-cover"
                    />
                    {/* Chat button overlay */}
                    <div className="absolute inset-0 flex items-end justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <CommonButton
                        size="large"
                        className="h-10 px-0 hover:scale-110 transition-transform duration-300 mb-4"
                        borderRadiusPx={54}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChat(item);
                        }}
                      >
                        <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-6">
                          {t("common_chat")}
                          <IconChat className="w-6 h-4" />
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

                  <div className="w-full flex flex-col gap-1">
                    <div className="text-base font-semibold text-[#32333D] line-clamp-1">
                      {item.character_name}
                    </div>
                    <div className="text-xs text-[#B1B6BD] h-10 line-clamp-2 leading-relaxed">
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

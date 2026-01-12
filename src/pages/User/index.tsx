import { useState } from "react";
import testPng from "@/assets/images/test.png";
import { Avatar, List, Card, Tag } from "antd";
import CommonButton from "@/components/Common/Button";
import RadioTabs from "@/components/RadioTabs";
import IconUser from "@/assets/svg/IconUser.svg?react";
import IconHistory from "@/assets/svg/IconHistory.svg?react";
import IconLike from "@/assets/svg/IconLike.svg?react";
import IconLogout from "@/assets/svg/IconLogout.svg?react";
import IconChat from "@/assets/svg/IconChat.svg?react";
import { useTranslation } from "react-i18next";
import CharacterCreate from "@/pages/Home/modules/CharacterCreate";
import type { Character } from "@/types/Character";

import IconLikeFilled from "@/assets/svg/IconLikeFilled.svg?react";

import { useNavigate } from "react-router-dom";
import useUserStore from "@/stores/userStore";

// Like Tag Component with animation
const LikeTag = ({
  likeCount,
  onClick,
}: {
  likeCount: number;
  onClick?: () => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onClick?.();
  };

  return (
    <Tag className="like-tag cursor-pointer" onClick={handleClick}>
      <span className="flex items-center gap-1">
        {isLiked ? (
          <IconLikeFilled
            className={`w-3 h-4 like-icon-filled ${
              isAnimating ? "like-icon-animate" : ""
            }`}
          />
        ) : (
          <IconLike
            className={`w-3 h-3 like-icon-outline ${
              isAnimating ? "like-icon-animate" : ""
            }`}
          />
        )}
        <span>{likeCount}</span>
      </span>
    </Tag>
  );
};

const UserPage = () => {
  const { t } = useTranslation();
  const [activeValue, setActiveValue] = useState<string>("history");
  const [createOpen, setCreateOpen] = useState(false);
  const [createCharacterInfo, setCreateCharacterInfo] =
    useState<Character | null>(null);
  const navigate = useNavigate();
  const { userInfo, logoutStore } = useUserStore();

  const tabsList = [
    { label: t("user.history"), value: "history", icon: <IconHistory /> },
    { label: t("user.likes"), value: "likes", icon: <IconLike /> },
    {
      label: t("user.assets"),
      value: "assets",
      icon: <IconUser className="w-5 h-5" />,
    },
  ];
  const cardList: (Character & { likeCount: number })[] = [
    {
      id: "1",
      image: testPng,
      name: "test",
      description:
        "测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度测试详情长度",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "2",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "3",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "4",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "5",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "6",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "7",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "8",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "9",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "10",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "11",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "12",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "13",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "14",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "15",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
    {
      id: "16",
      image: testPng,
      name: "test",
      description: "test",
      voice: "test",
      likeCount: 100,
    },
  ];

  const handleChat = (character: Character) => {
    setCreateCharacterInfo(character);
    setCreateOpen(true);
  };

  const handleLogOut = () => {
    logoutStore();
    navigate("/login");
  };

  return (
    <div className="w-full h-full min-w-[800px] max-w-[1280px] mx-auto flex flex-col justify-start items-center default-bg-container relative px-10 pt-24 pb-4 gap-6">
      <div className="w-full flex">
        <div>
          <Avatar src={userInfo?.avatar_url} size={58} />
        </div>
        <div className="flex-1 ml-4 flex flex-col justify-between items-start py-1">
          <div className="text-lg font-medium text-[#32333D]">
            {userInfo?.nickname}
          </div>
          <div className="text-sm text-[#B1B6BD]">{userInfo?.email}</div>
        </div>
        <div className="py-1 flex-col justify-between items-end">
          <CommonButton size="large" className=" h-10 " onClick={handleLogOut}>
            <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
              <IconLogout className="w-5 h-5" />
              {t("login.login_out")}
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
          dataSource={cardList}
          renderItem={(item) => (
            <List.Item>
              <Card className="w-full h-full cursor-pointer user-card-item transition-all duration-300">
                <div className="w-full flex flex-col gap-2 relative group">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Chat button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <CommonButton
                        size="large"
                        className="h-12 px-0 hover:scale-110 transition-transform duration-300 absolute bottom-[10px] left-1/2 -translate-x-1/2"
                        borderRadiusPx={54}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChat(item);
                        }}
                      >
                        <span className="text-lg font-medium text-[#333] flex items-center gap-3 justify-center px-8">
                          {t("common.chat")}
                          <IconChat className="w-5 h-5" />
                        </span>
                      </CommonButton>
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between">
                    <LikeTag likeCount={item.likeCount} />
                  </div>

                  <div className="w-full flex flex-col gap-1">
                    <div className="text-base font-semibold text-[#32333D] line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-xs text-[#B1B6BD] h-10 line-clamp-2 leading-relaxed">
                      {item.description}
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
      />
    </div>
  );
};

export default UserPage;

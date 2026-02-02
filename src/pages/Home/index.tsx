import { useEffect, useState, useCallback } from "react";
import CommonButton from "@/components/Common/Button";
import IconStar from "@/assets/svg/IconStar.svg?react";
import { useTranslation } from "react-i18next";
import CharacterSwiper from "./modules/CharacterSwiper";
import CharacterSlider from "./modules/CharacterSlider";
import CharacterCreate from "./modules/CharacterCreate";
import CharacterPreview from "./modules/CharacterPreview";

import { useMobile } from "@/provider";

import {
  getPublicCharacterList,
  getNonPublicCharacterList,
  getUserLikedCharacters,
} from "@/api";
import useCharacterListStore from "@/stores/characterListStore";
import type { CharacterInfo } from "@/types/Character";
import { Ratio } from "@/types/Live";
import { cn } from "@/utils/style_utils";

const HomePage = () => {
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const {
    characterList,
    setCharacterList,
    currentCharacter,
    setCurrentCharacter,
    setUserLikedCharacters,
  } = useCharacterListStore();

  const [createOpen, setCreateOpen] = useState(false);

  const [createCharacterInfo, setCreateCharacterInfo] =
    useState<CharacterInfo | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCharacterId, setPreviewCharacterId] = useState("");
  const [previewRatio, setPreviewRatio] = useState<Ratio>(Ratio.PORTRAIT);

  const init = useCallback(async () => {
    const publicCharacters = await getPublicCharacterList();
    const nonPublicCharacters = await getNonPublicCharacterList();
    const characterList = [
      ...publicCharacters.data.map((item: CharacterInfo) => ({
        ...item,
        is_public: true,
      })),
      ...nonPublicCharacters.data.map((item: CharacterInfo) => ({
        ...item,
        is_public: false,
      })),
    ];
    setCharacterList(characterList);
    setCurrentCharacter(characterList[0]);
    const likedCharacters = await getUserLikedCharacters();
    if (likedCharacters.code === 200) {
      setUserLikedCharacters(likedCharacters.data);
    }
  }, [setCharacterList, setCurrentCharacter, setUserLikedCharacters]);

  useEffect(() => {
    init();
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get("characterId");
    if (characterId) {
      setPreviewCharacterId(characterId);
      setPreviewRatio(Ratio.PORTRAIT); // 默认使用竖屏比例
      setPreviewOpen(true);
    }
  }, [init]);

  // 从轮播直接打开预览
  const handleChat = (character: CharacterInfo) => {
    setPreviewCharacterId(character.character_id);
    setPreviewRatio(Ratio.PORTRAIT); // 默认使用竖屏比例
    setPreviewOpen(true);
  };

  // 从预览切换到编辑
  const handleEditFromPreview = (character: CharacterInfo) => {
    setPreviewOpen(false);
    const characterInfo = characterList.find(
      (item) => item.character_id === character.character_id
    );
    if (characterInfo) {
      setCreateCharacterInfo(characterInfo);
    }
    setCreateOpen(true);
  };

  // 创建/编辑成功后打开预览
  const handleCharacterSuccess = (characterId: string, ratio: Ratio) => {
    setPreviewCharacterId(characterId);
    setPreviewRatio(ratio);
    setPreviewOpen(true);
    init();
  };

  const handleDeleteFromPreview = () => {
    setPreviewOpen(false);
    setPreviewCharacterId("");
    init();
  };
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col justify-between items-center default-bg-container relative",
        isMobile ? "min-w-[100vw]" : "min-w-[800px]"
      )}
    >
      {/** 角色列表 */}
      <div className="flex-1 w-full h-full ">
        <CharacterSwiper
          onChat={(character) => {
            handleChat(character);
          }}
          pauseVideo={createOpen || previewOpen}
        />
      </div>
      {/** 侧边栏   */}
      <div
        className={cn(
          "absolute top-[50%] translate-y-[-50%] right-5 h-140 w-20 z-[22]",
          isMobile ? "hidden" : "block"
        )}
      >
        <CharacterSlider
          characterList={characterList}
          currentCharacter={currentCharacter}
          changeCharacter={setCurrentCharacter}
        />
      </div>
      {/** 创建新角色按钮 */}
      <div className="h-16 my-4">
        <CommonButton
          size="large"
          className="py-4 h-16 px-0"
          borderRadiusPx={54}
          onClick={() => {
            setCreateCharacterInfo(null);
            setCreateOpen(true);
          }}
        >
          <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
            {t("home_create_new_character")}
            <IconStar className="w-6 h-6" />
          </span>
        </CommonButton>
      </div>
      {/** 创建新角色弹窗 */}
      <CharacterCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        characterInfo={createCharacterInfo}
        onSuccess={handleCharacterSuccess}
      />
      {/** 角色预览弹窗 */}
      <CharacterPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        characterId={previewCharacterId}
        ratio={previewRatio}
        onEdit={handleEditFromPreview}
        onDelete={handleDeleteFromPreview}
      />
    </div>
  );
};

export default HomePage;

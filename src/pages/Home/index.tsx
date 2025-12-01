import { useEffect, useState, useCallback } from "react";
// import { getList } from "@/api/home";
import CommonButton from "@/components/Common/Button";
import IconStar from "@/assets/svg/IconStar.svg?react";
import { useTranslation } from "react-i18next";
import CharacterSwiper from "./modules/CharacterSwiper";
import CharacterSlider from "./modules/CharacterSlider";
import CharacterCreate from "./modules/CharacterCreate";
import CharacterPreview from "./modules/CharacterPreview";
import { getCharacterList } from "@/api";
import useCharacterListStore from "@/stores/characterListStore";

const HomePage = () => {
  const { t } = useTranslation();
  const {
    characterList,
    setCharacterList,
    currentCharacter,
    setCurrentCharacter,
  } = useCharacterListStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const init = useCallback(async () => {
    const list = await getCharacterList();
    if (list.code === 200) {
      setCharacterList(list.data);
      if (list.data.length > 0) {
        setCurrentCharacter(list.data[3]);
      }
    }
  }, [setCharacterList, setCurrentCharacter]);

  useEffect(() => {
    init();
  }, [init]);

  const onPreview = () => {
    setCreateOpen(false);
    setPreviewOpen(true);
  };

  return (
    <div className="w-full h-full min-w-[800px] flex flex-col justify-between items-center home-container relative">
      {/** 角色列表 */}
      <div className="flex-1 w-full h-full ">
        <CharacterSwiper />
      </div>
      {/** 侧边栏   */}
      <div className="absolute top-[50%] translate-y-[-50%] right-5 h-140 w-20 ">
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
          onClick={() => setCreateOpen(true)}
        >
          <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
            {t("home.create_new_character")}
            <IconStar className="w-6 h-6" />
          </span>
        </CommonButton>
      </div>
      {/** 创建新角色弹窗 */}
      <CharacterCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onPreview={onPreview}
      />
      {/* 角色预览弹窗 */}
      <CharacterPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};

export default HomePage;

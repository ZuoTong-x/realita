import { useEffect, useState, useCallback } from "react";
// import { getList } from "@/api/home";
import CommonButton from "@/components/Common/Button";
import IconStar from "@/assets/svg/IconStar.svg?react";
import { useTranslation } from "react-i18next";
import CharacterSwiper from "./modules/CharacterSwiper";
import CharacterSlider from "./modules/CharacterSlider";
import CharacterCreate from "./modules/CharacterCreate";
import CharacterPreview from "./modules/CharacterPreview";
// import { getCharacterList } from "@/api";
import useCharacterListStore from "@/stores/characterListStore";
import type { Character } from "@/types/Character";
import testPng from "@/assets/images/test.png";
import test2Png from "@/assets/images/test2.png";

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
  const [createCharacterInfo, setCreateCharacterInfo] =
    useState<Character | null>(null);
  const init = useCallback(async () => {
    // const list = await getCharacterList();
    //  if (list.code === 200) {
    //    setCharacterList(list.data);
    //    if (list.data.length > 0) {
    //      setCurrentCharacter(list.data[3]);
    //    }
    //  }
    const list = [
      {
        id: "1",
        name: "test",
        description: "test",
        image: testPng,
        voice: "test",
      },
      {
        id: "2",
        name: "test2",
        description: "test2",
        image: test2Png,
        voice: "test2",
      },
      {
        id: "3",
        name: "test3",
        description: "test3",
        image: testPng,
        voice: "test3",
      },
      {
        id: "4",
        name: "test4",
        description: "test4",
        image: test2Png,
        voice: "test4",
      },
      {
        id: "5",
        name: "test5",
        description: "test5",
        image: testPng,
        voice: "test5",
      },
      {
        id: "6",
        name: "test6",
        description: "test6",
        image: test2Png,
        voice: "test6",
      },
      {
        id: "7",
        name: "test7",
        description: "test7",
        image: testPng,
        voice: "test7",
      },
      {
        id: "8",
        name: "test8",
        description: "test8",
        image: test2Png,
        voice: "test8",
      },
      {
        id: "9",
        name: "test9",
        description: "test9",
        image: testPng,
        voice: "test9",
      },
      {
        id: "10",
        name: "test10",
        description: "test10",
        image: test2Png,
        voice: "test10",
      },
      {
        id: "11",
        name: "test11",
        description: "test11",
        image: testPng,
        voice: "test11",
      },
      {
        id: "12",
        name: "test12",
        description: "test12",
        image: test2Png,
        voice: "test12",
      },
      {
        id: "13",
        name: "test13",
        description: "test13",
        image: testPng,
        voice: "test13",
      },
    ];
    setCharacterList(list);
    if (list.length > 0) {
      setCurrentCharacter(list[3]);
    }
  }, [setCharacterList, setCurrentCharacter]);

  useEffect(() => {
    init();
  }, [init]);

  const onPreview = () => {
    setCreateOpen(false);
    setPreviewOpen(true);
  };
  const handleChat = (character: Character) => {
    setCreateCharacterInfo(character);
    setCreateOpen(true);
  };
  return (
    <div className="w-full h-full min-w-[800px] flex flex-col justify-between items-center default-bg-container relative">
      {/** 角色列表 */}
      <div className="flex-1 w-full h-full ">
        <CharacterSwiper
          onChat={(character) => {
            handleChat(character);
          }}
        />
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
        characterInfo={createCharacterInfo}
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

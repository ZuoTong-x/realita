import { useMemo } from "react";
import type { Voice, ProcessedVoice } from "@/types/Character";
import { LANGUAGE_LIST, GENDER_LIST } from "@/constants";

export const useVoiceProcessing = (voiceList: Voice[]) => {
  const { processedVoiceList, typeList } = useMemo(() => {
    const processed: ProcessedVoice[] = voiceList.map((v) => {
      // 1. 取出性别
      const genderKey = v.labels?.find((label) =>
        GENDER_LIST.some((g) => g.key === label)
      );
      const genderInfo = GENDER_LIST.find((g) => g.key === genderKey);

      // 2. 取出语言
      const langKey = v.labels?.find((label) =>
        LANGUAGE_LIST.some((lang) => lang.key === label)
      );
      const langInfo = LANGUAGE_LIST.find((l) => l.key === langKey);

      // 3. 去掉语言 key 和 性别 key 之后，遍历剩下的数据，判断中英文类别
      const remainingLabels =
        v.labels?.filter((label) => label !== langKey && label !== genderKey) ||
        [];

      let typeZh = "";
      let typeEn = "";

      remainingLabels.forEach((label) => {
        if (/[\u4e00-\u9fa5]/.test(label)) {
          typeZh = label;
        } else if (label) {
          typeEn = label;
        }
      });

      return {
        ...v,
        language: langInfo ? { ...langInfo } : null,
        gender: genderInfo ? { ...genderInfo } : null,
        type: { zh: typeZh, en: typeEn, key: typeEn || typeZh },
      };
    });

    const typesMap = new Map<string, { zh: string; en: string; key: string }>();
    processed.forEach((v) => {
      if (v.type.zh || v.type.en) {
        const uniqueKey = v.type.key;
        if (!typesMap.has(uniqueKey)) {
          typesMap.set(uniqueKey, v.type);
        }
      }
    });

    const finalTypeList = Array.from(typesMap.values());
    const allType = { zh: "全部", en: "All", key: "全部" };

    return {
      processedVoiceList: processed,
      typeList: [allType, ...finalTypeList],
    };
  }, [voiceList]);

  return { processedVoiceList, typeList };
};


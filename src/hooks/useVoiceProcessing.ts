import { useMemo } from "react";
import type { Voice, ProcessedVoice } from "@/types/Character";
import { LANGUAGE_LIST, GENDER_LIST, AGE_LIST } from "@/constants";

export const useVoiceProcessing = (voiceList: Voice[]) => {
  const { processedVoiceList } = useMemo(() => {
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

      // 3. 取出年龄
      const ageKey = v.labels?.find((label) =>
        AGE_LIST.some((age) => age.key === label)
      );
      const ageInfo = AGE_LIST.find((a) => a.key === ageKey);

      return {
        ...v,
        language: langInfo ? { ...langInfo } : null,
        gender: genderInfo ? { ...genderInfo } : null,
        age: ageInfo ? { ...ageInfo } : null,
      };
    });

    return {
      processedVoiceList: processed,
    };
  }, [voiceList]);

  return { processedVoiceList };
};

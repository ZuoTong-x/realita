export const LANGUAGE_LIST = [
  { label_zh: "中文", label_en: "chinese", key: "chinese" },
  { label_zh: "日文", label_en: "japanese", key: "ja" },
  { label_zh: "英文", label_en: "english", key: "en_us" },
];

export const GENDER_LIST = [
  { label_zh: "男", label_en: "male", key: "male" },
  { label_zh: "女", label_en: "female", key: "female" },
];

export const POSITIVE_TAGS = ["高质量", "4k", "高清", "细节丰富"];

export const NEGATIVE_TAGS = [
  "镜头晃动",
  "色调艳丽",
  "过曝",
  "静态",
  "细节模糊不清",
  "字幕",
  "风格",
  "作品",
  "画作",
  "画面",
  "静止",
  "整体发灰",
  "最差质量",
  "低质量",
  "JPEG压缩残留",
  "丑陋的",
  "残缺的",
  "多余的手指",
  "画得不好的手部",
  "画得不好的脸部",
  "畸形的",
  "毁容的",
  "形态畸形的肢体",
  "手指融合",
  "静止不动的画面",
  "杂乱的背景",
  "三条腿",
  "背景人很多",
  "倒着走",
];

export const DEFAULT_POSITIVE_PROMPT =
  "The video features a person is saying something.";

export const DEFAULT_NEGATIVE_PROMPT = NEGATIVE_TAGS.join("，");


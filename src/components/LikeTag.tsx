import IconLikeFilled from "@/assets/svg/IconLikeFilled.svg?react";
import IconLike from "@/assets/svg/IconLike.svg?react";
import { useState, useEffect } from "react";
import { Tag, App } from "antd";
import { likeCharacter } from "@/api/characterRequest";

export const LikeTag = ({
  characterId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked = false,
  onLikeChange,
  onClick,
  options = {
    size: "small",
    iconPosition: "left",
    showCount: true,
    showIcon: true,
    showBorder: true,
  },
}: {
  characterId: string;
  likeCount: number;
  isLiked?: boolean;
  onLikeChange?: (newLikeCount: number, newIsLiked: boolean) => void;
  onClick?: () => void;
  options?: {
    size?: "small" | "medium" | "large";
    // icon位置 ，左边或者右边
    iconPosition: "left" | "right";
    // 是否显示数字
    showCount: boolean;
    // 是否显示icon
    showIcon: boolean;
    // 是否显示边框
    showBorder: boolean;
  };
}) => {
  const { message } = App.useApp();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 同步外部传入的值变化
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 防止重复点击
    if (isLoading) return;

    // 保存旧状态，用于失败时回滚
    const oldIsLiked = isLiked;
    const oldLikeCount = likeCount;

    // 乐观更新：先更新UI
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked
      ? likeCount + 1
      : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setIsAnimating(true);
    setIsLoading(true);

    setTimeout(() => setIsAnimating(false), 600);

    try {
      // 调用API
      const res = await likeCharacter(characterId);

      if (res.code === 200) {
        // API 成功，通知父组件更新
        onLikeChange?.(newLikeCount, newIsLiked);
        onClick?.();
      } else {
        // API 失败，回滚状态
        setIsLiked(oldIsLiked);
        setLikeCount(oldLikeCount);
        message.error(res.msg || "点赞操作失败，请稍后重试");
      }
    } catch (error) {
      // 请求异常，回滚状态
      setIsLiked(oldIsLiked);
      setLikeCount(oldLikeCount);
      message.error("网络错误，请稍后重试");
      console.error("点赞操作失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const formatLikeCount = (count: number) => {
    if (count < 1000) return count;
    return `${(count / 1000).toFixed(1)}k`;
  };

  // 根据 size 获取图标尺寸类名
  const getIconSizeClass = () => {
    switch (options.size) {
      case "small":
        return "w-3 h-3";
      case "medium":
        return "w-4.5 h-3.5";
      case "large":
        return "w-[21px] h-[18px]";
      default:
        return "w-3 h-3";
    }
  };

  // 根据 size 获取容器类名
  const getSizeClass = () => {
    switch (options.size) {
      case "small":
        return "like-tag-small";
      case "medium":
        return "like-tag-medium";
      case "large":
        return "like-tag-large";
      default:
        return "like-tag-small";
    }
  };

  // 根据 options 构建类名
  const getTagClassName = () => {
    const classes = ["like-tag", "z-[21]", getSizeClass()];
    if (!options.showBorder) {
      classes.push("like-tag-no-border");
    }
    if (isLoading) {
      classes.push("opacity-50 cursor-not-allowed");
    } else {
      classes.push("cursor-pointer");
    }
    return classes.join(" ");
  };

  // 构建内容元素
  const iconElement = options.showIcon ? (
    isLiked ? (
      <IconLikeFilled
        className={`${getIconSizeClass()} like-icon-filled ${
          isAnimating ? "like-icon-animate" : ""
        }`}
      />
    ) : (
      <IconLike
        className={`${getIconSizeClass()} like-icon-outline ${
          isAnimating ? "like-icon-animate" : ""
        }`}
      />
    )
  ) : null;

  const countElement = options.showCount ? (
    <span>{formatLikeCount(likeCount)}</span>
  ) : null;

  // 根据 iconPosition 决定顺序
  const content =
    options.iconPosition === "left" ? (
      <>
        {iconElement}
        {countElement}
      </>
    ) : (
      <>
        {countElement}
        {iconElement}
      </>
    );

  return (
    <Tag className={getTagClassName()} onClick={handleClick}>
      <span className="flex items-center gap-1">{content}</span>
    </Tag>
  );
};
export default LikeTag;

import React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps } from "antd";

type CommonButtonProps = Omit<ButtonProps, "shape"> & {
  borderRadiusPx?: number;
  shape?: ButtonProps["shape"];
};

const DEFAULT_BORDER_RADIUS_PX = 18;

const CommonButton = React.forwardRef<HTMLButtonElement, CommonButtonProps>(
  (
    {
      borderRadiusPx = DEFAULT_BORDER_RADIUS_PX,
      shape = "round",
      style,
      className,
      ...restProps
    },
    ref
  ) => {
    const mergedStyle: React.CSSProperties = {
      border: "none",
      borderRadius: `${borderRadiusPx}px`,
      ...style,
    };
    const mergedClassName = ["seko-common-btn", className]
      .filter(Boolean)
      .join(" ");

    return (
      <AntButton
        ref={ref}
        shape={shape}
        ghost={false}
        className={mergedClassName}
        style={mergedStyle}
        {...restProps}
      />
    );
  }
);

CommonButton.displayName = "CommonButton";

export default CommonButton;

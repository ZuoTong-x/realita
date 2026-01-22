import { useState } from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { cn } from "@/utils/style_utils";

type DropdownMenuProps<T> = {
  list: T[];
  value: T | null;
  onChange: (item: T) => void;
  formatLabel: (item: T) => string;
  getKey: (item: T, index: number) => string | number;
  isSelected: (item: T, value: T | null) => boolean;
  defaultLabel: string;
  iconActive: React.ReactNode;
  iconInactive: React.ReactNode;
  iconArrow: React.ReactNode;
  showNewTag?: (item: T) => boolean;
  renderMenuItem?: (
    item: T,
    isSelected: boolean,
    onClick: () => void
  ) => React.ReactNode;
  renderSelectedIcon?: (item: T, isSelected: boolean) => React.ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
};

const DropdownMenu = <T,>({
  list,
  value,
  onChange,
  formatLabel,
  getKey,
  isSelected,
  defaultLabel,
  iconActive,
  iconInactive,
  iconArrow,
  showNewTag,
  renderMenuItem,
  renderSelectedIcon,
  buttonClassName,
  disabled,
}: DropdownMenuProps<T>) => {
  const [open, setOpen] = useState(false);
  const isDisabled = disabled ?? list.length <= 1;

  const handleItemClick = (item: T) => {
    onChange(item);
    setOpen(false);
  };

  const menuItems: MenuProps["items"] = list.map((item, index) => {
    const itemIsSelected = isSelected(item, value);
    const key = getKey(item, index);

    if (renderMenuItem) {
      return {
        key,
        label: renderMenuItem(item, itemIsSelected, () =>
          handleItemClick(item)
        ),
      };
    }

    return {
      key,
      label: (
        <div
          className="min-w-[150px] px-1 py-1 flex justify-between items-center hover:bg-[#F5F5F1] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(item);
          }}
        >
          <span
            className={cn(
              itemIsSelected
                ? "font-semibold text-[#3B3D2C]"
                : "font-normal text-[#3B3D2CD0]"
            )}
          >
            {formatLabel(item)}
          </span>
          {showNewTag && showNewTag(item) && (
            <span className="bg-[#eef0f0] rounded px-2 py-1 text-xs">
              <span
                style={{
                  background:
                    "linear-gradient(270deg, #29E4F1 0%, #FFBC36 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                new
              </span>
            </span>
          )}
          {renderSelectedIcon && renderSelectedIcon(item, itemIsSelected)}
        </div>
      ),
    };
  });

  return (
    <Dropdown
      className=""
      menu={{ items: menuItems }}
      open={open}
      onOpenChange={setOpen}
    >
      <button
        className={cn(
          "h-8 px-[14px] flex items-center bg-[#F6F3F3] rounded-full",
          isDisabled ? "cursor-not-allowed" : "cursor-pointer",
          buttonClassName
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDisabled) {
            setOpen(!open);
          }
        }}
        disabled={isDisabled}
      >
        <span className="w-4 h-4 mr-1">
          {isDisabled ? iconInactive : iconActive}
        </span>
        <span
          className={cn(
            "text-sm font-normal",
            isDisabled ? "text-[#3B3D2C4C]" : "text-[#3B3D2C]"
          )}
        >
          {value ? formatLabel(value) : defaultLabel}
        </span>
        {showNewTag && value && showNewTag(value) && (
          <span className="bg-[#F6F3F3] rounded px-2 py-1 text-xs ml-1">
            <span
              style={{
                background: "linear-gradient(270deg, #29E4F1 0%, #FFBC36 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              new
            </span>
          </span>
        )}
        {!isDisabled && <span className="w-4 h-4 ml-1">{iconArrow}</span>}
      </button>
    </Dropdown>
  );
};

export default DropdownMenu;

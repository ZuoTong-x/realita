import { Segmented } from "antd";
import { cn } from "@/utils/style_utils";
import type { SegmentedProps } from "antd";

type RadioTabsProps = {
  tabsList: {
    label: string;
    icon: React.ReactNode;
    value: string;
    tooltip?: string;
    disabled?: boolean;
  }[];
  activeValue: string;
  onChange: (value: string) => void;
  iconPosition?: "left" | "right"; // "left" = icon在前（正序）, "right" = label在前（倒序）
  tabsClassName?: string;
};

const RadioTabs = ({
  tabsList,
  activeValue,
  onChange,
  iconPosition = "left",
  tabsClassName = "",
}: RadioTabsProps) => {
  const options: SegmentedProps["options"] = tabsList.map((tab) => {
    const labelContent = (
      <div className="flex items-center gap-1">
        {iconPosition === "left" ? (
          <>
            <span className="w-4 h-4 flex items-center justify-center">
              {tab.icon}
            </span>
            <span className="text-[12px] tracking-[0.04em]">{tab.label}</span>
          </>
        ) : (
          <>
            <span className="text-[12px] tracking-[0.04em]">{tab.label}</span>
            <span className="w-4 h-4 flex items-center justify-center">
              {tab.icon}
            </span>
          </>
        )}
      </div>
    );

    return {
      label: tab.tooltip ? (
        <span title={tab.tooltip}>{labelContent}</span>
      ) : (
        labelContent
      ),
      value: tab.value,
      disabled: tab.disabled,
    };
  });

  return (
    <div
      className={cn("w-full flex items-center justify-center", tabsClassName)}
    >
      <Segmented
        options={options}
        shape="round"
        value={activeValue}
        onChange={(value) => onChange(value as string)}
        className="radio-tabs-segmented"
      />
    </div>
  );
};

export default RadioTabs;

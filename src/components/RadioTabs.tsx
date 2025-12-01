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
};
const RadioTabs = ({ tabsList, activeValue, onChange }: RadioTabsProps) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="inline-flex items-center p-1 border border-[#E6E6E6] rounded-full bg-white">
        {tabsList.map((tab) => {
          const isActive = activeValue === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-[#eef0f0]"
                    : "text-[#666666] hover:text-[#2E2F23] hover:bg-[#EEF0F2]"
                }
                ${tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              onClick={() => onChange(tab.value)}
              disabled={tab.disabled}
            >
              <div className="flex items-center gap-1">
                <span className="w-4 h-4">{tab.icon}</span>
                <span className="text-[12px] tracking-[0.04em]">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RadioTabs;

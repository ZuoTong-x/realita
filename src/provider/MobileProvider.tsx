import { createContext, useContext, useState, useEffect } from "react";

// 移动端检测 Context
interface MobileContextType {
  isMobile: boolean;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error("useMobile must be used within MobileProvider");
  }
  return context;
};

// 移动端检测 Provider
export const MobileProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(() => {
    // 检测是否为移动设备
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
    const isMobileDevice = mobileKeywords.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileDevice || isSmallScreen;
  });

  useEffect(() => {
    const handleResize = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
      const isMobileDevice = mobileKeywords.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

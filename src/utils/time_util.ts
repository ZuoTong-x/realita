// 格式化日期（yyyy-mm-dd）
export const formatTimeYMD = (timeStr: number) => {
  const inputDate = new Date(timeStr);
  const inputY = inputDate.getFullYear();
  const inputM = inputDate.getMonth();
  const inputD = inputDate.getDate();
  return `${inputY}-${String(inputM + 1).padStart(2, "0")}-${String(inputD).padStart(2, "0")}`;
};

// 格式化日期（yyyy-mm-dd hh:mm:ss）
export const formatTimeYMDHMS = (timeStr: number) => {
  const inputDate = new Date(timeStr);
  const inputY = inputDate.getFullYear();
  const inputM = inputDate.getMonth();
  const inputD = inputDate.getDate();
  const inputH = inputDate.getHours();
  const inputMin = inputDate.getMinutes();
  const inputS = inputDate.getSeconds();
  return `${inputY}-${String(inputM + 1).padStart(2, "0")}-${String(inputD).padStart(2, "0")} ${String(inputH).padStart(2, "0")}:${String(inputMin).padStart(2, "0")}:${String(inputS).padStart(2, "0")}`;
};

// 判断是否是今天
export const isToday = (timeStr: string) => {
  const inputDate = new Date(timeStr);
  const now = new Date();
  return (
    inputDate.getFullYear() === now.getFullYear() &&
    inputDate.getMonth() === now.getMonth() &&
    inputDate.getDate() === now.getDate()
  );
};

// 判断是否是昨天
export const isYesterday = (timeStr: string) => {
  const inputDate = new Date(timeStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    inputDate.getFullYear() === yesterday.getFullYear() &&
    inputDate.getMonth() === yesterday.getMonth() &&
    inputDate.getDate() === yesterday.getDate()
  );
};

// 格式化时长 mm:ss
export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

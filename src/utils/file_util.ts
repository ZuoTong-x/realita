const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
/**
 * 将 File 或 Blob 转为 base64 data URL
 * @param {File|Blob} file
 * @returns {Promise<string>} 返回 data URL，比如 "data:image/png;base64,...."
 */
const fileToDataURL = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error("Failed to read file"));
    };
    reader.onload = () => {
      const dataUrl = String(reader.result);
      // 去掉前缀，只保留纯 base64
      const pureBase64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
      resolve(pureBase64);
    };
    reader.readAsDataURL(file);
  });
};

export { getAudioDuration, fileToDataURL };

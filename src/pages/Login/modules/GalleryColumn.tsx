import type { Examples } from "@/types/Login";

const COLUMN_WIDTH = 120;
const GALLERY_HEIGHT = "300vh";
const ANIMATION_DELAYS = [0, 200, 400]; // ms

// Gallery column component
type GalleryColumnProps = {
  col: Examples[];
  colIdx: number;
};

const GalleryColumn = ({ col, colIdx }: GalleryColumnProps) => {
  const scrollClass = colIdx === 1 ? "login-scroll-up" : "login-scroll-down";
  const animationDelay = `${ANIMATION_DELAYS[colIdx]}ms`;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: GALLERY_HEIGHT, width: `${COLUMN_WIDTH}px` }}
    >
      <div className={scrollClass} style={{ animationDelay }}>
        {/* Two stacks for seamless loop */}
        {[0, 1].map((stackKey) => (
          <div key={stackKey} className="flex flex-col gap-1">
            {col.map((item, i) => {
              const imgUrl = item.image.url ?? item.video.url ?? "";
              return (
                <div
                  key={`${stackKey}-${i}`}
                  className="relative cursor-pointer hover:scale-105 transition-all duration-300"
                  style={{
                    width: `${COLUMN_WIDTH}px`,
                    aspectRatio: "9 / 16",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover rounded"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryColumn;

import type { CharacterInfo } from "@/types/Character";
import { Skeleton, Popover } from "antd";
import { cn } from "@/utils/style_utils";
import { useRef } from "react";

type CharacterSliderProps = {
  characterList: CharacterInfo[];
  currentCharacter: CharacterInfo | null;
  changeCharacter: (character: CharacterInfo) => void;
};

const CharacterSlider = ({
  characterList,
  currentCharacter,
  changeCharacter,
}: CharacterSliderProps) => {
  const getCharacterOrder = (character: CharacterInfo): number => {
    if (!currentCharacter || characterList.length === 0) return 0;
    const len = characterList.length;
    const currentIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    const charIdx = characterList.findIndex(
      (c) => c.character_id === character.character_id
    );
    if (currentIdx === -1 || charIdx === -1) return 0;

    const center = Math.floor(len / 2);

    let offset = charIdx - currentIdx;
    // Normalize to shortest path around circle
    if (offset > len / 2) offset -= len;
    if (offset < -len / 2) offset += len;

    return center + offset;
  };

  const timerRef = useRef<number | null>(null);
  const stepToIndex = (targetIdx: number) => {
    if (!currentCharacter || characterList.length === 0) return;
    const len = characterList.length;
    let curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    if (curIdx === -1 || targetIdx === curIdx) return;
    const forward = (targetIdx - curIdx + len) % len; // steps if going forward
    const backward = (curIdx - targetIdx + len) % len; // steps if going backward
    const dir = forward <= backward ? 1 : -1;
    let steps = Math.min(forward, backward);
    const run = () => {
      if (steps <= 0) {
        timerRef.current = null;
        return;
      }
      curIdx = (curIdx + dir + len) % len;
      changeCharacter(characterList[curIdx]);
      steps -= 1;
      timerRef.current = window.setTimeout(run, 60);
    };
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    run();
  };

  const nineCount = () => 13;

  return (
    <div className="w-full h-full rounded-md bg-white/10 p-2 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden">
      {characterList.length > 0 && currentCharacter ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          {characterList.map((character) => {
            const order = getCharacterOrder(character);
            const center = Math.floor(characterList.length / 2);
            const isCenter = order === center;
            return (
              <Popover
                key={character.character_id}
                content={
                  <img
                    src={character.image.url}
                    alt={character.character_name}
                    className="w-[200px] h-[264px] object-cover rounded-2xl overflow-hidden"
                  />
                }
                placement="left"
                align={{ offset: [-15, 0] }}
                arrow={false}
              >
                <div
                  className={cn(
                    "w-full cursor-pointer hover:scale-110 overflow-hidden",
                    isCenter
                      ? "h-[76px] w-[76px] rounded-full"
                      : "shadow-[0_0_13.5px_0_rgba(0,0,0,0.25)] opacity-70 h-7 rounded-[50%]"
                  )}
                  style={{
                    order: order,
                    transition:
                      "all 300ms cubic-bezier(0.4, 0, 0.2, 1), order 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "height, width, opacity, transform, order",
                  }}
                  onClick={() => {
                    const targetIdx = characterList.findIndex(
                      (c) => c.character_id === character.character_id
                    );
                    stepToIndex(targetIdx);
                  }}
                >
                  <img
                    src={character.image.url}
                    alt={character.character_name}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-300",
                      isCenter ? "rounded-full" : "rounded-[50%]"
                    )}
                  />
                </div>
              </Popover>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {Array.from({ length: nineCount() }).map((_, idx) => {
              const center = Math.floor(nineCount() / 2);
              const isCenter = idx === center;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-full transition-all duration-300 overflow-hidden",
                    isCenter
                      ? "flex items-center justify-center"
                      : "shadow-[0_0_13.5px_0_rgba(0,0,0,0.25)] opacity-70 h-7 rounded-[50%]"
                  )}
                >
                  {isCenter ? (
                    <Skeleton.Avatar active size={50} shape="circle" />
                  ) : (
                    <Skeleton.Button
                      active
                      block
                      shape="round"
                      style={{ height: 28 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSlider;

import type { Character } from "@/types/Character";
import { Spin, Popover } from "antd";
import { cn } from "@/utils/style_utils";
import { useMemo, useRef } from "react";

type CharacterSliderProps = {
  characterList: Character[];
  currentCharacter: Character | null;
  changeCharacter: (character: Character) => void;
};

const CharacterSlider = ({
  characterList,
  currentCharacter,
  changeCharacter,
}: CharacterSliderProps) => {
  const { rotated, midIndex } = useMemo(() => {
    if (!characterList.length || !currentCharacter) {
      return { rotated: characterList, midIndex: 0 };
    }
    const len = characterList.length;
    const currentIdx = characterList.findIndex(
      (c) => c.id === currentCharacter.id
    );
    const center = Math.floor(len / 2);
    const start = (((currentIdx - center) % len) + len) % len;
    const rotatedList = [
      ...characterList.slice(start),
      ...characterList.slice(0, start),
    ];
    return { rotated: rotatedList, midIndex: center };
  }, [characterList, currentCharacter]);

  // Step-by-step change to target index (circular), for smooth visual transition
  const timerRef = useRef<number | null>(null);
  const stepToIndex = (targetIdx: number) => {
    if (!currentCharacter || characterList.length === 0) return;
    const len = characterList.length;
    let curIdx = characterList.findIndex((c) => c.id === currentCharacter.id);
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

  return (
    <div className="w-full h-full rounded-md bg-white/10 p-2 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden">
      {rotated.length > 0 && currentCharacter ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          {rotated.map((character, idx) => {
            const isCenter = idx === midIndex;
            return (
              <Popover
                key={character.id}
                content={
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-[200px] h-[264px] object-cover rounded-2xl overflow-hidden"
                  />
                }
                placement="left"
                align={{ offset: [-15, 0] }}
                arrow={false}
              >
                <div
                  key={character.id}
                  className={cn(
                    "w-full transition-all duration-300 cursor-pointer hover:scale-110 overflow-hidden",
                    isCenter
                      ? "h-[76px] w-[76px] rounded-full"
                      : "shadow-[0_0_13.5px_0_rgba(0,0,0,0.25)] opacity-70 h-7 rounded-[50%]"
                  )}
                  onClick={() => {
                    const targetIdx = characterList.findIndex(
                      (c) => c.id === character.id
                    );
                    stepToIndex(targetIdx);
                  }}
                >
                  <img
                    src={character.image}
                    alt={character.name}
                    className={cn(
                      "w-full h-full object-cover",
                      isCenter ? "rounded-full" : "rounded-[50%]"
                    )}
                  />
                </div>
              </Popover>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

export default CharacterSlider;

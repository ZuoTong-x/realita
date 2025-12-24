import { create } from "zustand";
import type { CharacterInfo } from "../types";

type CharacterListStore = {
  characterList: CharacterInfo[];
  setCharacterList: (characterList: CharacterInfo[]) => void;
  currentCharacter: CharacterInfo | null;
  setCurrentCharacter: (currentCharacter: CharacterInfo | null) => void;
};

const useCharacterListStore = create<CharacterListStore>((set) => ({
  characterList: [],
  currentCharacter: null,

  setCharacterList: (characterList) => set({ characterList }),
  setCurrentCharacter: (currentCharacter) => set({ currentCharacter }),
}));

export default useCharacterListStore;

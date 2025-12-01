import { create } from "zustand";
import type { Character } from "../types";

type CharacterListStore = {
  characterList: Character[];
  setCharacterList: (characterList: Character[]) => void;
  currentCharacter: Character | null;
  setCurrentCharacter: (currentCharacter: Character | null) => void;
};

const useCharacterListStore = create<CharacterListStore>((set) => ({
  characterList: [],
  currentCharacter: null,

  setCharacterList: (characterList) => set({ characterList }),
  setCurrentCharacter: (currentCharacter) => set({ currentCharacter }),
}));

export default useCharacterListStore;

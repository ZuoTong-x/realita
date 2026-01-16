import { create } from "zustand";
import type { CharacterInfo } from "../types";

type CharacterListStore = {
  characterList: CharacterInfo[];
  setCharacterList: (characterList: CharacterInfo[]) => void;
  currentCharacter: CharacterInfo | null;
  setCurrentCharacter: (currentCharacter: CharacterInfo | null) => void;
  userLikedCharacters: string[];
  setUserLikedCharacters: (userLikedCharacters: string[]) => void;
};

const useCharacterListStore = create<CharacterListStore>((set) => ({
  characterList: [],
  currentCharacter: null,
  userLikedCharacters: [],
  setCharacterList: (characterList) => set({ characterList }),
  setCurrentCharacter: (currentCharacter) => set({ currentCharacter }),
  setUserLikedCharacters: (userLikedCharacters) => set({ userLikedCharacters }),
}));

export default useCharacterListStore;

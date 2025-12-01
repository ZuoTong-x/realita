import { create } from "zustand";
import { CreateStatus, type Character } from "../types";

type CharacterStore = {
  createStatus: CreateStatus;
  setCreateStatus: (createStatus: CreateStatus) => void;
  imageInfo: File | null;
  setImageInfo: (imageInfo: File | null) => void;
  characterInfo: Character | null;
  setCharacterInfo: (characterInfo: Character) => void;
  voiceInfo: File | null;
  setVoiceInfo: (voiceInfo: File) => void;
};

const useCharacterStore = create<CharacterStore>((set) => ({
  createStatus: CreateStatus.INIT,
  imageInfo: null,
  characterInfo: null,
  voiceInfo: null,

  setImageInfo: (imageInfo: File | null) => {
    set({ imageInfo });
  },
  setVoiceInfo: (voiceInfo: File) => {
    set({ voiceInfo });
  },
  setCharacterInfo: (characterInfo: Character) => {
    set({ characterInfo });
  },
  setCreateStatus: (createStatus: CreateStatus) => {
    set({ createStatus });
  },
}));

export default useCharacterStore;

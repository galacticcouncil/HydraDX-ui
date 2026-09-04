import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AvatarStyle = "identican" | "emoji"

type AvatarStyleStore = {
  avatarStyle: AvatarStyle
  setAvatarStyle: (avatarStyle: AvatarStyle) => void
}

export const useAvatarStyleStore = create<AvatarStyleStore>()(
  persist(
    (set) => ({
      avatarStyle: "identican",
      setAvatarStyle: (avatarStyle) => set({ avatarStyle }),
    }),
    {
      name: "avatar-style",
      version: 1,
    },
  ),
)

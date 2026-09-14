import { createZustandStorage } from "@galacticcouncil/utils"
import * as z from "zod/v4"
import { create, StateCreator, StoreApi, UseBoundStore } from "zustand"
import { persist } from "zustand/middleware"

import { isTutorialId } from "@/modules/tutorials/utils/arbitration"

const tutorialsSchema = z.object({
  retiredIds: z.array(z.string()).catch([]),
  progress: z.record(z.string(), z.number()).catch({}),
})

export type TutorialsState = z.infer<typeof tutorialsSchema>

type TutorialsActions = {
  retireTutorial: (id: string) => void
  setProgress: (id: string, stepIndex: number) => void
}

export type TutorialsStore = TutorialsState & TutorialsActions

const defaultState: TutorialsState = {
  retiredIds: [],
  progress: {},
}

export const normalizeStepIndex = (value: number): number =>
  Number.isSafeInteger(value) && value > 0 ? value : 0

const omit = (progress: TutorialsState["progress"], id: string) =>
  Object.fromEntries(Object.entries(progress).filter(([key]) => key !== id))

export const mergePersistedTutorials = (
  persistedState: unknown,
  currentState: TutorialsStore,
): TutorialsStore => {
  const persisted = tutorialsSchema
    .catch(defaultState)
    .parse(persistedState ?? defaultState)

  const retiredIds = [...new Set(persisted.retiredIds)].filter(isTutorialId)

  const progress = Object.fromEntries(
    Object.entries(persisted.progress)
      .filter(([id]) => isTutorialId(id) && !retiredIds.includes(id))
      .map(([id, stepIndex]) => [id, normalizeStepIndex(stepIndex)]),
  )

  return { ...currentState, retiredIds, progress }
}

const initializer: StateCreator<TutorialsStore> = (set) => ({
  ...defaultState,
  retireTutorial: (id) =>
    set((state) => ({
      retiredIds: state.retiredIds.includes(id)
        ? state.retiredIds
        : [...state.retiredIds, id],
      progress: omit(state.progress, id),
    })),
  setProgress: (id, stepIndex) =>
    set((state) =>
      state.retiredIds.includes(id)
        ? state
        : {
            progress: {
              ...state.progress,
              [id]: normalizeStepIndex(stepIndex),
            },
          },
    ),
})

const isStorageAvailable = () => {
  try {
    const probe = "tutorial-hints.probe"
    window.localStorage.setItem(probe, "1")
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export const useTutorialsStore: UseBoundStore<StoreApi<TutorialsStore>> =
  isStorageAvailable()
    ? create<TutorialsStore>()(
        persist(initializer, {
          ...createZustandStorage({
            name: "tutorial-hints",
            version: 1,
            schema: tutorialsSchema,
            defaultState,
          }),
          merge: mergePersistedTutorials,
        }),
      )
    : create<TutorialsStore>()(initializer)

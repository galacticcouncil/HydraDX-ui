import { TutorialsState, useTutorialsStore } from "@/states/tutorials"

const RESET_PARAM = "resetTutorials"
const RESET_ALL = "all"

export const resetTutorialsState = (
  state: TutorialsState,
  target: string,
): TutorialsState => {
  if (target === RESET_ALL) return { retiredIds: [], progress: {} }

  return {
    retiredIds: state.retiredIds.filter((id) => id !== target),
    progress: Object.fromEntries(
      Object.entries(state.progress).filter(([id]) => id !== target),
    ),
  }
}

/** `?resetTutorials=` replays a hint once, then strips the param. */
export const applyResetTutorialsParam = () => {
  const url = new URL(window.location.href)
  const target = url.searchParams.get(RESET_PARAM)
  if (target === null) return

  useTutorialsStore.setState((state) => resetTutorialsState(state, target))

  url.searchParams.delete(RESET_PARAM)
  window.history.replaceState(null, "", url)
}

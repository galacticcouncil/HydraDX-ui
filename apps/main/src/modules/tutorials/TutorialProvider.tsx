import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { useIsOverlayOpen } from "@/hooks/useIsOverlayOpen"
import { TutorialId } from "@/modules/tutorials/config"
import {
  anchorKey,
  isSameCandidate,
  mountAnchor,
  MountedAnchors,
  selectLiveTutorial,
  TutorialCandidate,
  tutorialEntries,
  unmountAnchor,
} from "@/modules/tutorials/utils/arbitration"
import { useTransactionsStore } from "@/states/transactions"
import { useTutorialsStore } from "@/states/tutorials"

const OPEN_DELAY = 400
const PREDICATE_POLL = 1000

type TutorialContextValue = {
  live: TutorialCandidate | null
  registerAnchor: (id: TutorialId, stepIndex: number) => () => void
  advance: (id: TutorialId) => void
  retire: (id: TutorialId) => void
}

const TutorialContext = createContext<TutorialContextValue>({
  live: null,
  registerAnchor: () => () => {},
  advance: () => {},
  retire: () => {},
})

export const useTutorialContext = () => useContext(TutorialContext)

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [anchors, setAnchors] = useState<MountedAnchors>(new Map())
  const [candidate, setCandidate] = useState<TutorialCandidate | null>(null)
  const [openedKey, setOpenedKey] = useState<string | null>(null)

  const retiredIds = useTutorialsStore((state) => state.retiredIds)
  const progress = useTutorialsStore((state) => state.progress)
  const retireTutorial = useTutorialsStore((state) => state.retireTutorial)
  const setProgress = useTutorialsStore((state) => state.setProgress)

  const isOverlayOpen = useIsOverlayOpen()
  const isTransacting = useTransactionsStore(
    (state) =>
      state.transactions.length > 0 || state.pendingTransactions.length > 0,
  )
  const isSuppressed = isOverlayOpen || isTransacting

  const registerAnchor = useCallback((id: TutorialId, stepIndex: number) => {
    const key = anchorKey(id, stepIndex)
    setAnchors((current) => mountAnchor(current, key))
    return () => setAnchors((current) => unmountAnchor(current, key))
  }, [])

  useEffect(() => {
    const evaluate = () =>
      setCandidate((current) => {
        const next = isSuppressed
          ? null
          : selectLiveTutorial({
              entries: tutorialEntries,
              anchors,
              retiredIds,
              progress,
            })

        return isSameCandidate(current, next) ? current : next
      })

    evaluate()

    if (anchors.size === 0) return

    const interval = setInterval(evaluate, PREDICATE_POLL)
    return () => clearInterval(interval)
  }, [anchors, isSuppressed, progress, retiredIds])

  const candidateKey = candidate
    ? anchorKey(candidate.id, candidate.stepIndex)
    : null

  useEffect(() => {
    if (!candidateKey) {
      setOpenedKey(null)
      return
    }

    const timeout = setTimeout(() => setOpenedKey(candidateKey), OPEN_DELAY)
    return () => clearTimeout(timeout)
  }, [candidateKey])

  const value = useMemo<TutorialContextValue>(
    () => ({
      live: candidateKey && candidateKey === openedKey ? candidate : null,
      registerAnchor,
      advance: (id) => {
        if (!candidate || candidate.id !== id) return

        const next = candidate.stepIndex + 1
        if (next >= candidate.stepCount) retireTutorial(id)
        else setProgress(id, next)
      },
      retire: retireTutorial,
    }),
    [
      candidate,
      candidateKey,
      openedKey,
      registerAnchor,
      retireTutorial,
      setProgress,
    ],
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

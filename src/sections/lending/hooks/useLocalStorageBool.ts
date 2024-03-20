import { useCallback, useState } from "react"

const toggleLocalStorageClick = (
  value: boolean,
  func: (val: boolean) => void,
  localStorageName: string,
) => {
  if (value) {
    localStorage.setItem(localStorageName, "false")
    console.log("setting", localStorageName, false)
    func(false)
  } else {
    localStorage.setItem(localStorageName, "true")
    console.log("setting", localStorageName, true)
    func(true)
  }
}

export function useLocalStorageBool(
  localStorageName: string,
): [boolean, (value: boolean) => void] {
  const [state, setState] = useState(
    localStorage.getItem(localStorageName) === "true",
  )
  const onChange = useCallback(
    (value: boolean) => {
      toggleLocalStorageClick(!value, () => setState(value), localStorageName)
    },
    [localStorageName],
  )
  return [state, onChange]
}

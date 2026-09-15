import { useDebounce } from "use-debounce"

export const useDebouncedValue = <T>(value: T, ms = 250) => {
  const [debounced] = useDebounce(value, ms)

  return [debounced, debounced === value] as const
}

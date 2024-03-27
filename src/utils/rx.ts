export const pluck = <TArr, TKey extends keyof TArr>(
  key: TKey,
  arr: TArr[],
): TArr[TKey][] => arr.map((item) => item[key])

export const omit = <T, K extends keyof T>(keys: K[], obj: T): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })
  return result
}

type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    result[key] = obj[key]
  })
  return result
}

export const groupBy = <T>(
  array: T[],
  groupByFn: (item: T) => string,
): Record<string, T[]> => {
  return array.reduce(
    (result, item) => {
      const key = groupByFn(item)
      if (!result[key]) {
        result[key] = []
      }
      result[key].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}

export function uniqBy<T, K>(keyFn: (item: T) => K, list: T[]): T[] {
  const seen = new Set<K>()
  const result: T[] = []

  for (const item of list) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}

export function diffBy<T>(
  diffFn: (item: T) => string,
  arr1: T[],
  arr2: T[],
): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of arr2) {
    seen.add(diffFn(item))
  }

  for (const item of arr1) {
    if (!seen.has(diffFn(item))) {
      result.push(item)
    }
  }

  return result
}

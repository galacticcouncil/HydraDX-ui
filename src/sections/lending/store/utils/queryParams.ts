export const setQueryParameter = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    window.history.pushState(
      { query: { ...getAllQueryParameters(), [key]: value } },
      "",
    )
  }
}

export const getQueryParameter = (key: string) => {
  if (typeof window !== "undefined" && "URLSearchParams" in window) {
    const proxy = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop as string),
    })
    return (proxy as unknown as { [key: string]: string })[key]
  }
}

export const getAllQueryParameters = () => {
  if (typeof window !== "undefined" && "URLSearchParams" in window) {
    const urlSearchParams = new URLSearchParams(window.location.search)
    return Object.fromEntries(urlSearchParams.entries())
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest.body != null && !(rest.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

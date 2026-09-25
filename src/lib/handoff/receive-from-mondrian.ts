// Receiving end of Mondrian's "Send to IGS": opened with ?import=mondrian, IGS posts "ready"
// to its opener until the files arrive, and accepts them only from an allowed Mondrian origin.
export const HANDOFF_VERSION = 1

const MONDRIAN_ORIGINS = ['https://mondrian.interactiongeography.org']
const LOCALHOST = /^http:\/\/localhost:\d+$/

export function isAllowedMondrianOrigin(
  origin: string,
  dev: boolean,
  extra: string[] = []
): boolean {
  if (MONDRIAN_ORIGINS.includes(origin) || extra.includes(origin)) return true
  return dev && LOCALHOST.test(origin)
}

export function wantsMondrianImport(url: URL): boolean {
  return url.searchParams.get('import') === 'mondrian'
}

function isFileMessage(data: unknown): data is { files: File[] } {
  const message = data as { type?: unknown; files?: unknown } | null
  return (
    message?.type === 'mondrian:files' &&
    Array.isArray(message.files) &&
    message.files.every((f) => f instanceof File)
  )
}

/** Resolves with the files Mondrian sends, or null if none arrive in time. */
export function receiveFromMondrian(
  opener: Window,
  options: { dev: boolean; extraOrigins?: string[]; timeoutMs?: number; intervalMs?: number }
): Promise<File[] | null> {
  const { dev, extraOrigins = [], timeoutMs = 20000, intervalMs = 500 } = options

  return new Promise((resolve) => {
    const finish = (files: File[] | null) => {
      window.removeEventListener('message', onMessage)
      clearInterval(ping)
      clearTimeout(timer)
      resolve(files)
    }

    const onMessage = (event: MessageEvent) => {
      if (event.source !== opener) return
      if (!isAllowedMondrianOrigin(event.origin, dev, extraOrigins)) return
      if (!isFileMessage(event.data)) return
      opener.postMessage({ type: 'igs:received', version: HANDOFF_VERSION }, event.origin)
      finish(event.data.files)
    }

    // "ready" carries no data, so it can go to any origin; the files come back only to IGS.
    const announce = () => opener.postMessage({ type: 'igs:ready', version: HANDOFF_VERSION }, '*')
    window.addEventListener('message', onMessage)
    const ping = setInterval(announce, intervalMs)
    const timer = setTimeout(() => finish(null), timeoutMs)
    announce()
  })
}

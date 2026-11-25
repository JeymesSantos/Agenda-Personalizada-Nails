export type InstallEnvironment = {
  platform: "ios" | "android" | "mac" | "desktop"
  browser: "internal" | "edge" | "chrome" | "firefox" | "safari" | "other"
}

/** A capacidade de instalar é verificada pela API; o navegador orienta apenas o fallback. */
export function detectInstallEnvironment(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): InstallEnvironment {
  const ios = /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1)
  const os = ios
    ? "ios"
    : /Android/i.test(userAgent)
      ? "android"
      : /Mac/i.test(platform)
        ? "mac"
        : "desktop"
  const browser = /Instagram|FBAN|FBAV|TikTok|Bytedance|Snapchat|\bLine\/|WhatsApp|; wv\)/i.test(
    userAgent,
  )
    ? "internal"
    : /Edg\/|EdgA\/|EdgiOS\//i.test(userAgent)
      ? "edge"
      : /Chrome\/|CriOS\//i.test(userAgent)
        ? "chrome"
        : /Firefox\/|FxiOS\//i.test(userAgent)
          ? "firefox"
          : /Safari\//i.test(userAgent)
            ? "safari"
            : "other"
  return { platform: os, browser }
}

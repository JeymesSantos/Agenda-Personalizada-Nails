import { describe, expect, it } from "vitest"

import { detectInstallEnvironment } from "./install-environment"

describe("ambiente de instalação", () => {
  it.each([
    ["Mozilla/5.0 Chrome/145.0 Safari/537.36", "Win32", 0, "desktop", "chrome"],
    ["Mozilla/5.0 Chrome/145.0 Safari/537.36 Edg/145.0", "Win32", 0, "desktop", "edge"],
    [
      "Mozilla/5.0 (Linux; Android 14) Chrome/145.0 Safari/537.36",
      "Linux arm",
      5,
      "android",
      "chrome",
    ],
    ["Mozilla/5.0 (iPhone) Version/26.0 Mobile Safari/604.1", "iPhone", 5, "ios", "safari"],
    ["Mozilla/5.0 (iPhone) CriOS/145.0 Mobile Safari/604.1", "iPhone", 5, "ios", "chrome"],
    ["Mozilla/5.0 (Macintosh) Version/26.0 Safari/605.1", "MacIntel", 5, "ios", "safari"],
    ["Mozilla/5.0 (Macintosh) Version/26.0 Safari/605.1", "MacIntel", 0, "mac", "safari"],
    ["Mozilla/5.0 (iPhone) Mobile Safari/604.1 Instagram 300", "iPhone", 5, "ios", "internal"],
    [
      "Mozilla/5.0 (Linux; Android 14; wv) Chrome/145.0 Safari/537.36",
      "Linux arm",
      5,
      "android",
      "internal",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14) Chrome/145.0 [FBAN/FB4A;FBAV/500]",
      "Linux arm",
      5,
      "android",
      "internal",
    ],
    ["Mozilla/5.0 Firefox/145.0", "Win32", 0, "desktop", "firefox"],
    ["Desconhecido", "", 0, "desktop", "other"],
  ] as const)("identifica %s em %s", (ua, platform, touch, expectedPlatform, expectedBrowser) => {
    expect(detectInstallEnvironment(ua, platform, touch)).toEqual({
      platform: expectedPlatform,
      browser: expectedBrowser,
    })
  })
})

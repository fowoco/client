/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const WHITE = '#ffffff'
const tokensCss = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

function token(name: string) {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`))

  if (!match) {
    throw new Error(`CSS token not found: ${name}`)
  }

  return match[1]
}

function relativeLuminance(hex: string) {
  const normalized =
    hex.length === 4
      ? hex
          .slice(1)
          .split('')
          .map((digit) => digit.repeat(2))
          .join('')
      : hex.slice(1)
  const channels = normalized.match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255)

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const [red, green, blue] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  )

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(foreground: string, background: string) {
  const brighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))

  return (brighter + 0.05) / (darker + 0.05)
}

describe('상태 색상 토큰', () => {
  it.each(['red', 'amber', 'green'])(
    '%s 상태 텍스트가 흰색과 옅은 상태 배경에서 WCAG AA 대비를 충족한다',
    (color) => {
      const foreground = token(`fowoco-${color}-600`)
      const tint = token(`fowoco-${color}-50`)

      expect(contrastRatio(foreground, WHITE)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(foreground, tint)).toBeGreaterThanOrEqual(4.5)
    },
  )
})

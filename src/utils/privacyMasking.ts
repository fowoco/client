const SENSITIVE_OCR_FIELDS = new Set([
  'passport_number',
  'alien_registration_number',
  'surname',
  'given_names',
  'date_of_birth',
  'residence_address_1',
])

export function isSensitiveOcrField(field: string): boolean {
  return SENSITIVE_OCR_FIELDS.has(field)
}

export function maskSensitiveValue(field: string, value: string): string {
  if (!value || !isSensitiveOcrField(field)) return value
  if (field === 'alien_registration_number') {
    const normalized = value.replace(/\s/g, '')
    const separator = normalized.includes('-') ? '-' : ''
    const visiblePrefix = normalized.slice(0, 6)
    const visibleGenderCode = normalized.replace('-', '').slice(6, 7)
    return `${visiblePrefix}${separator}${visibleGenderCode}${'*'.repeat(Math.max(0, normalized.replace('-', '').length - 7))}`
  }
  if (field === 'passport_number') {
    return value.length <= 4
      ? '*'.repeat(value.length)
      : `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
  }
  if (field === 'date_of_birth') {
    return value.replace(/\d(?=\d{2})/g, '*')
  }
  if (field === 'residence_address_1') {
    return value.length <= 4
      ? '****'
      : `${value.slice(0, 4)}${'*'.repeat(Math.min(8, value.length - 4))}`
  }
  const characters = Array.from(value)
  if (characters.length <= 1) return '*'
  return `${characters[0]}${'*'.repeat(characters.length - 1)}`
}

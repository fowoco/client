import { describe, expect, it } from 'vitest'
import { isSensitiveOcrField, maskSensitiveValue } from './privacyMasking'

describe('privacyMasking', () => {
  it('masks identifiers while retaining the minimum comparison hint', () => {
    expect(maskSensitiveValue('passport_number', 'M12345678')).toBe('M1*****78')
    expect(maskSensitiveValue('alien_registration_number', '930101-5123456')).toBe('930101-5******')
  })

  it('masks names and addresses but leaves operational dates untouched', () => {
    expect(maskSensitiveValue('given_names', 'NGUYEN VAN AN')).toBe('N************')
    expect(maskSensitiveValue('residence_address_1', '경기도 안산시 단원구')).toMatch(/^경기도 /)
    expect(maskSensitiveValue('stay_expiration_date', '2026-12-31')).toBe('2026-12-31')
    expect(isSensitiveOcrField('passport_number')).toBe(true)
  })
})

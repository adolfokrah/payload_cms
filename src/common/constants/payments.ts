export const PAYMENT_METHODS = {
  mobileMoney: 'Mobile Money',
} as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]
export const PAYMENT_METHOD_OPTIONS = Object.values(PAYMENT_METHODS)

export const PAYMENT_METHOD_MOBILE_MONEY = {
  mtn: 'MTN',
  telecel: 'Telecel',
  airtelTigo: 'AirtelTigo',
} as const

export type MobileMoneyProvider =
  (typeof PAYMENT_METHOD_MOBILE_MONEY)[keyof typeof PAYMENT_METHOD_MOBILE_MONEY]
export const PAYMENT_METHOD_MOBILE_MONEY_OPTIONS = Object.values(PAYMENT_METHOD_MOBILE_MONEY)

export const CURRENCY_OPTIONS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GHS', value: 'GHS' },
  // Add more as needed
]

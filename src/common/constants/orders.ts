export const ORDER_STATUS_OPTIONS = [
  { label: 'Processing', value: 'processing' },
  { label: 'Our for delivery', value: 'out_for_delivery' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

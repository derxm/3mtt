export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function daysLeft(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const CATEGORY_COLORS = {
  Emergency: { accent: '#ff9100', dim: 'rgba(255,145,0,0.15)' },
  Travel:    { accent: '#448aff', dim: 'rgba(68,138,255,0.15)' },
  Tech:      { accent: '#e040fb', dim: 'rgba(224,64,251,0.15)' },
  Education: { accent: '#00e676', dim: 'rgba(0,230,118,0.15)' },
  Health:    { accent: '#ff1744', dim: 'rgba(255,23,68,0.15)' },
  Home:      { accent: '#ffd600', dim: 'rgba(255,214,0,0.15)' },
  Other:     { accent: 'rgba(255,255,255,0.6)', dim: 'rgba(255,255,255,0.08)' },
}

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
}

export const CATEGORIES = Object.keys(CATEGORY_COLORS)

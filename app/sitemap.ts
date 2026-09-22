import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reviewdot.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: updated, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/product`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/solutions`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: updated, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/resources`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/signup`, lastModified: updated, changeFrequency: 'yearly', priority: 0.7 },
  ]
}

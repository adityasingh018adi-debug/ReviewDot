import type { Metadata } from 'next'
import { Landing } from '@/views/marketing/Landing'

export const metadata: Metadata = {
  title: 'ReviewDot — AI Customer Review & Feedback Platform',
  description:
    'Turn every customer experience into a review. Collect feedback from a QR scan, create AI-assisted reviews customers approve in their own words, and track every outlet.',
  alternates: { canonical: '/' },
}

/** Structured data so the homepage describes the product to crawlers. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ReviewDot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered customer feedback and review management for businesses with one outlet or hundreds.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: 'Free plan for a single outlet',
  },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Landing />
    </>
  )
}

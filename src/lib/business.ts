import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BusinessType = 'clinic' | 'restaurant' | 'hotel' | 'salon' | 'gym' | 'retail'

export interface BusinessProfile {
  id: BusinessType
  label: string
  emoji: string
  /** service areas reviews reference */
  services: string[]
  /** review topics used as tags and complaint analysis */
  topics: string[]
  bodies: { positive: string[]; neutral: string[]; negative: string[] }
  titles: { positive: string[]; neutral: string[]; negative: string[] }
  /** AI action suggestions tailored to this business type */
  actions: Array<{
    tone: 'opportunity' | 'risk' | 'trend'
    title: string
    body: string
    action: string
    confidence: number
  }>
}

export const BUSINESS_TYPES: BusinessProfile[] = [
  {
    id: 'clinic',
    label: 'Clinic',
    emoji: '🏥',
    services: ['General Checkups', 'Dental', 'Pediatrics', 'Diagnostics', 'Physiotherapy'],
    topics: [
      'wait-time',
      'staff',
      'cleanliness',
      'billing',
      'booking',
      'treatment',
      'communication',
      'parking',
    ],
    bodies: {
      positive: [
        'Dr. Mehta took real time to explain my treatment options. The clinic was spotless and the front desk got me in within ten minutes of my appointment slot.',
        'Booked online, saw the pediatrician the same week, and got clear follow-up instructions by message. This is how healthcare should work.',
        'The physiotherapy team is outstanding — my recovery plan was personalized and they checked in between sessions.',
      ],
      neutral: [
        'Good doctors and clean facilities. The wait ran about 25 minutes past my appointment time, though the staff apologized and kept me updated.',
        'Treatment was thorough but the billing desk couldn’t explain my insurance breakdown on the spot — took a follow-up call to resolve.',
      ],
      negative: [
        'Waited over an hour past my scheduled slot with no updates. The care itself was fine but the scheduling clearly needs work.',
        'Was charged for a consultation item I never received. It was reversed after two calls, but the billing process needs to be much clearer.',
      ],
    },
    titles: {
      positive: [
        'Genuinely caring doctors',
        'Smooth from booking to follow-up',
        'Best clinic experience I’ve had',
      ],
      neutral: ['Good care, slow front desk', 'Solid clinic with billing quirks'],
      negative: ['Scheduling needs serious work', 'Billing errors soured the visit'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Wait-time complaints rising',
        body: 'Mentions of long waits grew 34% this month, concentrated on Monday and Friday mornings. Adding a same-day overflow slot or SMS delay alerts would defuse most of them.',
        action: 'Set up delay alerts',
        confidence: 91,
      },
      {
        tone: 'opportunity',
        title: 'Patients praise follow-up messages',
        body: 'Reviews that mention your follow-up messages average 4.9★. Extending automated follow-ups to diagnostics patients would lift satisfaction in your lowest-rated service line.',
        action: 'Extend follow-ups',
        confidence: 88,
      },
      {
        tone: 'trend',
        title: 'Online booking drives 5★ reviews',
        body: 'Patients who book online leave positive reviews 2.1× more often than walk-ins. Promoting the booking link in reply templates compounds this effect.',
        action: 'Promote booking link',
        confidence: 90,
      },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    services: ['Dine-in', 'Takeaway', 'Delivery', 'Catering', 'Weekend Brunch'],
    topics: [
      'food-quality',
      'service-speed',
      'staff',
      'ambience',
      'pricing',
      'hygiene',
      'portions',
      'reservations',
    ],
    bodies: {
      positive: [
        'The tasting menu was phenomenal — every course landed. Our server Maya remembered our anniversary from the reservation note and made the night special.',
        'Ordered delivery on a Friday rush and it still arrived hot in 30 minutes. Portions are generous and the packaging didn’t leak. New weekly regulars here.',
        'Brunch here is the best in the neighborhood. Short wait even at peak, and the kitchen handled our gluten-free request perfectly.',
      ],
      neutral: [
        'Food was great as always, but service slowed noticeably once the patio filled up. Worth it, just plan for a leisurely evening.',
        'Solid menu and fair prices. The music was a bit loud for conversation on Saturday — weeknights are a better experience.',
      ],
      negative: [
        'Waited 50 minutes for mains while tables seated after us were served first. The manager comped dessert, but the kitchen coordination was clearly off.',
        'Delivery arrived cold and missing a side. Support refunded it quickly, but that’s twice this month.',
      ],
    },
    titles: {
      positive: ['Every course was a hit', 'Fast, hot delivery every time', 'Neighborhood brunch champion'],
      neutral: ['Great food, stretched service', 'Good value, loud weekends'],
      negative: ['Kitchen timing fell apart', 'Cold delivery, again'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Delivery complaints spiking on weekends',
        body: 'Cold-food mentions triple on Friday–Saturday orders over 3 km away. Capping the delivery radius during peak hours or switching couriers for far zones would cut your worst reviews.',
        action: 'Adjust delivery zones',
        confidence: 89,
      },
      {
        tone: 'opportunity',
        title: 'Servers named in reviews convert to 5★',
        body: 'Reviews naming a server average 4.8★. A table-card inviting guests to mention their server in reviews would raise both volume and rating.',
        action: 'Add table cards',
        confidence: 86,
      },
      {
        tone: 'trend',
        title: 'Brunch drives your growth',
        body: 'Weekend brunch reviews grew 41% quarter over quarter — twice any other daypart. Extending brunch hours or adding a waitlist would capture unmet demand.',
        action: 'Extend brunch hours',
        confidence: 92,
      },
    ],
  },
  {
    id: 'hotel',
    label: 'Hotel',
    emoji: '🏨',
    services: ['Rooms', 'Breakfast', 'Spa', 'Conference Rooms', 'Airport Shuttle'],
    topics: ['room-cleanliness', 'check-in', 'staff', 'breakfast', 'wifi', 'noise', 'amenities', 'value'],
    bodies: {
      positive: [
        'Check-in took two minutes, the room was immaculate, and housekeeping remembered our extra-pillow request every day. The rooftop breakfast alone is worth the stay.',
        'The concierge rebooked our airport shuttle after a flight delay without us even asking. Five stars for the staff.',
        'Quiet rooms, great water pressure, and a spa that actually honors its appointment times. We’ll be back.',
      ],
      neutral: [
        'Lovely property and friendly staff. Wi-Fi struggled during evening hours on the upper floors — fine for email, rough for video calls.',
        'Rooms are spotless, breakfast is good but repetitive on longer stays. Ask for a courtyard-facing room to avoid street noise.',
      ],
      negative: [
        'Our room wasn’t ready until 5pm despite a guaranteed 3pm check-in, and the front desk offered no updates until we pressed. Disappointing for the price point.',
        'Construction noise started at 8am with no warning at booking. The staff moved us on night two, but the first day was ruined.',
      ],
    },
    titles: {
      positive: [
        'Staff went above and beyond',
        'Immaculate rooms, superb breakfast',
        'The concierge saved our trip',
      ],
      neutral: ['Great stay, patchy Wi-Fi', 'Ask for a courtyard room'],
      negative: ['Guaranteed check-in wasn’t honored', 'Warn guests about construction'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Check-in delays hurting weekday ratings',
        body: 'Late check-in mentions cluster on Sunday–Monday turnovers. A 30-minute earlier housekeeping start on those days would lift your weekday average an estimated 0.3★.',
        action: 'Shift housekeeping start',
        confidence: 87,
      },
      {
        tone: 'opportunity',
        title: 'Breakfast is your #1 praised amenity',
        body: 'The rooftop breakfast appears in 38% of 5★ reviews. Featuring it in your booking-site photos and review replies reinforces your strongest differentiator.',
        action: 'Feature breakfast',
        confidence: 93,
      },
      {
        tone: 'trend',
        title: 'Business travelers mention Wi-Fi more',
        body: 'Wi-Fi mentions doubled since corporate bookings grew. An upper-floor access-point upgrade targets exactly where complaints originate.',
        action: 'Upgrade upper-floor Wi-Fi',
        confidence: 85,
      },
    ],
  },
  {
    id: 'salon',
    label: 'Salon',
    emoji: '💇',
    services: ['Haircuts', 'Coloring', 'Styling', 'Manicure', 'Skin Care'],
    topics: ['stylist-skill', 'wait-time', 'hygiene', 'booking', 'pricing', 'ambience', 'staff', 'products'],
    bodies: {
      positive: [
        'Priya understood exactly what I wanted from one reference photo. Best balayage I’ve had, and she talked me through maintenance without upselling.',
        'Walked in anxious about a big chop, walked out thrilled. The team checks in at every step and the head massage with the wash is a dream.',
        'Spotless stations, sterilized tools in sealed pouches, and my manicure has lasted two weeks without a chip.',
      ],
      neutral: [
        'Great cut, though my 2pm appointment started at 2:25. The complimentary coffee softened the wait.',
        'Color came out beautiful. Pricing is on the higher side — worth it for occasions, steep for regular upkeep.',
      ],
      negative: [
        'My stylist was double-booked and visibly rushed. The cut is uneven at the back and I’ll need it fixed elsewhere.',
        'Booked online for a coloring session, arrived to find the slot was never confirmed in their system. Lost my Saturday morning.',
      ],
    },
    titles: {
      positive: ['One reference photo was enough', 'They cured my haircut anxiety', 'Cleanest salon in town'],
      neutral: ['Beautiful work, running late', 'Premium results, premium prices'],
      negative: ['Rushed and uneven', 'Online booking never synced'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Online bookings failing to sync',
        body: 'Three no-slot complaints this month all trace to online bookings. Until the calendar sync is fixed, an automated confirmation SMS would prevent wasted trips.',
        action: 'Add confirmation SMS',
        confidence: 90,
      },
      {
        tone: 'opportunity',
        title: 'Named stylists build repeat business',
        body: 'Reviews naming a stylist average 4.9★ and those clients rebook 2.4× more. Stylist profile cards with rebooking QR codes would compound loyalty.',
        action: 'Create stylist cards',
        confidence: 88,
      },
      {
        tone: 'trend',
        title: 'Hygiene mentions convert browsers',
        body: 'Sealed-tool and cleanliness mentions rose 52% and correlate with new-client bookings. Making hygiene visible in photos strengthens the funnel.',
        action: 'Showcase hygiene',
        confidence: 84,
      },
    ],
  },
  {
    id: 'gym',
    label: 'Gym',
    emoji: '🏋️',
    services: ['Memberships', 'Personal Training', 'Group Classes', 'Sauna', 'Nutrition Coaching'],
    topics: [
      'equipment',
      'cleanliness',
      'crowding',
      'trainers',
      'pricing',
      'classes',
      'locker-rooms',
      'hours',
    ],
    bodies: {
      positive: [
        'Coach Andre rebuilt my deadlift form in two sessions after years of back pain. Programming is personalized, not copy-pasted.',
        'Equipment is new and actually maintained — no “out of order” signs living on machines for months. The 5am crowd is friendly.',
        'The spin classes are addictive and booking through the app takes seconds. Showers are hotel-level clean.',
      ],
      neutral: [
        'Great facility overall. The 6pm rush means waiting for squat racks — mornings are a completely different, calmer gym.',
        'Trainers are excellent, sauna is great. Locker rooms could use more frequent checks on busy evenings.',
      ],
      negative: [
        'Cancelled my membership in person and was still charged for two more months. Support fixed it, but chasing refunds shouldn’t be a workout.',
        'Half the treadmills were down for three weeks. For this price, maintenance should be same-week.',
      ],
    },
    titles: {
      positive: ['Training that actually works', 'Machines that actually work', 'Best group classes around'],
      neutral: ['Avoid the 6pm rush', 'Great gym, busy lockers'],
      negative: ['Billing after cancellation', 'Broken equipment for weeks'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Cancellation billing damaging trust',
        body: 'Post-cancellation charges generate your angriest reviews and each one deters an estimated 30 prospects. An automated cancellation confirmation email closes the loop.',
        action: 'Automate cancellations',
        confidence: 92,
      },
      {
        tone: 'opportunity',
        title: 'Trainers are your growth engine',
        body: 'Reviews naming trainers average 4.9★ and mention renewals 3× more often. Featuring trainer spotlights monthly turns them into acquisition channels.',
        action: 'Launch trainer spotlights',
        confidence: 89,
      },
      {
        tone: 'trend',
        title: 'Peak-hour crowding mentions growing',
        body: 'Crowding complaints rose 28% and cluster at 5–7pm. Publishing a live occupancy meter in the app shifts flexible members off-peak.',
        action: 'Add occupancy meter',
        confidence: 85,
      },
    ],
  },
  {
    id: 'retail',
    label: 'Retail Store',
    emoji: '🛍️',
    services: ['In-store Shopping', 'Online Orders', 'Returns', 'Loyalty Program', 'Gift Cards'],
    topics: [
      'staff-help',
      'stock',
      'pricing',
      'returns',
      'checkout-speed',
      'layout',
      'product-quality',
      'parking',
    ],
    bodies: {
      positive: [
        'The staff tracked down the last unit of the jacket I wanted at another branch and had it delivered to my door free. That’s how you earn a customer for life.',
        'Returns took ninety seconds, no interrogation, refund hit my card the same day. Shopping here is stress-free.',
        'Ordered online, picked up in store within the hour. The loyalty points added up to a real discount, not pocket lint.',
      ],
      neutral: [
        'Nice selection and helpful staff. Popular sizes sell out fast — check stock online before making the trip.',
        'Prices are fair and quality is consistent. Weekend checkout lines get long; the self-checkout kiosks help when they’re all working.',
      ],
      negative: [
        'Website said three in stock; the store had none and staff couldn’t explain the mismatch. Wasted trip across town.',
        'Was refused a return at day 32 with a gift receipt over a 30-day policy nobody mentions at purchase. Inflexible and short-sighted.',
      ],
    },
    titles: {
      positive: [
        'They chased down the last unit',
        'Returns without the interrogation',
        'Loyalty points that matter',
      ],
      neutral: ['Check stock before the trip', 'Fair prices, weekend queues'],
      negative: ['Stock counts you can’t trust', 'Return policy ambush'],
    },
    actions: [
      {
        tone: 'risk',
        title: 'Online stock counts eroding trust',
        body: 'Stock-mismatch complaints doubled this quarter and every one represents a wasted customer trip. A twice-daily inventory sync would eliminate most of them.',
        action: 'Fix inventory sync',
        confidence: 91,
      },
      {
        tone: 'opportunity',
        title: 'Frictionless returns win loyalty',
        body: 'Your fast-returns experience appears in 31% of 5★ reviews. Extending the window to 45 days for loyalty members turns policy into marketing.',
        action: 'Extend member returns',
        confidence: 87,
      },
      {
        tone: 'trend',
        title: 'Click-and-collect reviews accelerating',
        body: 'Pickup-order mentions grew 47% with a 4.8★ average. Promoting one-hour pickup on the homepage rides your strongest trend.',
        action: 'Promote 1-hour pickup',
        confidence: 90,
      },
    ],
  },
]

export function businessProfile(type: BusinessType): BusinessProfile {
  return BUSINESS_TYPES.find((b) => b.id === type) ?? BUSINESS_TYPES[1]
}

interface BusinessState {
  type: BusinessType
  name: string
  setType: (type: BusinessType) => void
  setName: (name: string) => void
}

/** The active business profile — the AI and all analytics adapt to it. */
export const useBusiness = create<BusinessState>()(
  persist(
    (set) => ({
      type: 'restaurant',
      name: 'Solstice & Co.',
      setType: (type) => set({ type }),
      setName: (name) => set({ name }),
    }),
    { name: 'reviewdot-business' },
  ),
)

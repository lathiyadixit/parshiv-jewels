/* Editorial content: testimonials, gallery tiles, FAQs and the copy for
   every informational page. Kept as data so the page modules stay thin. */

export const TESTIMONIALS = [
  { author: 'Meera Patel', context: 'Bridal · Surat', body: 'The necklace I ordered for my wedding was beyond imagination. Pure elegance, and the WhatsApp ordering was so easy.' },
  { author: 'Rajesh Shah', context: 'Solitaire · Vadodara', body: 'Bought a solitaire ring — certificate, packaging, delivery, everything felt premium. Highly recommended in Surat.' },
  { author: 'Anjali Desai', context: 'Jhumkas · Ahmedabad', body: 'Their jhumka earrings are heirloom quality. The team personally guided me on WhatsApp. Wonderful experience.' },
  { author: 'Hitesh Patel', context: 'Gifting · Mumbai', body: 'Insured shipping, honest pricing and stunning craftsmanship. Parshiv Jewels is now our family jeweller.' },
  { author: 'Falguni Vora', context: 'Bridal set · Rajkot', body: 'We compared four jewellers in Mahidharpura. Parshiv let us see the set before confirming and adjusted the tikka at no charge.' },
  { author: 'Vikram Sheth', context: 'Diamond studs · Pune', body: 'The IGI report arrived with the studs and the numbers matched. That is not always the case elsewhere.' },
];

export const GALLERY_TILES = [
  { image: 'photo-1602751584552-8ba73aad10e1', caption: 'Gemstone Rings' },
  { image: 'photo-1599643478518-a784e5dc4c8f', caption: 'Diamond Necklace' },
  { image: 'photo-1535632066927-ab7c9ab60908', caption: 'Heritage Jhumkas' },
  { image: 'photo-1611591437281-460bfbe1220a', caption: 'Tennis Bracelet' },
  { image: 'photo-1611652022419-a9419f74343d', caption: 'Solitaire' },
  { image: 'photo-1573408301185-9146fe634ad0', caption: 'Pearl Studs' },
  { image: 'photo-1515562141207-7a88fb7ce338', caption: 'Bridal Keepsake Box' },
  { image: 'photo-1603561591411-07134e71a2a9', caption: 'Blue Topaz Crown' },
  { image: 'photo-1589128777073-263566ae5e4d', caption: 'Layered Chains' },
];

export const FAQS = [
  { q: 'What is your return policy?', a: 'We offer a 30-day return policy for all jewellery. Items must be in original, unworn condition with all packaging, tags and documentation intact. Collection is free and fully insured.' },
  { q: 'How long does shipping take?', a: 'Domestic orders are dispatched within 24 hours and delivered in 3–5 business days. Every shipment is fully insured until it reaches your hand.' },
  { q: 'Do you offer international shipping?', a: 'Yes. We ship worldwide via fully insured express couriers, typically 7–10 business days. Duties and taxes at the destination are the recipient’s responsibility.' },
  { q: 'How do I care for my jewellery?', a: 'Store each piece in its own pouch, keep it away from perfume and chlorine, and clean it with the supplied microfibre cloth. We offer a free professional polish once a year.' },
  { q: 'Are your products authentic?', a: 'Every piece is BIS hallmarked and, where stones are set, accompanied by an independent grading report and a serial-numbered warranty card.' },
  { q: 'Can I get a custom or personalised design?', a: 'Yes — bespoke engraving, custom stone settings and made-to-order bridal sets are commissioned over WhatsApp. Most commissions take 7–21 working days.' },
  { q: 'How does ordering on WhatsApp work?', a: 'Add pieces to your cart and tap “Proceed to WhatsApp”. We prepare a message containing your items, quantities and estimated total. Send it, and a specialist confirms availability, final pricing and payment options in the chat.' },
  { q: 'What payment methods do you accept?', a: 'UPI, credit and debit cards, net banking and wallets. Payment links are shared securely in your WhatsApp conversation once the order is confirmed.' },
  { q: 'How can I track my order?', a: 'You receive a live tracking link on WhatsApp and by email as soon as your parcel is dispatched.' },
  { q: 'Do you resize rings?', a: 'One complimentary resize is included within 60 days on most rings. Full eternity bands and channel-set designs cannot be resized — please confirm your size before ordering.' },
];

/** Long-form copy for informational pages, keyed by route slug. */
export const PAGES = {
  about: {
    eyebrow: 'The house',
    title: 'About',
    accent: 'Parshiv',
    description:
      'A Surat workshop making certified, hallmarked jewellery for people who intend to keep it.',
    hero: 'photo-1515562141207-7a88fb7ce338',
    sections: [
      {
        heading: 'Where we work',
        body: [
          'Parshiv Jewels operates from Kansara Seri in Mahidharpura — the lane where Surat’s diamond trade has been conducted for generations. We are a small house by design: one workshop, karigars we employ directly, and no outsourcing of the work that carries our name.',
          'Everything we sell is cut, set, polished and inspected in that workshop. When you ask us a question about a piece on WhatsApp, the person answering can usually walk twenty feet and look at it.',
        ],
      },
      {
        heading: 'What we will not do',
        body: [
          'We do not quote a making charge and then revise it. We do not sell a stone without its report. We do not describe plating as solid metal, and we do not photograph a piece in a way that misrepresents its size.',
          'This costs us some sales. It is also why most of our business now comes from people a previous customer sent to us.',
        ],
      },
      {
        heading: 'The guarantees',
        body: [
          'Every piece is BIS hallmarked. Every set stone above 0.20 ct carries an independent grading report. Every order ships insured, both ways, and every piece is covered by a lifetime craftsmanship warranty against manufacturing defects.',
        ],
      },
    ],
    stats: [
      ['5,000+', 'Patrons served'],
      ['250+', 'Signature designs'],
      ['100%', 'Hallmarked'],
      ['4.9★', 'Google rating'],
    ],
  },

  'our-story': {
    eyebrow: 'Since 2026',
    title: 'Our',
    accent: 'Story',
    description: 'How a family bench in Mahidharpura became a house with a name on it.',
    hero: 'photo-1602751584552-8ba73aad10e1',
    sections: [
      {
        heading: 'A bench, a loupe, and a lane',
        body: [
          'The family has worked in Mahidharpura for three generations — first as setters taking commissions from larger houses, then as a workshop other jewellers relied on quietly for the difficult pieces. The work was ours. The name on the box was always somebody else’s.',
          'Parshiv Jewels began when that stopped making sense. The same hands, the same bench, the same refusal to let a badly set stone leave the room — but sold directly, at the price the work is actually worth, to the person who will wear it.',
        ],
      },
      {
        heading: 'Why WhatsApp',
        body: [
          'Fine jewellery is not a frictionless purchase, and pretending otherwise does customers no favours. People want to ask whether the emerald is treated, whether a ring will suit a wide knuckle, whether a set can be ready before a date in November.',
          'So we did not build a checkout that avoids the conversation. Your cart becomes a message, a specialist answers it, and the order is confirmed by someone who can actually see the piece.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'We are growing slowly and deliberately. More bespoke commissions, a larger bridal atelier, and eventually a room in Surat where you can sit down with a tray and take your time. What will not change is who makes the work.',
        ],
      },
    ],
    timeline: [
      ['Three generations', 'Setting and finishing work for other houses from a bench in Kansara Seri.'],
      ['2026', 'Parshiv Jewels launches under its own name, selling directly for the first time.'],
      ['2026', 'The Bridal Heirloom atelier opens for made-to-order commissions.'],
      ['Today', 'Over 5,000 patrons across India and 14 countries, ordering on WhatsApp.'],
    ],
  },

  'shipping-delivery': {
    eyebrow: 'Logistics',
    title: 'Shipping &',
    accent: 'Delivery Policy',
    description:
      'Every order is securely packed, insured during transit and delivered using trusted logistics partners. This policy explains how and when your order reaches you.',
    updated: '9 February 2026',
    updatedLabel: 'Effective',
    sections: [
      {
        heading: '1. Shipping Locations',
        body: [
          'We currently offer Pan-India shipping across all states and union territories of India.',
          'At this time, we do not ship internationally.',
        ],
      },
      {
        heading: '2. Shipping Charges',
        body: ['Our shipping charges are structured as follows:'],
        list: [
          { term: 'Free shipping', detail: 'On all prepaid orders above ₹5,000.' },
          { term: 'Flat ₹200', detail: 'On orders below ₹5,000.' },
          {
            term: 'Cash on Delivery',
            detail: 'May incur an additional ₹50–₹100 handling charge, depending on the courier partner.',
          },
        ],
        bodyAfter: [
          'Any applicable shipping or handling charges are clearly displayed at checkout before payment.',
        ],
      },
      {
        heading: '3. Order Processing Time',
        list: [
          'Orders are generally processed within 24–52 hours after order confirmation.',
          'Orders placed on Sundays or national holidays are processed on the next working day.',
          'Once your order is dispatched, you receive shipment confirmation and tracking details.',
        ],
      },
      {
        heading: '4. Estimated Delivery Time',
        body: ['Delivery timelines are calculated after dispatch and may vary depending on your location.'],
        table: {
          caption: 'Estimated delivery after dispatch',
          head: ['Destination', 'Estimated delivery'],
          rows: [
            ['Metro cities', '7–10 business days'],
            ['Rest of India', '10–14 business days'],
            ['Remote / North-East regions', '12–14 business days'],
          ],
        },
        bodyAfter: [
          'These timelines are estimates and may be affected by weather conditions, courier delays, public holidays, operational disruptions or other unforeseen circumstances.',
        ],
      },
      {
        heading: '5. Courier Partners',
        body: [
          'We work with trusted courier and logistics partners selected for their ability to provide secure handling, reliable tracking and safe transportation of jewellery shipments.',
          'The courier partner may vary depending on the delivery location, shipment value and service availability.',
        ],
      },
      {
        // The clause that protects the customer's claim — and the one that
        // depends on them filming the unboxing, so it must be read first.
        heading: '6. Transit Insurance & Security',
        highlight: true,
        flag: '🛡 Record an unboxing video',
        body: [
          'All shipments are fully insured by Parshiv Jewels against loss or damage during transit until the order is delivered to you.',
          'If your package is lost or damaged in transit before delivery, you are not held responsible for the loss. Parshiv Jewels will coordinate with the courier partner and act in accordance with our Return & Refund Policy.',
        ],
        list: [
          {
            term: 'Please film the unboxing',
            detail:
              'Record a clear, continuous video as you open the sealed package. This may be required as supporting evidence for a damage, shortage or incorrect-item claim.',
          },
        ],
      },
      {
        heading: '7. Delivery Verification',
        body: ['Because of the nature and value of our products:'],
        list: [
          'OTP verification or signature confirmation may be required at the time of delivery.',
          'Packages are not intentionally left unattended or at an unsecured location.',
          'If OTP or signature verification cannot be completed, the courier partner may reschedule the delivery or return the shipment according to its procedures.',
        ],
      },
      {
        heading: '8. Failed Delivery / Incorrect Address',
        body: [
          'If a shipment is returned to us because of an incorrect or incomplete address, customer unavailability, refusal to accept the shipment, or repeated failed delivery attempts:',
        ],
        list: [
          {
            term: 'Re-shipping',
            detail: 'Additional shipping charges may apply, based on the actual courier cost.',
          },
          {
            term: 'Cancellation after return',
            detail:
              'Any applicable shipping, handling or return-to-origin charges may be deducted from the refundable amount.',
          },
        ],
        bodyAfter: [
          'Please verify your name, phone number, email address and complete delivery address carefully before placing an order.',
        ],
      },
      {
        heading: '9. Shipping on Weekends & Holidays',
        list: [
          'Our dispatch centre may be closed on Sundays and national holidays.',
          'Courier partners may attempt delivery on weekends, depending on the local hub and service availability.',
          'Orders placed during holidays may require additional processing time.',
        ],
      },
      {
        heading: '10. Delivery Delays',
        body: [
          'While Parshiv Jewels makes every reasonable effort to deliver within the estimated timeframe, delivery dates are not guaranteed.',
          'We are not responsible for delays caused by circumstances beyond our reasonable control, including severe weather, natural disasters, strikes, transportation disruptions, government restrictions, courier operational issues or incorrect customer-provided information.',
        ],
      },
      {
        heading: '11. Contact Information',
        body: ['For shipping-related queries or assistance, please contact us.'],
        list: [
          { term: 'Email', detail: 'Parshivjewels.in@gmail.com' },
          { term: 'Phone', detail: '+91 63519 16996' },
          { term: 'Website', detail: 'parshivjewels.in' },
          {
            term: 'Address',
            detail:
              '102, Shiv Narayan House, beside Shree Satynarayan Dev Temple, Kansara Seri, Mahidharpura, Surat, Gujarat 395003',
          },
        ],
      },
      {
        heading: '12. Policy Updates',
        body: [
          'Parshiv Jewels reserves the right to update or modify this Shipping & Delivery Policy at any time. Changes become effective immediately upon being posted on this page, unless otherwise stated.',
          'By placing an order on our website, you agree to the terms mentioned above.',
        ],
      },
    ],
    cta: {
      eyebrow: 'Track an order',
      title: 'Question about a delivery?',
      message:
        'Message us on WhatsApp with your order details and we will check the shipment status with the courier for you.',
    },
  },

  'cancellation-policy': {
    eyebrow: 'Before dispatch',
    title: 'Cancellation',
    accent: 'Policy',
    description:
      'We process orders promptly to ensure timely and secure delivery. Please review these cancellation guidelines carefully before placing your order.',
    updated: '9 February 2026',
    updatedLabel: 'Effective',
    sections: [
      {
        // The clause that governs every other one: after dispatch, the
        // question stops being cancellation and becomes a return.
        heading: '1. Customer-Initiated Cancellations',
        highlight: true,
        flag: 'Act before dispatch',
        body: [
          'You may request cancellation of your order at any time before it has been dispatched from our warehouse. We recommend submitting cancellation requests as soon as possible, preferably within 24 hours of placing the order.',
          'Once an order has been dispatched or handed to our courier partner, it cannot be cancelled. Any subsequent request is handled under our Return & Refund Policy, where applicable.',
        ],
      },
      {
        heading: '2. Cancellation Charges',
        list: [
          {
            term: 'Standard orders',
            detail:
              'No cancellation charge applies before dispatch. A full refund is generally issued to the original payment method, subject to any applicable payment processing charges.',
          },
          {
            term: 'Gold & diamond jewellery',
            detail:
              'If cancelled after 24 hours but before dispatch, a 5%–10% payment gateway or processing fee may be deducted from the refund where applicable. Any deduction is communicated to you before the cancellation is processed.',
          },
        ],
      },
      {
        heading: '3. Customised & Engraved Jewellery',
        body: [
          'Customised, bespoke, made-to-order or engraved jewellery is specially prepared to your requirements.',
        ],
        list: [
          'Once production or customisation has commenced, these orders may become non-cancellable.',
          'If a cancellation is accepted after production has started, applicable making, customisation, material or processing charges may be deducted from the refund.',
          'Customised or engraved products may also be excluded from return or refund, except where covered by our Return & Refund Policy — for example an eligible manufacturing defect or an incorrect item.',
        ],
      },
      {
        heading: '4. Refund Timeline for Cancelled Orders',
        list: [
          'Approved cancellation refunds are generally processed within 7–9 business days after the cancellation is confirmed.',
          'Refunds are normally issued to the original payment method used for the purchase.',
          'The time taken for the refund to appear in your account may vary depending on your bank, card issuer or payment provider.',
        ],
      },
      {
        heading: '5. Orders Cancelled by Parshiv Jewels',
        body: [
          'Parshiv Jewels reserves the right to cancel or decline an order in circumstances including, but not limited to:',
        ],
        list: [
          'The product being unavailable or out of stock',
          'Errors in pricing, product descriptions, inventory or other website information',
          'Suspicious, unauthorised or potentially fraudulent transactions',
          'Inability to verify customer or payment details',
          'Incorrect, incomplete or unverifiable delivery information',
          'Operational, courier or other circumstances that prevent successful fulfilment',
        ],
        bodyAfter: [
          'If we cancel an order after payment has been received, the eligible amount paid is refunded to the original payment method, subject to any applicable deductions that have been clearly communicated to you.',
        ],
      },
      {
        heading: '6. Cash on Delivery — Verification',
        body: ['To reduce fraudulent orders and ensure smooth delivery:'],
        list: [
          'COD orders may require confirmation by phone, WhatsApp, OTP or another verification method before dispatch.',
          'If you cannot be reached, or the required verification is not completed within 24 hours, we may cancel the order.',
          'Customers who repeatedly refuse COD shipments, or place fraudulent or non-genuine COD orders, may have COD availability restricted or disabled for future purchases.',
        ],
      },
      {
        heading: '7. How to Request a Cancellation',
        body: [
          'Contact us as soon as possible with your order number and registered contact details.',
          'Cancellation requests received after dispatch may not be accepted, and will instead be subject to the applicable Return & Refund Policy.',
        ],
      },
      {
        heading: '8. Important Notes',
        list: [
          'Cancellation requests must be submitted before the order is dispatched.',
          'Submitting a request does not guarantee cancellation if the order has already entered the dispatch process.',
          'Once an order has shipped, cancellation is generally not permitted.',
          'Please review product details, customisation requirements, delivery information and payment details carefully before placing an order.',
          'For eligible post-delivery issues, please refer to our Return & Refund Policy.',
        ],
      },
      {
        heading: '9. Contact Information',
        body: ['For cancellation requests or assistance, please contact us.'],
        list: [
          { term: 'Email', detail: 'Parshivjewels.in@gmail.com' },
          { term: 'Phone', detail: '+91 63519 16996' },
          { term: 'Website', detail: 'parshivjewels.in' },
          {
            term: 'Address',
            detail:
              '102, Shiv Narayan House, beside Shree Satynarayan Dev Temple, Kansara Seri, Mahidharpura, Surat, Gujarat 395003',
          },
        ],
      },
      {
        heading: '10. Policy Updates',
        body: [
          'Parshiv Jewels reserves the right to update or modify this Cancellation Policy at any time. Changes become effective upon being posted on this page, unless otherwise stated.',
          'By placing an order on our website, you agree to the terms outlined above.',
        ],
      },
    ],
    cta: {
      eyebrow: 'Cancel an order',
      title: 'Need to cancel something?',
      message:
        'Message us on WhatsApp with your order number as soon as possible. If the piece has already been dispatched we will guide you through the returns route instead.',
    },
  },

  'returns-refunds': {
    eyebrow: 'Peace of mind',
    title: 'Return &',
    accent: 'Refund Policy',
    description:
      'At Parshiv Jewels, customer satisfaction is our priority. Every piece of jewellery is carefully inspected before dispatch to ensure the highest quality standards. If you encounter an issue with your purchase, please review the policy below.',
    updated: '9 February 2026',
    updatedLabel: 'Effective',
    sections: [
      {
        heading: '1. Eligibility for Returns',
        body: ['We accept returns only under the following conditions:'],
        list: [
          'The product has a manufacturing defect, or',
          'You have received the wrong item.',
        ],
        bodyAfter: [
          'Returns requested due to a change of mind may be accepted at our discretion and will be subject to a restocking fee.',
        ],
      },
      {
        heading: '2. Return Window',
        list: [
          'Customers must return the product within 15 days from the date of delivery.',
          'Requests made after this period may not be accepted.',
        ],
      },
      {
        heading: '3. Non-Returnable Items',
        body: ['The following products are not eligible for return or refund:'],
        list: [
          'Customised or bespoke jewellery made to order',
          'Engraved items with personal messages',
        ],
      },
      {
        heading: '4. Refund & Exchange Options',
        body: ['We aim to provide flexible solutions for our customers.'],
        list: [
          {
            term: 'Exchange or store credit (preferred)',
            detail:
              'Exchange for another product, or take store credit towards a future purchase. Approved exchange products are delivered within 7 to 14 days.',
          },
          {
            term: 'Bank refunds',
            detail:
              'Available for items that are defective or incorrectly delivered. Refunds are processed using the original payment method wherever possible.',
          },
          {
            term: 'Change-of-mind returns',
            detail: 'A 10% making charge / restocking fee is deducted from the refund amount.',
          },
        ],
      },
      {
        heading: '5. Return Shipping Responsibility',
        list: [
          { term: 'Your responsibility', detail: 'Return shipping costs for change-of-mind returns.' },
          {
            term: 'Our responsibility',
            detail:
              'If the product arrives damaged, defective or incorrect, Parshiv Jewels bears the return shipping charges.',
          },
        ],
      },
      {
        // The one clause a customer must read before opening the parcel —
        // a missed video here is the difference between a refund and none.
        heading: '6. Damaged or Incorrect Products',
        highlight: true,
        flag: 'Important — read before opening your parcel',
        body: ['If your order arrives damaged, or you receive the wrong item:'],
        list: [
          { term: 'Notify us within 24 hours', detail: 'Contact us within 24 hours of delivery.' },
          {
            term: 'An unboxing video is mandatory',
            detail: 'It must clearly show the sealed courier package being opened.',
          },
          {
            term: 'Without video evidence',
            detail: 'Claims submitted without proper video evidence may not be eligible for a refund or replacement.',
          },
        ],
        bodyAfter: [
          'Please start the video before you break the courier seal and keep recording until the piece is fully unwrapped, in one continuous take.',
        ],
      },
      {
        heading: '7. Return Conditions',
        body: ['To qualify for a return:'],
        list: [
          'The item must be unused, unworn and in original condition.',
          'All original packaging, certificates, invoices and tags must be included.',
          'Products showing signs of wear, alteration or damage caused after delivery will not be accepted.',
        ],
      },
      {
        heading: '8. Refund Processing Timeline',
        list: [
          'Once we receive and inspect the returned product, refunds are processed within 5–7 business days.',
          'The time for the amount to reflect in your account may vary depending on your bank or payment provider.',
        ],
      },
      {
        heading: '9. How to Initiate a Return',
        body: [
          'To request a return or exchange, contact us with your order details and our support team will guide you through the process.',
        ],
        list: [
          { term: 'Email', detail: 'Parshivjewels.in@gmail.com' },
          { term: 'Phone', detail: '+91 63519 16996' },
          { term: 'Website', detail: 'parshivjewels.in' },
        ],
      },
      {
        heading: '10. Policy Updates',
        body: [
          'Parshiv Jewels reserves the right to modify this Return & Refund Policy at any time. Updates will be posted on this page with the revised effective date.',
          'By making a purchase on our website, you agree to the terms outlined in this policy.',
        ],
      },
    ],
    cta: {
      eyebrow: 'Start a return',
      title: 'Need to return or exchange something?',
      message:
        'Message us on WhatsApp with your order details. Have your unboxing video ready if the piece arrived damaged or incorrect — a specialist will guide you through the rest.',
    },
  },

  'jewelry-care': {
    eyebrow: 'Keep it brilliant',
    title: 'Jewelry',
    accent: 'Care',
    description: 'Well-made jewellery lasts generations. A little care makes that certain.',
    hero: 'photo-1573408301185-9146fe634ad0',
    sections: [
      {
        heading: 'The daily rules',
        body: [
          'Jewellery goes on last and comes off first. Perfume, hairspray, sunscreen and lotion all dull metal and attack porous stones — apply them, let them dry, then put your pieces on.',
          'Remove everything before swimming, bathing, sleeping, exercising or cleaning. Chlorine is particularly hard on gold alloys, and a knock against a tap is how most claws are lost.',
        ],
      },
      {
        heading: 'Cleaning at home',
        body: [
          'For gold and platinum: warm water, a drop of mild dish soap, a soft toothbrush, then dry completely with the supplied cloth. For pearls: a damp cloth only — never soap, never an ultrasonic cleaner, never submerge a knotted strand.',
          'Silver tarnishes; that is chemistry, not a defect. The supplied cloth restores it in under a minute.',
        ],
      },
      {
        heading: 'Storage',
        body: [
          'Store pieces separately in the pouches provided. Diamonds scratch everything, including other diamonds, and a chain left loose in a box will knot itself against whatever is next to it.',
          'Keep pearls and emeralds away from dry heat and direct sunlight.',
        ],
      },
      {
        heading: 'Bring it back to us',
        body: [
          'We offer a free professional clean, polish and claw check once a year for the life of any Parshiv piece. Message us on WhatsApp to arrange it — we will send an insured pickup.',
        ],
      },
    ],
    table: {
      caption: 'Care by material',
      head: ['Material', 'Clean with', 'Avoid', 'Service'],
      rows: [
        ['22K / 18K Gold', 'Warm soapy water, soft brush', 'Chlorine, harsh polish', 'Annual polish'],
        ['Platinum', 'Warm soapy water, soft brush', 'Abrasive cloths', 'Annual polish'],
        ['Sterling Silver', 'Supplied polishing cloth', 'Ultrasonic cleaners', 'As needed'],
        ['Pearls', 'Damp soft cloth only', 'Soap, ultrasonics, heat', 'Restring every 2 yrs'],
        ['Emeralds', 'Damp soft cloth only', 'Ultrasonics, steam, heat', 'Re-oil every 3–5 yrs'],
        ['Diamonds', 'Warm soapy water, soft brush', 'Storing loose with others', 'Annual claw check'],
      ],
    },
  },

  'size-guide': {
    eyebrow: 'Get the fit right',
    title: 'Diamond Jewellery',
    accent: 'Size Guide',
    description:
      'Choosing the right size for your diamond jewellery is essential to ensure a comfortable fit and a perfect look. Below is a comprehensive guide to help you determine the right size for rings, bracelets, necklaces and earrings.',
    sections: [
      {
        heading: 'Ring Size Guide',
        list: [
          'Use a ring sizer, or measure the diameter of an existing ring that fits well.',
          'Ring sizes are typically measured in US, UK, EU and mm (circumference).',
          'Avoid measuring fingers when they are too hot or cold, as this can affect accuracy.',
          'If you are between sizes, opt for the larger size for comfort.',
        ],
        table: {
          caption: 'Common ring size chart',
          head: ['US Size', 'UK Size', 'EU Size', 'Diameter (mm)', 'Circumference (mm)'],
          rows: [
            ['5', 'J', '49', '15.7', '49.3'],
            ['6', 'L', '52', '16.5', '51.9'],
            ['7', 'N', '54', '17.3', '54.4'],
            ['8', 'P', '57', '18.1', '56.9'],
            ['9', 'R', '59', '18.9', '59.5'],
          ],
        },
      },
      {
        heading: 'Bracelet Size Guide',
        list: [
          'Measure your wrist circumference using a flexible tape.',
          'Add 0.5 to 1 inch (1.5–2.5 cm) for a comfortable fit.',
          'Bangles and cuff bracelets should be measured by their inner diameter.',
        ],
        table: {
          caption: 'Common bracelet sizes',
          head: ['Wrist Size (inches)', 'Bracelet Size (inches)', 'Bracelet Size (cm)'],
          rows: [
            ['5.5 – 6.0', '6.5', '16.5'],
            ['6.0 – 6.5', '7.0', '17.8'],
            ['6.5 – 7.0', '7.5', '19.0'],
            ['7.0 – 7.5', '8.0', '20.3'],
          ],
        },
      },
      {
        heading: 'Necklace Size Guide',
        list: [
          'Necklace lengths vary based on style and personal preference.',
          'Shorter chains (14–16 inches) sit around the collarbone, while longer styles (24–30 inches) create a more dramatic look.',
        ],
        table: {
          caption: 'Common necklace lengths & fit',
          head: ['Necklace Length', 'Style Name', 'Fit & Placement'],
          rows: [
            ['14 inches', 'Choker', 'Fits tightly around the neck'],
            ['16 inches', 'Princess', 'Rests at the collarbone'],
            ['18 inches', 'Standard', 'Falls below the collarbone'],
            ['24 inches', 'Opera', 'Hangs at or just below the bust'],
            ['30+ inches', 'Rope', 'Can be worn as a single long strand or doubled'],
          ],
        },
      },
      {
        heading: 'Earring Size Guide',
        list: [
          'Stud earrings range from 3mm (small) to 10mm (large).',
          'Hoop earrings range from 10mm (huggies) to 70mm+ (statement hoops).',
          'Drop earrings typically measure 30mm to 50mm for a classic look.',
        ],
        table: {
          caption: 'Common stud earring sizes',
          head: ['Diamond Size (mm)', 'Look & Fit'],
          rows: [
            ['3mm', 'Subtle sparkle'],
            ['5mm', 'Everyday wear'],
            ['7mm', 'Noticeable shine'],
            ['10mm', 'Bold statement'],
          ],
        },
      },
    ],
    cta: {
      eyebrow: 'Client services',
      title: 'Need personalised sizing assistance?',
      message:
        'Contact our Client Services Team for a professional measurement — send us a photograph of a ring that already fits, resting on a ruler, and we will size it for you.',
    },
  },

  'diamond-guide': {
    eyebrow: 'Diamond education',
    title: 'The Ultimate Guide to Choosing the',
    accent: 'Perfect Diamond',
    description:
      'Diamonds have captivated hearts for centuries with their unparalleled beauty and symbolism. Whether you’re shopping for an engagement ring, a special gift or a personal treasure, selecting the right diamond is a momentous decision. At Parshiv Jewels, we believe that an informed choice leads to a lifetime of satisfaction — so we’ve created this comprehensive guide to empower you with the knowledge you need to find your perfect diamond.',
    sections: [
      {
        heading: 'What This Guide Covers',
        body: [
          'In this guide we’ll explore the essential aspects of diamonds, including the famous 4Cs — Carat, Cut, Colour and Clarity. We’ll also delve into diamond shapes, certifications, budget considerations and ethical sourcing.',
          'With clear explanations and helpful visuals, you’ll gain the confidence to make a choice that reflects your unique style and values.',
        ],
      },
      {
        heading: 'The 4Cs of Diamonds',
        body: [
          'Understanding the 4Cs is crucial to evaluating a diamond’s quality and value. Let’s break down each component.',
        ],
      },
      {
        heading: 'Carat: The Measure of Weight',
        body: [
          'Carat refers to the weight of a diamond, with one carat equal to 200 milligrams. While carat weight influences a diamond’s size, it’s important to note that two diamonds of the same carat weight can appear different in size depending on their cut and shape.',
        ],
        image: {
          src: '/assets/img/diamond-carat-size-chart.webp',
          alt: 'Diamond carat size chart comparing round brilliant diamonds from 1.25 mm (0.010 ct) to 6.60 mm (1.00 ct), with millimetre diameter and carat weight for each.',
          caption: 'Round brilliant diamonds from 0.010 ct to 1.00 ct, with the millimetre diameter of each — carat is weight, and diameter is what you actually see.',
          fit: 'contain',
          bg: 'dark',
          fullSize: true,
        },
        bodyAfter: [
          'For example, a well-cut diamond may appear larger than a poorly cut one of the same weight. When considering carat weight, think about your personal preference and how the diamond will look on the intended wearer. Carat weight should be balanced with the other Cs for the best overall value.',
        ],
      },
      {
        heading: 'Cut: The Art of Brilliance',
        body: [
          'The cut of a diamond is perhaps the most important factor in determining its beauty. It refers to how well the diamond’s facets interact with light, creating brilliance, fire and scintillation.',
          'Diamonds are graded on a scale from Excellent to Poor. An Excellent cut maximises the diamond’s ability to reflect light, resulting in a dazzling display. In contrast, a Poor cut can make even a high-quality diamond appear dull. When choosing a diamond, prioritise cut to ensure you get the most sparkle for your investment.',
        ],
      },
      {
        heading: 'Colour: The Spectrum of Beauty',
        body: [
          'Diamonds come in a range of colours, from colourless to light yellow or brown. The Gemological Institute of America (GIA) grades diamond colour on a scale from D (colourless) to Z (light colour).',
          'Colourless diamonds (D–F) are highly prized for their purity, while near-colourless diamonds (G–J) offer excellent value with minimal colour detectable to the untrained eye. Diamonds with more noticeable colour (K–Z) may suit certain settings or preferences. Consider the metal colour of your setting, as it can influence how the diamond’s colour appears — yellow gold can complement warmer hues, for instance.',
        ],
      },
      {
        heading: 'Clarity: The Window to Perfection',
        body: [
          'Clarity measures the presence of internal inclusions and external blemishes in a diamond. These natural characteristics, formed during the diamond’s creation, make each stone unique.',
        ],
        image: {
          src: '/assets/img/diamond-color-clarity-chart.webp',
          alt: 'Diamond colour and clarity chart: clarity grades from FL-IF through VVS1/VVS2, VS1/VS2, SI1/SI2 to I1-I3, above the colour scale running D to Z.',
          caption:
            'Clarity grades from Flawless to Included, above the D–Z colour scale. Both scales are read at 10× magnification by the laboratory, not by eye.',
          fit: 'contain',
          bg: 'light',
          fullSize: true,
        },
        bodyAfter: [
          'The GIA clarity scale ranges from Flawless (no inclusions or blemishes visible under 10× magnification) to Included (inclusions visible to the naked eye). Most diamonds have some inclusions, but those graded VS2 (Very Slightly Included) or higher typically appear clean to the naked eye. Consider clarity alongside the other Cs and your tolerance for imperfections.',
        ],
      },
      {
        heading: 'Diamond Shapes: Expressing Your Style',
        body: [
          'Beyond the 4Cs, the shape of a diamond is a matter of personal taste. Each shape has its own character and appeal.',
        ],
        image: {
          src: '/assets/img/diamond-shapes-chart.webp',
          alt: 'Diamond shapes chart showing round, cushion, radiant, princess, asscher, trilliant, heart, lozenge, oval, baguette, emerald, tapered baguette, pear, marquise, half-moon, rhomboid, whistle, trapeze, bullet, fan and kite cuts.',
          caption: 'Twenty-one diamond cuts, from the round brilliant to the specialist shapes used as side stones.',
          fit: 'contain',
          bg: 'dark',
          fullSize: true,
        },
        bodyAfter: ['Here are some popular options:'],
        list: [
          { term: 'Round Brilliant', detail: 'The most popular shape, known for its exceptional sparkle.' },
          { term: 'Princess Cut', detail: 'A modern, square shape with sharp angles.' },
          { term: 'Emerald Cut', detail: 'Rectangular with step-cut facets, offering vintage elegance.' },
          { term: 'Oval', detail: 'An elongated shape that can make fingers appear slender.' },
          { term: 'Cushion Cut', detail: 'A soft, pillow-like shape with romantic charm.' },
          { term: 'Pear Shape', detail: 'A teardrop design combining round and marquise cuts.' },
          { term: 'Marquise', detail: 'An elongated shape with pointed ends, maximising carat weight appearance.' },
          { term: 'Heart Shape', detail: 'A symbol of love, perfect for romantic gestures.' },
        ],
      },
    ],
    cta: {
      eyebrow: 'Next steps',
      title: 'Ready to choose your diamond?',
      message:
        'Read our certification guide to understand grading reports, or message a specialist on WhatsApp — they can talk you through the 4Cs on a specific stone before you commit.',
    },
  },

  'certification-guide': {
    eyebrow: 'Ensuring authenticity',
    title: 'Diamond',
    accent: 'Certifications',
    description:
      'A diamond certification, or grading report, is an unbiased assessment of a diamond’s quality by a reputable gemological laboratory. It provides detailed information about the 4Cs and other characteristics.',
    hero: '/assets/img/igi-diamond-report.webp',
    heroAlt:
      'An IGI Laboratory Grown Diamond Jewellery Report, shown open — an example of an independent gemological grading report.',
    heroFit: 'contain',
    heroCaption:
      'Example of an IGI grading report. Every certified Parshiv piece ships with its own report — ask us for it on WhatsApp before you buy.',
    sections: [
      {
        heading: 'Which Laboratories to Trust',
        body: [
          'Reputable certifying bodies include the Gemological Institute of America (GIA), the American Gem Society (AGS) and the International Gemological Institute (IGI). When purchasing a diamond, insist on a certification from one of these organisations to ensure authenticity.',
          'Certifications not only verify quality but also provide peace of mind, confirming your investment is genuine.',
        ],
      },
      {
        heading: 'Budget Considerations: Finding the Best Value',
        body: ['Selecting a diamond within your budget requires balancing the 4Cs. Here are some practical tips:'],
        list: [
          {
            term: 'Prioritise Cut',
            detail:
              'Cut governs how a diamond returns light, so it does more for sparkle than any other grade. Spend here first.',
          },
          {
            term: 'Consider Near-Colourless Grades',
            detail:
              'G–H range diamonds offer great value, appearing colourless to most eyes but costing less than D–F grades.',
          },
          {
            term: 'Choose Clarity Wisely',
            detail:
              'Opt for eye-clean diamonds (for example VS2 or SI1), where inclusions aren’t visible without magnification.',
          },
          {
            term: 'Shape Matters',
            detail:
              'Round brilliants often cost more; alternative shapes can offer uniqueness at a lower price.',
          },
          {
            term: 'Carat Weight',
            detail:
              'Choose weights just below popular sizes (0.90 instead of 1.00 carat) to save money without noticeable size loss.',
          },
        ],
      },
      {
        heading: 'Ethical Considerations: Responsible Sourcing',
        body: [
          'Ethical sourcing is increasingly vital. At Parshiv Jewels, we’re committed to offering conflict-free diamonds sourced responsibly.',
          'Look for diamonds certified by the Kimberley Process, which prevents conflict diamonds from entering the market. Additionally, consider stones from mines adhering to strict labour and environmental standards. Choosing ethically sourced diamonds ensures your jewellery aligns with your values.',
        ],
      },
      {
        heading: 'Your Journey to the Perfect Diamond',
        body: [
          'Selecting a diamond is a personal and exciting journey. Armed with knowledge of the 4Cs, shapes, certifications and ethical considerations, you’re well-equipped to make an informed decision. There’s no one-size-fits-all approach — the perfect diamond speaks to you, fits your budget, and brings joy for years.',
          'If you have questions or need assistance, our expert team at Parshiv Jewels is here to help.',
        ],
      },
    ],
    cta: {
      eyebrow: 'Begin your journey',
      title: 'Explore our collections',
      message:
        'Browse the collection, or message a specialist on WhatsApp to begin your diamond journey today — they can send you the grading report for any certified piece before you commit.',
    },
  },

  'privacy-policy': {
    eyebrow: 'Your data',
    title: 'Privacy',
    accent: 'Policy',
    description: 'What we collect, why, and what we will never do with it.',
    updated: '1 August 2026',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you enquire, we receive the WhatsApp number you message us from, along with the name, delivery address and contact details you choose to share in that conversation. If you subscribe to our letter, we hold your email address.',
          'Your shopping cart, recently viewed items and recent searches are stored in your own browser using local storage. They are never transmitted to us, and clearing your browser data removes them.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'Solely to answer your enquiry, fulfil and deliver your order, honour warranties and returns, and — if you have opted in — send you our occasional letter. Nothing else.',
        ],
      },
      {
        heading: 'What we never do',
        body: [
          'We do not sell, rent or trade your personal information. We do not share it with advertisers or data brokers. We share details with a courier only to the extent needed to deliver your parcel, and with our payment provider only to process a payment you have authorised.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You may ask us at any time for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Message us on WhatsApp or email us and we will action it within 30 days.',
          'WhatsApp conversations are subject to WhatsApp’s own privacy policy, which we do not control.',
        ],
      },
    ],
  },

  'terms-conditions': {
    eyebrow: 'The agreement',
    title: 'Terms &',
    accent: 'Conditions',
    description: 'The terms on which we sell, and you buy.',
    updated: '1 August 2026',
    sections: [
      {
        heading: 'Orders and acceptance',
        body: [
          'Prices shown on this website are indicative and reflect our current making charges and prevailing metal rates. Adding items to your cart and sending a WhatsApp enquiry is a request, not a completed order.',
          'A contract of sale is formed only when we confirm availability and final pricing in the WhatsApp conversation and you accept it. We may decline an order where a piece is unavailable, where a price has been listed in error, or where we cannot verify delivery details.',
        ],
      },
      {
        heading: 'Pricing',
        body: [
          'Metal rates move. Where the prevailing rate has changed materially since a price was listed, we will tell you the current price before taking payment and you are free to decline. Totals shown on this site are estimates inclusive of applicable tax and exclusive of any duties payable outside India.',
        ],
      },
      {
        heading: 'Product representation',
        body: [
          'Photography is styled and may be enlarged to show detail. Stated dimensions, weights and stone specifications are authoritative; images are not. Natural stones vary in colour and inclusion, and this variation is a property of the material, not a defect.',
        ],
      },
      {
        heading: 'Liability and governing law',
        body: [
          'Our liability in respect of any piece is limited to its purchase price. Nothing in these terms limits liability that cannot lawfully be limited.',
          'These terms are governed by the laws of India, and the courts at Surat, Gujarat have exclusive jurisdiction.',
        ],
      },
    ],
  },
};

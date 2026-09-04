/* Customer reviews, keyed by product id. The catalog service derives each
   product's rating and review count from this file, so the two can never
   drift apart. Products without entries fall back to a seeded baseline. */

export const REVIEWS = {
  1: [
    { author: 'Meera Patel', rating: 5, date: '2026-06-18', verified: true, title: 'Exactly as photographed', body: 'The topaz is a proper sky blue, not washed out like the cheaper ones I saw elsewhere in Surat. Wore it to a wedding and three people asked where it was from.' },
    { author: 'Krupa Shah', rating: 5, date: '2026-05-02', verified: true, title: 'Comfortable all day', body: 'I have wide knuckles and most halo rings spin on me. This one does not — the inside is rounded so it just sits. Bought size 16 on their WhatsApp advice and it was right.' },
    { author: 'Nidhi R.', rating: 4, date: '2026-04-21', verified: true, title: 'Lovely, slightly smaller than expected', body: 'Beautiful stone and finish. The halo is a little more delicate than it looks in the photo, which I actually prefer now that I have worn it a few times.' },
  ],
  2: [
    { author: 'Anjali Desai', rating: 5, date: '2026-07-04', verified: true, title: 'Wore it as a bride', body: 'The drops move when you move, which is the whole point and something I did not understand until I put it on. Photographs beautifully. Worth every rupee.' },
    { author: 'Pooja Mehta', rating: 5, date: '2026-05-29', verified: true, title: 'Fast and honest', body: 'Ordered on WhatsApp at 11pm, had a reply by morning with the certificate photo. Delivered in three days, fully insured. No games with pricing.' },
    { author: 'Sneha K.', rating: 5, date: '2026-03-14', verified: true, title: 'Gifted to my sister', body: 'The packaging alone made her cry. The extender was a thoughtful touch — she has a longer neck and 18 inches was not enough on its own.' },
  ],
  4: [
    { author: 'Rekha Joshi', rating: 5, date: '2026-06-30', verified: true, title: 'Heirloom quality', body: 'I have jhumkas from my mother and these sit in the same category. The beadwork around the rim is done by hand, you can see it. Light enough for a full day.' },
    { author: 'Divya Trivedi', rating: 5, date: '2026-05-11', verified: true, title: 'The swing is right', body: 'Cheap jhumkas hang badly. These are weighted at the bottom so the dome actually swings. Screw backs held all through a nine-hour function.' },
    { author: 'Hetal P.', rating: 4, date: '2026-02-08', verified: true, title: 'Beautiful, took a week', body: 'Mine were made to order so it took longer than the site suggested, but they kept me updated on WhatsApp the whole time. The emeralds are a deep proper green.' },
  ],
  5: [
    { author: 'Rajesh Shah', rating: 5, date: '2026-07-12', verified: true, title: 'Anniversary gift, well received', body: 'Certificate, packaging, delivery — everything felt premium. My wife has not taken it off in a month. The safety catch gives her confidence to wear it daily.' },
    { author: 'Priya N.', rating: 5, date: '2026-04-03', verified: true, title: 'Drapes properly', body: 'I returned a tennis bracelet to another brand because it sat stiff on my wrist. This one moves like fabric. That is the difference articulation makes.' },
  ],
  7: [
    { author: 'Hitesh Patel', rating: 5, date: '2026-06-09', verified: true, title: 'First fine jewellery for my daughter', body: 'Wanted something real but not extravagant for a sixteenth birthday. These were perfect and the locking backs mean I do not worry about her losing one.' },
    { author: 'Ashwini M.', rating: 5, date: '2026-05-20', verified: true, title: 'Great lustre for the price', body: 'Pearls are properly matched and have a real glow, not the chalky look you get at this price point. I wear them to work every day.' },
    { author: 'Bhavna S.', rating: 4, date: '2026-01-30', verified: true, title: 'Good value', body: 'Simple and well made. I would have liked a slightly larger pearl but 8mm is honest to the description.' },
  ],
  8: [
    { author: 'Falguni Vora', rating: 5, date: '2026-07-22', verified: true, title: 'Bought for my daughter\'s wedding', body: 'We compared four jewellers in Mahidharpura. Parshiv let us see the set before confirming and adjusted the tikka length at no charge. The box is genuinely a keepsake.' },
    { author: 'Kirti Amin', rating: 5, date: '2026-03-27', verified: true, title: 'Complete and coordinated', body: 'Buying a matched set saved me weeks of hunting for earrings that go. Everything arrived together, everything matched.' },
  ],
  15: [
    { author: 'Shreya Bhatt', rating: 5, date: '2026-06-02', verified: true, title: 'Knotted properly', body: 'Individually knotted on silk, exactly as described — I checked. That matters if you plan to keep pearls for decades.' },
    { author: 'Mansi D.', rating: 5, date: '2026-04-15', verified: true, title: 'Classic', body: 'Goes with a saree and equally with a shirt. The clasp is substantial and easy to work one-handed.' },
  ],
  17: [
    { author: 'Tanvi Kapadia', rating: 5, date: '2026-07-08', verified: true, title: 'Layers beautifully', body: 'Bought this with the Zoya set. They sit at different heights and genuinely do not tangle, which I did not believe until I wore them for a week.' },
    { author: 'Aarti J.', rating: 4, date: '2026-05-06', verified: true, title: 'Very fine chain', body: 'Delicate — lovely, but treat it gently. The pendant itself is gorgeous and catches light constantly.' },
  ],
  23: [
    { author: 'Vikram Sheth', rating: 5, date: '2026-06-25', verified: true, title: 'Certified, as promised', body: 'IGI report arrived with the studs and the numbers matched. That is not always the case elsewhere. Screw backs are the right choice for daily wear.' },
    { author: 'Ritu Sharma', rating: 5, date: '2026-02-19', verified: true, title: 'Bright from underneath', body: 'The open baskets really do let light in — these sparkle in low light where my old pair went dead.' },
  ],
  28: [
    { author: 'Neel Bhavsar', rating: 5, date: '2026-05-17', verified: true, title: 'Wear them daily', body: 'Flat backs mean I can sleep in them. Brushed finish hides scratches. Nothing to fuss over, which was exactly the point.' },
    { author: 'Ishita G.', rating: 4, date: '2026-03-09', verified: true, title: 'Simple and good', body: 'Does what it says. Would like these in gold too.' },
  ],
  30: [
    { author: 'Jayshree Modi', rating: 5, date: '2026-07-15', verified: true, title: 'The engraving is real', body: 'Hand cut, not stamped — you can feel the tool marks. The oxidised recesses make the pattern read from across a room. Heavy in the good way.' },
  ],
  18: [
    { author: 'Roshni Parekh', rating: 5, date: '2026-06-11', verified: true, title: 'Made to order and worth the wait', body: 'Three weeks, one karigar, and they sent progress photographs at each stage. The polki is properly uncut, set in foil the traditional way. This is an heirloom.' },
  ],
  33: [
    { author: 'Deepa Iyer', rating: 5, date: '2026-04-28', verified: true, title: 'Graduated where it counts', body: 'The larger stones sit on top of the wrist where they show. Small design decision, big difference in how it wears.' },
  ],
  22: [
    { author: 'Sonal Raval', rating: 5, date: '2026-05-25', verified: true, title: 'The support chain saved my ears', body: 'Chandbalis this size normally pull. The included ear chain takes the weight completely — I wore them for eleven hours.' },
  ],
  10: [
    { author: 'Ami Chokshi', rating: 5, date: '2026-06-20', verified: true, title: 'A proper cocktail ring', body: 'Big, green and hollowed inside so it does not feel like wearing a paperweight. The gold rays are chased by hand and it shows.' },
  ],
};

/** Baseline rating for products with no written reviews yet. */
export const BASELINE_RATING = { rating: 4.8, count: 0 };

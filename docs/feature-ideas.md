# PerX Feature Ideas From Market Scan

Sources scanned:

- Perks at Work: employee discounts, mobile app, WOWPoints, broad local/national categories, online academy, and merchant/employer entry points.
  - https://www.perksatwork.com/
  - https://www.perksatwork.com/login/hr
  - https://www.perksatwork.com/login/under500
  - https://www.perksatwork.com/register
  - https://play.google.com/store/apps/details?id=com.nextjump.perksatwork
  - https://apps.apple.com/us/app/perks-at-work/id6743723017
- Fringe: one wallet experience, lifestyle benefits, rewards and recognition, wellbeing offerings, challenges and incentives, learning, swag, life events, and gifting.
  - https://www.fringe.us/
  - https://www.fringe.us/news/lifestyle-spending-accounts-what-to-know
  - https://www.prnewswire.com/news-releases/fringe-launches-fringe-2-0--the-human-first-employee-experience-platform-302594459.html

Refresh notes from June 19, 2026:

- Perks at Work still centers the value prop around large-scale employee discounts, 20+ categories, local/national offers, WOWPoints, in-store mobile redemption, employer simplicity, and merchant access.
- Perks at Work registration asks for work/company verification details, which supports PerX using employee-driven employer invites and later company-code verification.
- Fringe positions the product as a broad employee experience platform: lifestyle benefits, wellbeing, rewards and recognition, challenges and incentives, learning, swag, life events, and gifting.
- Fringe emphasizes no-receipt administration, 120+ vendors, global reach, personalization, and flexible benefit choice. PerX can keep the demo lean by routing approved spend directly to providers instead of building reimbursement workflows first.

Ideas worth building next:

1. Provider discovery feed
   - Local-first provider cards by city/category.
   - Product-style offer cards with image, price in ALL, points price, validity, and redemption type.

2. Employee curation
   - Employees save providers they want their employer to unlock.
   - Employees send bundles/packages to the employer approval queue.
   - AI concierge can answer: "Find me relaxing perks under 3,000 ALL."

3. Invite-only employer onboarding
   - Employee sends employer invite.
   - Employer account is created only through an invite code.
   - Employer gets linked to company wallet cards and selected employee requests.

4. Employer points wallet
   - Multiple cards: Culture, Wellness, Learning, Team Events.
   - Each card has points, eligible perk categories, and spending history.
   - Employer can approve employee-curated providers and spend points to unlock offers.
   - Borrow the clarity of Perks at Work-style points, but make the value obvious inside every card.

5. Challenges
   - Employees post challenges for employers, such as "Sponsor Friday lunch walk."
   - Employers complete challenges to earn or allocate points.
   - Future version can include leaderboards and streaks.
   - Fringe's challenge/incentive positioning suggests making this a retention mechanic, not a side tab.
   - Add challenge templates tied to provider categories: food walk, wellness sprint, learning hour, family day.

6. Rewards and recognition
   - Peer nominations for useful perks.
   - Employer shoutouts tied to completed challenges.
   - Gift perks to teams or individual employees.

7. Learning and wellbeing layer
   - Course and coaching perks as first-class categories.
   - Wellness challenges that unlock extra points.
   - Seasonal drops around Albanian holidays, summer travel, and Tirana events.

8. Provider analytics
   - Offer impressions, employee saves, employer approvals, redemptions, payout status.
   - Peak time heatmap for QR/NFC redemptions.

9. Admin simplicity
   - No-receipt simulated flow for demo.
   - CSV import later for companies and employee lists.
   - Role-based Supabase policies before production.
   - Keep the employee flow away from reimbursement paperwork; use direct provider routing where possible.

10. Mobile-first redemption
   - Perks at Work's mobile app emphasizes in-store offers and WOWPoints redemption.
   - PerX should keep QR/NFC redemption close to each offer card and show point value before redemption.

11. Company verification path
   - Keep employee invite as the first demo flow.
   - Add optional company code/work email domain verification later for larger employers.
   - Let an accepted invite create the first employer admin, then allow that employer to invite finance/HR teammates.

12. Life-event and gifting drops
   - Inspired by Fringe's life-event/gifting positioning.
   - Employees can request a birthday, new-parent, relocation, or exam-season perk bundle.
   - Employers can approve a one-off points card for that event.

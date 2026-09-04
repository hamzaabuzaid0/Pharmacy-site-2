# Meeting talking points — inventory & stock system

## The one question you MUST ask first
> **"How do you currently track what's in stock — do you use a proper inventory/POS system, spreadsheets, or is it mostly manual/memory?"**

Neither of us can know their answer in advance — it changes everything below. Ask it early, before you commit to a specific plan out loud.

---

## Scenario A: "We don't really have a system" (paper, memory, informal)
**This is the easy case.** Say:

> "Then the staff panel I'm building becomes your real inventory system — not just a website feature. Any staff member, on their phone, marks something out of stock the second it runs out, at whichever branch it happened at, and it's live on the site instantly. You're not maintaining two systems — this *is* the system."

No caveats needed here. Proceed with confidence.

## Scenario B: "Yes, we use [some POS/inventory software]"
**Say this — don't overpromise a live integration you haven't scoped:**

> "Good — that doesn't get thrown away. For launch, the fastest and lowest-risk path is staff update stock in both places — takes a few extra seconds per change, and gets us live this week instead of waiting on an integration project. Once I know exactly what software you're on, I can look at whether it has a way to export data or an API — if it does, we build an automatic sync later so staff only touch one system. If it doesn't, dual-entry just stays how it works, same as most small pharmacies run today."

**If they push for "why can't you just connect to it now"**, be honest:

> "I can't scope that without knowing what it is — some POS software has no way in at all, others do. Send me the name of the software (or even just a screenshot of it) after this meeting and I'll tell you exactly what's possible."

**Do NOT promise a specific integration timeline or feature in the room** — that's a real unknown until you know the software.

## Reassurance to lead with either way
> "Whatever you use today keeps working exactly as it does now — this is additive, nothing about your current setup has to change unless you want it to."

---

## Likely follow-up questions, with answers

**"How much does this cost to run?"**
> "The database and real-time sync run on Supabase's free tier, which comfortably covers a 2-branch pharmacy — this many products and this much traffic costs nothing. If we ever outgrow it, their paid tier starts around $25/month, and I'll flag it well before that becomes relevant — no surprise bill."

**"Is our data safe / can anyone edit our stock?"**
> "Customers can only *read* — stock, prices, products. Only staff who are logged in can change anything, and that's enforced at the database level, not just hidden in the app."

**"What if the internet or the site goes down at a branch?"**
> "The stock toggle needs internet to save, same as any phone app — but it fails safely: if a save doesn't go through, staff sees that clearly and can retry, it won't silently show wrong stock."

**"How fast does a change actually show up for customers?"**
> "Real-time — under a second, no page refresh needed on the customer's end."

**"Can we add new products ourselves later, not just toggle stock?"**
> "Yes — that's part of the same staff panel: add a product, its price, category, and photo, from either branch, no developer needed after this."

---
*Prep doc for the pharmacy owner meeting — not part of the deployed site.*

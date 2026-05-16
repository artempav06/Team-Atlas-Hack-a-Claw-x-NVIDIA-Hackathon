# Newsletter Source List — Agent 2 Event Scraper
# These newsletters are subscribed to via a dedicated Gmail account.
# The scraper checks the inbox for new newsletters every cycle.

---

## EMAIL ACCOUNT
- Address: [TO BE CREATED — e.g., atlas.ucsc.events@gmail.com]
- IMAP Server: imap.gmail.com
- IMAP Port: 993 (SSL)
- Auth: App Password (stored in openclaw.json as EMAIL_APP_PASSWORD)

---

## SUBSCRIBED NEWSLETTERS

### UCSC Official Newsletters
- UCSC News Weekly (Thursdays): https://news.ucsc.edu/subscribe/
- Tuesday Newsday (Tuesdays): https://ucsc.us1.list-manage.com/subscribe?u=4baaa62e2ecdb28e17538ba20&id=62bd660c12
- UCSC Events "The LineUp": https://magazine.ucsc.edu/contents/events/
- UCSC Extension Newsletter: https://www.ucsc-extension.edu/subscribe/
- Graduate Division Newsletter (quarterly): https://graduate.ucsc.edu/about/newsletters/

### Local Santa Cruz Newsletters
- Lookout Santa Cruz Daily: https://lookout.co/ (subscribe via site)
- Good Times Weekly: https://goodtimes.sc/ (subscribe via site)

---

## PLACEHOLDER — ADD MORE NEWSLETTERS HERE
<!-- Artem: subscribe to any additional UCSC/SC newsletters from the atlas email account -->

---

## SCRAPING NOTES
- Check inbox every cycle (1-2 hours)
- Only process UNREAD emails — mark as read after processing
- Parse email HTML body for event data (dates, times, locations, descriptions)
- Newsletters often contain multiple events — extract ALL of them
- Store sender addresses in a whitelist — ignore spam/non-newsletter emails
- If a newsletter contains no parseable events, skip it silently

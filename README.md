# GRE Flashcards

A local browser flashcard app built from the Saad Amir GRE vocabulary PDF.

Open index.html in a browser to study. Progress is stored in your browser with localStorage.

Included:
- 772 extracted cards from the PDF
- Core, 160+ Hard, and New Words sections
- click-to-reveal cards
- meaning, memory trick, and example for each word
- AI-enhanced GRE meaning, GRE synonyms, and original PDF source wording
- Again / Hard / Good / Easy spaced review ratings
- category, set, and search browsing
- export/import progress backup

## Progress storage

The app stores progress in browser localStorage under `gre-saad-flashcards-progress-v2`.

Each card keeps:
- `status`: `new`, `learning`, `review`, or `mastered`
- `due`: the next review date
- `reps`: how many times it has been reviewed
- `lapses`: how many times it was marked Again
- `interval`: review spacing in days
- `lastGrade` and `lastReviewed`

Export progress before changing browsers, clearing browser data, or moving devices.

## Flashcard content

Each flashcard keeps the original extracted PDF wording in `pdfMeaning`, then adds AI-enhanced study fields:
- `aiMeaning`: fuller GRE-style definition and context
- `greSynonyms`: close GRE synonyms for sentence equivalence practice
- `memoryTrick`: mnemonic designed for recall
- `example`: GRE-style usage sentence
- `shortMeaning`: compact meaning for browsing

## Free deployment

This is a static app, so it can be deployed free on GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

For the simplest path, upload the folder to GitHub and enable GitHub Pages from the repository settings.

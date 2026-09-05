# Chess Opening Trainer

A small in-browser trainer for learning chess openings and early-game
decisions. Pick an opening, play it out move by move, and get feedback on
whether each move matches the book plan (and why) — plus a computer
opponent that varies its replies so you get practice against several
realistic responses, not just one fixed line.

## Running it

No build step or server required — just open `index.html` in a browser.

```bash
open index.html
```

Or serve it locally (needed by some browsers/extensions for ES modules over
`file://`):

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## How it works

- **Openings** live in [`js/openings.js`](js/openings.js) as small move trees.
  Each node marks whose move it is (`you` or `opp`), the move in SAN, and a
  short explanation of the idea behind it. Nodes where the opponent has more
  than one historically-reasonable reply carry a `weight`, so each run of a
  line can branch differently — that's the "practice against different ways
  they could react" part.
- **The board/game state** is handled by a vendored copy of
  [chess.js](vendor/chess.js) (rules, legal moves, SAN, check/mate
  detection).
- **Coaching feedback** ([`js/engine.js`](js/engine.js)) does two things:
  - When you're still following the book, it just surfaces the curated
    explanation for the move you played.
  - Once you step off the prepared line (or once the book runs out), it
    switches to lightweight heuristics: a simplified static-exchange
    evaluation flags hanging pieces, plus basic opening-principle checks
    (early queen moves, moving the same piece twice, delayed castling,
    central play). The opponent then keeps playing using the same
    evaluation to pick reasonable, non-blundering replies.

## Adding or extending openings

Add an entry to the `OPENINGS` array in `js/openings.js` using the `Y()`
(your move) and `O()` (opponent move, with a `weight`) helpers already
defined there. Deeper trees and more branches at opponent decision points
directly translate into more variety during training.

## Limitations

- Promotions always auto-queen (no under-promotion picker).
- The heuristic feedback is not a real chess engine — it won't catch deep
  tactics or positional subtleties, just common opening-level mistakes.
- No online multiplayer or persistence beyond simple per-opening stats in
  `localStorage`.

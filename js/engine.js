// Lightweight "coaching" heuristics built on top of chess.js.
// Not a real engine — just enough static analysis to give useful feedback:
// hanging-piece detection (simplified static-exchange evaluation, no x-rays)
// and a basic move-scorer used to pick opponent replies once a game leaves
// the curated opening book.

const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 };

function squareToRC(square) {
  const file = square.charCodeAt(0) - 97; // a=0
  const rank = parseInt(square[1], 10);
  return [8 - rank, file]; // board()[0] is rank 8
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Pieces of `color` that attack the square at (tr, tc), given a chess.js board() array.
function squareAttackers(board, tr, tc, color) {
  const results = [];

  const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightOffsets) {
    const r = tr + dr, c = tc + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'n') results.push(VALUES.n);
    }
  }

  const kingOffsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of kingOffsets) {
    const r = tr + dr, c = tc + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'k') results.push(VALUES.k);
    }
  }

  const rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of rookDirs) {
    let r = tr + dr, c = tc + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === color && (p.type === 'r' || p.type === 'q')) results.push(VALUES[p.type]);
        break;
      }
      r += dr; c += dc;
    }
  }

  const bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of bishopDirs) {
    let r = tr + dr, c = tc + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === color && (p.type === 'b' || p.type === 'q')) results.push(VALUES[p.type]);
        break;
      }
      r += dr; c += dc;
    }
  }

  const pawnRow = color === 'w' ? tr + 1 : tr - 1;
  for (const dc of [-1, 1]) {
    const r = pawnRow, c = tc + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'p') results.push(VALUES.p);
    }
  }

  return results;
}

// Minimax exchange simulation with "stand pat" (a side only captures if it's
// not losing material to do so). Returns net material the attacking side
// gains by initiating the capture sequence on the square (>0 = bad for the
// side whose piece sits there).
function simulateExchange(victimValue, attackerQueue, defenderQueue) {
  function recurse(side, currentVictimValue, attackers, defenders) {
    const queue = side === 'attack' ? attackers : defenders;
    if (queue.length === 0) return 0;
    const capturingPieceValue = queue[0];
    const rest = queue.slice(1);
    const nextAttackers = side === 'attack' ? rest : attackers;
    const nextDefenders = side === 'defend' ? rest : defenders;
    const nextSide = side === 'attack' ? 'defend' : 'attack';
    const continuation = recurse(nextSide, capturingPieceValue, nextAttackers, nextDefenders);
    const gainIfCapture = currentVictimValue - continuation;
    return Math.max(0, gainIfCapture);
  }
  return recurse('attack', victimValue, attackerQueue, defenderQueue);
}

function pieceValueAt(game, square) {
  const p = game.get(square);
  return p ? VALUES[p.type] : 0;
}

// Checks whether the piece on `square` (belonging to `color`) is hanging —
// i.e. the opponent can win material by capturing it, after best-effort
// recaptures on both sides.
export function hangingInfo(game, square, color) {
  const board = game.board();
  const [tr, tc] = squareToRC(square);
  const victimValue = pieceValueAt(game, square);
  if (victimValue === 0) return { hanging: false, netLoss: 0 };
  const opponent = color === 'w' ? 'b' : 'w';
  const attackers = squareAttackers(board, tr, tc, opponent).sort((a, b) => a - b);
  if (attackers.length === 0) return { hanging: false, netLoss: 0 };
  const defenders = squareAttackers(board, tr, tc, color).sort((a, b) => a - b);
  const netLoss = simulateExchange(victimValue, attackers, defenders);
  return { hanging: netLoss > 0, netLoss };
}

// Scans every piece of `color` currently on the board and returns the worst
// hanging piece (if any), sorted by material lost.
export function findHangingPieces(game, color) {
  const board = game.board();
  const found = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const info = hangingInfo(game, p.square, color);
        if (info.hanging) found.push({ square: p.square, type: p.type, netLoss: info.netLoss });
      }
    }
  }
  return found.sort((a, b) => b.netLoss - a.netLoss);
}

const CENTER_SQUARES = new Set(['d4', 'd5', 'e4', 'e5']);
const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export function pieceName(type) {
  return PIECE_NAMES[type] || type;
}

// General opening-principle feedback for a move that has left the curated
// book. Returns an array of short comment strings (not exhaustive analysis).
export function heuristicFeedback(game, moveObj, plyBeforeMove, history) {
  const notes = [];
  const color = moveObj.color;
  const fullMoveNumber = Math.ceil((plyBeforeMove + 1) / 2);

  const myHanging = findHangingPieces(game, color);
  if (myHanging.length > 0) {
    const worst = myHanging[0];
    notes.push({
      tone: 'bad',
      text: `Careful — your ${pieceName(worst.type)} on ${worst.square} can be won by your opponent after best play (down about ${worst.netLoss} point${worst.netLoss === 1 ? '' : 's'} of material).`,
    });
  }

  if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
    notes.push({ tone: 'good', text: 'Castling early gets your king to safety and connects your rooks — a solid opening habit.' });
  }

  if (moveObj.piece === 'q' && fullMoveNumber <= 5) {
    notes.push({ tone: 'warn', text: 'Bringing the queen out this early risks losing time if your opponent attacks it while developing a piece.' });
  }

  if ((moveObj.piece === 'n' || moveObj.piece === 'b') && fullMoveNumber <= 8) {
    const priorMovesOfThisPiece = history.filter((h) => h.to && h.piece === moveObj.piece && h.color === color).length;
    if (priorMovesOfThisPiece > 1) {
      notes.push({ tone: 'warn', text: 'That piece has already moved once this opening — moving it again before finishing development can cost you tempo.' });
    }
  }

  if (CENTER_SQUARES.has(moveObj.to) && (moveObj.piece === 'p' || fullMoveNumber <= 6)) {
    notes.push({ tone: 'good', text: `${moveObj.to} is a central square — occupying or controlling the center is one of the main opening goals.` });
  }

  if (notes.length === 0) {
    notes.push({ tone: 'neutral', text: "That's outside our prepared lines, but it's a legal, reasonable move — keep developing pieces and watch for tactics." });
  }

  return notes;
}

// Picks a reasonable reply for the computer opponent once the game has left
// the curated tree. Prefers safe captures, avoids hanging pieces, otherwise
// nudges toward center control / development, with light randomness among
// similarly-scored moves.
export function pickEngineMove(game) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  const color = moves[0].color;

  const scored = moves.map((m) => {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    let score = 0;
    if (m.flags.includes('c') || m.flags.includes('e')) {
      const capturedValue = VALUES[m.captured] || 1;
      score += capturedValue * 2;
    }
    const hanging = findHangingPieces(game, color);
    for (const h of hanging) score -= h.netLoss * 3;
    if (CENTER_SQUARES.has(m.to)) score += 1;
    if (m.flags.includes('k') || m.flags.includes('q')) score += 2;
    if (game.in_checkmate && game.in_checkmate()) score += 1000;
    game.undo();
    return { move: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topMoves = scored.filter((s) => s.score >= topScore - 0.5);
  const pick = topMoves[Math.floor(Math.random() * topMoves.length)];
  return pick.move;
}

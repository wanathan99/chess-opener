import { Chess } from '../vendor/chess.js';
import { OPENINGS, findOpening } from './openings.js';
import { heuristicFeedback, pickEngineMove, explainIllegalMove, findHangingPieces, pieceName } from './engine.js';

const PIECE_GLYPHS = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const boardEl = document.getElementById('board');
const openingSelect = document.getElementById('opening-select');
const openingSummary = document.getElementById('opening-summary');
const startBtn = document.getElementById('start-btn');
const hintBtn = document.getElementById('hint-btn');
const statsBox = document.getElementById('stats-box');
const turnStatus = document.getElementById('turn-status');
const moveListEl = document.getElementById('move-list');
const coachFeed = document.getElementById('coach-feed');

let game = new Chess();
let opening = null;
let currentNode = null;
let bookActive = false;
let selectedSquare = null;
let lastMove = null;
let awaitingOpponent = false;

// --- opening picker -------------------------------------------------------

function populateOpeningSelect() {
  const white = OPENINGS.filter((o) => o.side === 'w');
  const black = OPENINGS.filter((o) => o.side === 'b');

  const makeGroup = (label, list) => {
    const group = document.createElement('optgroup');
    group.label = label;
    for (const o of list) {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.name;
      group.appendChild(opt);
    }
    return group;
  };

  openingSelect.appendChild(makeGroup('Play as White', white));
  openingSelect.appendChild(makeGroup('Play as Black', black));
  updateSummary();
}

function updateSummary() {
  const o = findOpening(openingSelect.value);
  openingSummary.textContent = o ? o.summary : '';
}

openingSelect.addEventListener('change', updateSummary);

// --- stats (per-opening, kept in localStorage) ---------------------------

function loadStats(id) {
  try {
    const raw = localStorage.getItem('coach-stats-' + id);
    return raw ? JSON.parse(raw) : { attempts: 0, cleanRuns: 0, mistakes: 0 };
  } catch {
    return { attempts: 0, cleanRuns: 0, mistakes: 0 };
  }
}

function saveStats(id, stats) {
  try {
    localStorage.setItem('coach-stats-' + id, JSON.stringify(stats));
  } catch {
    /* ignore storage failures (private browsing, quota, etc.) */
  }
}

let stats = { attempts: 0, cleanRuns: 0, mistakes: 0 };
let mistakesThisLine = 0;

function renderStats() {
  statsBox.textContent =
    `Lines started: ${stats.attempts}\n` +
    `Clean runs (no mistakes): ${stats.cleanRuns}\n` +
    `Total mistakes flagged: ${stats.mistakes}`;
}

// --- game lifecycle -------------------------------------------------------

function startLine() {
  opening = findOpening(openingSelect.value);
  if (!opening) return;
  game = new Chess();
  currentNode = opening.tree;
  bookActive = true;
  selectedSquare = null;
  lastMove = null;
  mistakesThisLine = 0;
  stats = loadStats(opening.id);
  stats.attempts += 1;
  saveStats(opening.id, stats);
  renderStats();

  moveListEl.innerHTML = '';
  coachFeed.innerHTML = '';
  addCoachNote('info', null, `Training the ${opening.name} as ${opening.side === 'w' ? 'White' : 'Black'}. ${opening.summary}`);

  render();
  advanceOpponentIfNeeded();
}

function traineeColor() {
  return opening.side;
}

function isTraineeTurn() {
  return game.turn() === traineeColor();
}

// --- coaching feed ----------------------------------------------------

function addCoachNote(tone, moveLabel, text) {
  const div = document.createElement('div');
  div.className = 'note ' + tone;
  if (moveLabel) {
    const span = document.createElement('span');
    span.className = 'note-move';
    span.textContent = moveLabel;
    div.appendChild(span);
  }
  div.appendChild(document.createTextNode(text));
  coachFeed.appendChild(div);
  coachFeed.scrollTop = coachFeed.scrollHeight;
}

function logMove(san) {
  const history = game.history();
  const moveNo = Math.ceil(history.length / 2);
  const isWhiteMove = history.length % 2 === 1;
  if (isWhiteMove) {
    const span = document.createElement('span');
    span.textContent = `${moveNo}. ${san} `;
    moveListEl.appendChild(span);
  } else {
    const span = document.createElement('span');
    span.textContent = `${san}   `;
    moveListEl.appendChild(span);
  }
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

// --- move handling ----------------------------------------------------

function processTraineeMove(moveResult) {
  logMove(moveResult.san);

  if (bookActive) {
    const match = currentNode.children.find((c) => c.move === moveResult.san);
    if (match) {
      currentNode = match;
      addCoachNote('good', moveResult.san, match.explain);
    } else {
      bookActive = false;
      addCoachNote('warn', moveResult.san, "That's a step off our prepared line for this opening.");
      runHeuristics(moveResult);
    }
  } else {
    runHeuristics(moveResult);
  }

  if (checkGameOver()) return;
  advanceOpponentIfNeeded();
}

function runHeuristics(moveResult) {
  const plyBefore = game.history().length - 1;
  const notes = heuristicFeedback(game, moveResult, plyBefore, game.history({ verbose: true }));
  for (const n of notes) {
    if (n.tone === 'bad' || n.tone === 'warn') {
      mistakesThisLine += 1;
      stats.mistakes += 1;
      saveStats(opening.id, stats);
      renderStats();
    }
    addCoachNote(n.tone, null, n.text);
  }
}

function advanceOpponentIfNeeded() {
  if (game.game_over()) return;
  if (isTraineeTurn()) return;

  awaitingOpponent = true;
  render();
  setTimeout(() => {
    if (bookActive && currentNode.children.length > 0) {
      const totalWeight = currentNode.children.reduce((s, c) => s + (c.weight || 1), 0);
      let roll = Math.random() * totalWeight;
      let chosen = currentNode.children[0];
      for (const c of currentNode.children) {
        roll -= c.weight || 1;
        if (roll <= 0) { chosen = c; break; }
      }
      const result = game.move(chosen.move);
      currentNode = chosen;
      logMove(result.san);
      addCoachNote('info', result.san, chosen.explain);
    } else {
      bookActive = false;
      const engineMove = pickEngineMove(game);
      if (engineMove) {
        const result = game.move({ from: engineMove.from, to: engineMove.to, promotion: engineMove.promotion });
        logMove(result.san);
        addCoachNote('info', result.san, "Outside our prepared book now — the opponent plays a reasonable, engine-picked reply.");
      }
    }
    awaitingOpponent = false;
    checkGameOver();
    render();
  }, 350);
}

function checkGameOver() {
  if (!game.game_over()) return false;
  let msg;
  if (game.in_checkmate()) {
    const winner = game.turn() === traineeColor() ? 'Opponent' : 'You';
    msg = `Checkmate — ${winner} won.`;
  } else if (game.in_stalemate()) {
    msg = 'Stalemate — draw.';
  } else if (game.in_draw()) {
    msg = 'Draw (insufficient material or repetition/50-move rule).';
  } else {
    msg = 'Game over.';
  }
  addCoachNote(mistakesThisLine === 0 ? 'good' : 'info', null, msg);
  if (mistakesThisLine === 0 && bookActive === false) {
    // reached game end; only count as a "clean run" if it was still book-accurate throughout
  }
  if (mistakesThisLine === 0) {
    stats.cleanRuns += 1;
    saveStats(opening.id, stats);
    renderStats();
  }
  render();
  return true;
}

function handleUserMove(from, to) {
  const verboseMoves = game.moves({ square: from, verbose: true });
  const candidate = verboseMoves.find((m) => m.to === to);
  if (!candidate) return;
  const needsPromotion = candidate.flags.includes('p');
  const promotion = needsPromotion ? 'q' : undefined;

  // Play the move tentatively so we can analyze the resulting position
  // before it's finalized — undo it again if the trainee cancels.
  const moveResult = game.move({ from, to, promotion });
  if (!moveResult) return;

  const reasons = [];
  if (bookActive) {
    const match = currentNode.children.find((c) => c.move === moveResult.san);
    if (!match) {
      const recommended = currentNode.children.find((c) => c.mover === 'you');
      reasons.push(
        recommended
          ? `That's not the book move here. The recommended move is ${recommended.move} — ${recommended.explain}`
          : "That's outside our prepared line for this opening."
      );
    }
  }
  const hanging = findHangingPieces(game, moveResult.color);
  if (hanging.length > 0) {
    const worst = hanging[0];
    reasons.push(`This hangs your ${pieceName(worst.type)} on ${worst.square} — your opponent can win about ${worst.netLoss} point${worst.netLoss === 1 ? '' : 's'} of material.`);
  }

  if (reasons.length > 0) {
    game.undo();
    selectedSquare = null;
    render();
    promptConfirm(reasons, () => {
      const finalResult = game.move({ from, to, promotion });
      lastMove = { from, to };
      render();
      processTraineeMove(finalResult);
    });
    return;
  }

  lastMove = { from, to };
  selectedSquare = null;
  render();
  processTraineeMove(moveResult);
}

function promptConfirm(reasons, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';

  const box = document.createElement('div');
  box.className = 'confirm-box';

  const title = document.createElement('h3');
  title.textContent = 'Before you play that…';
  box.appendChild(title);

  for (const reason of reasons) {
    const p = document.createElement('p');
    p.textContent = reason;
    box.appendChild(p);
  }

  const buttonRow = document.createElement('div');
  buttonRow.className = 'confirm-buttons';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'confirm-cancel';
  cancelBtn.textContent = 'Choose a different move';

  const playBtn = document.createElement('button');
  playBtn.className = 'confirm-play';
  playBtn.textContent = 'Play it anyway';

  buttonRow.appendChild(cancelBtn);
  buttonRow.appendChild(playBtn);
  box.appendChild(buttonRow);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  cancelBtn.addEventListener('click', () => overlay.remove());
  playBtn.addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// --- hint ---------------------------------------------------------------

function showHint() {
  if (!opening) {
    addCoachNote('neutral', null, 'Pick an opening and press Start first.');
    return;
  }
  if (!bookActive) {
    addCoachNote('neutral', null, "You're already off the prepared book, so there's no scripted hint here — fall back on opening principles: develop pieces, control the center, keep your king safe.");
    return;
  }
  if (!isTraineeTurn()) {
    addCoachNote('neutral', null, "It's the opponent's move.");
    return;
  }
  const nextYou = currentNode.children.find((c) => c.mover === 'you');
  if (!nextYou) {
    addCoachNote('neutral', null, 'No further book move recorded from here.');
    return;
  }
  addCoachNote('info', nextYou.move, `Hint: ${nextYou.explain}`);
}

// --- board rendering ------------------------------------------------------

function squareColor(fileIdx, rankIdx) {
  return (fileIdx + rankIdx) % 2 === 0 ? 'light' : 'dark';
}

function render() {
  boardEl.innerHTML = '';
  const flip = opening && opening.side === 'b';
  const board = game.board(); // row0 = rank8 .. row7 = rank1, each row a=0..h=7

  const kingInCheckSquare = (() => {
    if (!game.in_check()) return null;
    const turn = game.turn();
    const b = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p && p.type === 'k' && p.color === turn) return p.square;
      }
    }
    return null;
  })();

  let legalTargets = [];
  if (selectedSquare) {
    legalTargets = game.moves({ square: selectedSquare, verbose: true });
  }

  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const boardRow = flip ? 7 - displayRow : displayRow;
      const boardCol = flip ? 7 - displayCol : displayCol;
      const piece = board[boardRow][boardCol];
      const file = 'abcdefgh'[boardCol];
      const rank = 8 - boardRow;
      const square = `${file}${rank}`;

      const div = document.createElement('div');
      div.className = `square ${squareColor(boardCol, boardRow)}`;
      div.dataset.square = square;

      if (selectedSquare === square) div.classList.add('selected');
      if (lastMove && (lastMove.from === square || lastMove.to === square)) div.classList.add('last-move');
      if (kingInCheckSquare === square) div.classList.add('in-check');

      if (piece) {
        const pieceSpan = document.createElement('span');
        pieceSpan.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
        pieceSpan.textContent = PIECE_GLYPHS[piece.color][piece.type];
        div.appendChild(pieceSpan);
      }

      const target = legalTargets.find((m) => m.to === square);
      if (target) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (piece ? ' capture' : '');
        div.appendChild(dot);
      }

      div.addEventListener('click', () => onSquareClick(square));
      boardEl.appendChild(div);
    }
  }

  updateTurnStatus();
}

function updateTurnStatus() {
  if (!opening) {
    turnStatus.textContent = 'Pick an opening and press Start.';
    return;
  }
  if (game.game_over()) {
    turnStatus.textContent = 'Game over — press Start to try again.';
    return;
  }
  if (awaitingOpponent) {
    turnStatus.textContent = 'Opponent is thinking…';
    return;
  }
  turnStatus.textContent = isTraineeTurn()
    ? `Your move (${traineeColor() === 'w' ? 'White' : 'Black'})${game.in_check() ? ' — you are in check!' : ''}`
    : "Opponent's move…";
}

function onSquareClick(square) {
  if (!opening || game.game_over() || awaitingOpponent) return;
  if (!isTraineeTurn()) return;

  const piece = game.get(square);

  if (selectedSquare && selectedSquare !== square) {
    const verboseMoves = game.moves({ square: selectedSquare, verbose: true });
    const isLegalTarget = verboseMoves.some((m) => m.to === square);
    if (isLegalTarget) {
      handleUserMove(selectedSquare, square);
      return;
    }
    if (!piece || piece.color !== traineeColor()) {
      addCoachNote('bad', null, explainIllegalMove(game, selectedSquare, square));
      selectedSquare = null;
      render();
      return;
    }
  }

  if (piece && piece.color === traineeColor()) {
    selectedSquare = selectedSquare === square ? null : square;
  } else {
    selectedSquare = null;
  }
  render();
}

// --- wire up --------------------------------------------------------------

populateOpeningSelect();
startBtn.addEventListener('click', startLine);
hintBtn.addEventListener('click', showHint);
render();

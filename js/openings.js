// Opening repertoire trees.
//
// Each node: { mover: 'you' | 'opp', move: <SAN>, explain: <string>, weight?: number, children: [...] }
// `weight` only matters on 'opp' nodes with siblings — it controls how often
// the trainer picks that particular reply when several are possible, so you
// see a mix of the ways a real opponent might react.
//
// A tree's root has mover: null, move: null and just wraps the first move.

function Y(move, explain, children = []) {
  return { mover: 'you', move, explain, children };
}

function O(move, explain, weight, children = []) {
  return { mover: 'opp', move, explain, weight, children };
}

export const OPENINGS = [
  {
    id: 'italian',
    name: 'Italian Game',
    side: 'w',
    summary: 'A classical e4 opening for White that fights for the center and aims straight at f7.',
    tree: {
      mover: null, move: null, children: [
        Y('e4', 'Opens the diagonals for your bishop and queen and stakes a claim in the center.', [
          O('e5', 'Black claims equal central space — the classical, most natural reply.', 1, [
            Y('Nf3', 'Develops a piece and attacks the e5 pawn.', [
              O('Nc6', 'Defends e5 and develops a piece of its own.', 1, [
                Y('Bc4', "Aims straight at f7, the weakest square in Black's camp, and prepares to castle quickly.", [
                  O('Bc5', 'The Giuoco Piano — Black mirrors your bishop and fights for the same diagonal.', 3, [
                    Y('c3', 'Prepares d4 so you can build a full pawn center next.', [
                      O('Nf6', 'Develops and counterattacks your e4 pawn.', 1, [
                        Y('d4', "A double attack — it hits both the e5 pawn and the bishop on c5. Your e4 pawn looks loose to Black's knight, but grabbing it with ...Nxe4? is a trap: 6.dxc5! wins the bishop, since the knight abandoned its defense.", [
                          O('exd4', "Black captures rather than let you get a free central tempo.", 1, [
                            Y('cxd4', "Recaptures and restores a full classical center — Black's bishop on c5 usually has to retreat to b4+ or b6 next.", []),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                  O('Nf6', 'The Two Knights Defense — instead of mirroring, Black counterattacks your e4 pawn immediately.', 2, [
                    Y('d3', "A modest, solid choice that supports e4 and keeps your center flexible. (The sharper 4.Ng5 dives into 'Fried Liver' theory you can study once you're comfortable here.)", [
                      O('Bc5', 'Black develops the bishop to its natural square.', 1, [
                        Y('c3', 'Prepares d4 and continues building your space advantage.', []),
                      ]),
                    ]),
                  ]),
                  O('Be7', 'A passive setup (Hungarian Defense) that gives up the fight for the center.', 1, [
                    Y('d4', 'Since Black conceded the center, take it immediately.', [
                      O('d6', 'A cramped but solid try to hold the position together.', 1, [
                        Y('Nc3', "Simply continue developing — your space advantage will tell.", []),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'ruy-lopez',
    name: 'Ruy Lopez (Spanish)',
    side: 'w',
    summary: 'One of the oldest and most respected e4 openings — pin the knight defending e5 and squeeze.',
    tree: {
      mover: null, move: null, children: [
        Y('e4', 'Center pawn move, opens lines for your pieces.', [
          O('e5', "Black meets you in the center — the classical reply.", 1, [
            Y('Nf3', 'Develops and attacks e5.', [
              O('Nc6', 'Defends the pawn and develops.', 1, [
                Y('Bb5', "Pins Black's knight to the king — if it ever moves, e5 falls.", [
                  O('a6', 'The Morphy Defense — by far the most common reply, asking your bishop what it plans to do.', 3, [
                    Y('Ba4', 'Keeps the pin alive rather than trading the bishop off.', [
                      O('Nf6', 'Develops and attacks your e4 pawn.', 1, [
                        Y('O-O', 'Castle before deciding how to meet the attack on e4 — the pawn is tactically defended by your rook.', [
                          O('Be7', 'A solid, flexible developing move.', 1, [
                            Y('Re1', "Adds a second defender to e4 and prepares to meet ...b5 with a timely d4 or c3 push.", [
                              O('b5', 'Gains space and gets ready to kick your bishop.', 1, [
                                Y('Bb3', 'Retreats to a safe, still-useful diagonal aiming at f7.', [
                                  O('d6', "Solidifies e5 and opens the bishop on c8.", 1, []),
                                ]),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                  O('Nf6', "The Berlin Defense — instead of a6, Black counterattacks e4 right away.", 2, [
                    Y('O-O', "Castle and let Black take the pawn; you get it back with a central strike.", [
                      O('Nxe4', 'Grabs the pawn.', 1, [
                        Y('d4', "Opens the center while Black's knight is offside.", [
                          O('Nd6', 'Retreats, attacking your bishop.', 1, [
                            Y('Bxc6', 'Trades off the defender of e5.', [
                              O('dxc6', 'Recaptures, doubling pawns but gaining the bishop pair.', 1, [
                                Y('dxe5', "Wins the pawn back — this often heads into the famous 'Berlin Wall' endgame, which is drawish but very solid for Black, so aim to press a tiny structural edge rather than expect a quick knockout.", []),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                  O('f5', 'The Schliemann Defense — a sharp, committal try that immediately fights for the initiative.', 1, [
                    Y('Nc3', 'The simplest response: develop soundly and meet the complications with accurate, calm play rather than matching sharpness with sharpness.', [
                      O('fxe4', 'Grabs the pawn.', 1, [
                        Y('Nxe4', 'Recaptures; your development lead should compensate for the open position.', []),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'sicilian',
    name: 'Sicilian Defense',
    side: 'b',
    summary: "The sharpest reply to 1.e4 — Black fights for the center asymmetrically instead of copying White.",
    tree: {
      mover: null, move: null, children: [
        O('e4', 'White grabs the center.', 1, [
          Y('c5', 'Unbalances the position immediately instead of mirroring with 1...e5 — you fight for d4 from the side.', [
            O('Nf3', 'The most popular try — White heads toward an Open Sicilian with d4.', 3, [
              Y('d6', 'A flexible move that supports a future ...Nf6 without letting it get harassed by e5.', [
                O('d4', 'Strikes the center — the main line.', 1, [
                  Y('cxd4', 'Trades off the flank pawn for the central one, exactly the point of 1...c5.', [
                    O('Nxd4', 'Recaptures.', 1, [
                      Y('Nf6', 'Develops and attacks e4.', [
                        O('Nc3', 'Defends e4 and develops.', 1, [
                          Y('a6', "The Najdorf — a flexible waiting/expanding move that prepares ...e5 or ...e6 and queenside expansion with ...b5 while ruling out Nb5 jumps.", []),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
            O('Nc3', 'The Closed Sicilian — White avoids the main theoretical battles and develops naturally instead.', 2, [
              Y('Nc6', 'Develops and fights for d4/e5.', [
                O('g3', 'White fianchettoes rather than pushing d4.', 1, [
                  Y('g6', "Mirror the fianchetto — you'll fight for the center from a distance and can strike with ...d6/...e5 or ...e6 later.", [
                    O('Bg2', 'Completes the fianchetto.', 1, [
                      Y('Bg7', 'Symmetrical setup; the middlegame plans (central breaks, piece placement) decide the game.', []),
                    ]),
                  ]),
                ]),
              ]),
            ]),
            O('c3', 'The Alapin — White prepares d4 without needing Nc3, keeping options open.', 1, [
              Y('Nf6', 'Attacks e4 immediately, the most testing response.', [
                O('e5', 'Pushes the knight away, gaining space.', 1, [
                  Y('Nd5', 'The knight is well-placed here for now, eyeing c3/f4 and hard to dislodge.', [
                    O('d4', 'Continues building the center.', 1, [
                      Y('cxd4', "Strikes back at the center rather than letting White's space grow further.", [
                        O('Nf3', 'Develops and prepares to recapture on d4.', 1, []),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'french',
    name: 'French Defense',
    side: 'b',
    summary: 'A solid, resilient reply to 1.e4 that accepts a cramped position in exchange for a rock-solid pawn chain.',
    tree: {
      mover: null, move: null, children: [
        O('e4', 'White grabs the center.', 1, [
          Y('e6', 'Prepares ...d5 while keeping the option of a solid pawn chain, at the cost of temporarily blocking the light-squared bishop.', [
            O('d4', 'White builds a full center — the main line.', 1, [
              Y('d5', 'Strikes back in the center immediately, the whole point of 1...e6.', [
                O('Nc3', 'Develops and defends e4 — leads to Classical/Winawer-type positions.', 2, [
                  Y('Nf6', 'The Classical French — attacks e4 and develops.', [
                    O('Bg5', 'Pins the knight to add pressure.', 1, [
                      Y('Be7', 'Breaks the pin and prepares to castle; plan a later ...h6 and the freeing break ...c5.', []),
                    ]),
                  ]),
                ]),
                O('Nd2', 'The Tarrasch Variation — a slightly quieter setup that avoids a pin on the f6-knight.', 2, [
                  Y('c5', "Strikes at the center immediately — the main modern approach, exploiting the fact this knight can't defend c-pawn tension as flexibly as one on c3.", [
                    O('Ngf3', "Develops the kingside knight (needs the 'g' to distinguish it from the one on d2).", 1, [
                      Y('cxd4', "Trades before White can support d4 further, simplifying into a comfortable position.", []),
                    ]),
                  ]),
                ]),
                O('e5', 'The Advance Variation — White grabs space rather than contest the center further.', 2, [
                  Y('c5', 'Strikes immediately at the base of the pawn chain — the standard French counterplan.', [
                    O('c3', 'Defends the chain.', 1, [
                      Y('Nc6', 'Adds more pressure on d4.', [
                        O('Nf3', 'Develops and defends d4.', 1, [
                          Y('Qb6', "Piles onto d4/b2 — a typical French Advance middlegame plan.", []),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'caro-kann',
    name: 'Caro-Kann Defense',
    side: 'b',
    summary: "Similar aims to the French, but you get your light-squared bishop out before locking the pawn chain.",
    tree: {
      mover: null, move: null, children: [
        O('e4', 'White grabs the center.', 1, [
          Y('c6', 'Prepares ...d5 while keeping the option to develop the light-squared bishop outside the pawn chain — the key difference from the French.', [
            O('d4', 'White builds the center.', 1, [
              Y('d5', 'Challenges the center at once.', [
                O('Nc3', 'Develops and defends e4 — treat Nd2 the same way; both lead to similar structures.', 2, [
                  Y('dxe4', "Trades rather than maintain the tension, since the follow-up gets your bishop out for free.", [
                    O('Nxe4', 'Recaptures.', 1, [
                      Y('Bf5', "Develops the bishop outside the pawn chain before playing ...e6 — this is the whole point of the Caro-Kann versus the French.", []),
                    ]),
                  ]),
                ]),
                O('e5', 'The Advance Variation — space instead of contesting the center further.', 2, [
                  Y('Bf5', 'Get the bishop out immediately, before it gets locked in behind the pawn chain.', [
                    O('Nf3', 'Develops naturally.', 1, [
                      Y('e6', 'Now complete the pawn chain — the bishop is already safely outside it.', []),
                    ]),
                  ]),
                ]),
                O('exd5', 'The Exchange Variation — trades off the central tension.', 2, [
                  Y('cxd5', "Symmetrical and very solid, if a touch passive; typical plans are ...Nc6, ...Bf5 or ...Bg4, and ...e6.", []),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'queens-gambit',
    name: "Queen's Gambit",
    side: 'w',
    summary: 'A d4 opening that offers a flank pawn to build a big classical center.',
    tree: {
      mover: null, move: null, children: [
        Y('d4', 'Central pawn move, more solid than 1.e4 since it is defended by the queen.', [
          O('d5', "Black meets you in the center — the classical reply.", 1, [
            Y('c4', "Offers a pawn to lure Black's d-pawn away from the center — if Black takes, you'll get it back with e4 later.", [
              O('e6', 'The Queen\'s Gambit Declined — solid, but temporarily locks in the light-squared bishop.', 3, [
                Y('Nc3', 'Develops and adds pressure on d5.', [
                  O('Nf6', 'Develops and defends d5.', 1, [
                    Y('Bg5', "Pins the knight, adding pressure on d5 and preparing to castle long or short.", []),
                  ]),
                ]),
              ]),
              O('c6', 'The Slav Defense — keeps the light-squared bishop free, unlike the QGD.', 2, [
                Y('Nf3', 'Develops flexibly.', [
                  O('Nf6', 'Develops and defends d5.', 1, [
                    Y('Nc3', 'Adds pressure on d5; Black must soon decide how to complete development.', []),
                  ]),
                ]),
              ]),
              O('dxc4', "The Queen's Gambit Accepted — Black grabs the pawn, planning to give it back later for easy development.", 1, [
                Y('Nf3', "Don't rush to recapture — develop first; the pawn cannot be held long-term.", [
                  O('Nf6', 'Develops.', 1, [
                    Y('e3', 'Prepares to recapture on c4 with the bishop.', [
                      O('e6', 'Continues developing.', 1, [
                        Y('Bxc4', 'Regains the pawn with a comfortable, classical position and a lead in development.', []),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'london',
    name: 'London System',
    side: 'w',
    summary: 'A low-theory d4 setup — you play (almost) the same plan regardless of what Black does.',
    tree: {
      mover: null, move: null, children: [
        Y('d4', 'Central pawn move.', [
          O('d5', 'Black meets you in the center.', 2, [
            Y('Bf4', 'Develops the bishop before playing e3, so it is not blocked in — the signature London move.', [
              O('Nf6', 'Develops naturally.', 1, [
                Y('e3', "Now support the center; your bishop is already outside the pawn chain.", [
                  O('e6', 'A solid, flexible setup.', 1, [
                    Y('c3', 'Builds a stable pyramid-shaped structure; plan Nbd2, Bd3, O-O and a later e4 break.', [
                      O('c5', 'Strikes at your center.', 1, [
                        Y('Nf3', "Just continue developing — the London's structure holds up well against most central strikes.", []),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
          O('Nf6', 'Black develops flexibly without committing the center pawn yet.', 2, [
            Y('Bf4', 'Same idea regardless — get the bishop out before e3.', [
              O('g6', "Black heads for a King's Indian-style setup.", 1, [
                Y('e3', 'The same solid plan works here too — that consistency is the main appeal of the London.', [
                  O('Bg7', 'Completes the fianchetto.', 1, [
                    Y('c3', 'Keep building the same stable structure; plan Nbd2, Bd3/Be2, O-O.', []),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },

  {
    id: 'kings-indian',
    name: "King's Indian Defense",
    side: 'b',
    summary: 'Let White build a big center, then counterattack it with pawn breaks and a kingside initiative.',
    tree: {
      mover: null, move: null, children: [
        O('d4', 'White claims the center.', 1, [
          Y('Nf6', 'Develops without committing the center pawns yet.', [
            O('c4', 'White expands further.', 1, [
              Y('g6', "Prepares to fianchetto and pressure White's center from a distance rather than occupy it directly.", [
                O('Nc3', 'Develops and defends e4/d5.', 1, [
                  Y('Bg7', 'Completes the fianchetto, eyeing the long diagonal and White\'s future center.', [
                    O('e4', 'The Classical Variation — White builds a big classical center.', 3, [
                      Y('d6', "Prepares ...e5 or ...Nbd7, and keeps the center flexible for now.", [
                        O('Nf3', 'Develops.', 1, [
                          Y('O-O', 'Get the king safe before committing to a central break.', [
                            O('Be2', 'Completes development, ready to castle.', 1, [
                              Y('e5', "The classic King's Indian counter — challenge the center now that your king is safe; typical follow-ups are ...Nbd7/...Na6 and a later ...f5 kingside expansion.", []),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                    O('g3', 'The Fianchetto Variation — White mirrors your setup instead of grabbing the center with pawns.', 2, [
                      Y('d6', 'Keep the same flexible setup.', [
                        O('Bg2', 'Completes the fianchetto.', 1, [
                          Y('O-O', 'Castle into safety.', [
                            O('Nf3', 'Completes development.', 1, [
                              Y('Nbd7', "Prepares ...e5 with support; both sides fianchettoed, so plans revolve around central and queenside pawn breaks rather than a sharp kingside race.", []),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },
  },
];

export function findOpening(id) {
  return OPENINGS.find((o) => o.id === id);
}

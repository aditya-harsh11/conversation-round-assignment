// Builds a 5-round schedule for 6 people (indexes 0-5) across rooms A, B, C.
// Rules, in priority order:
//   1. Everyone talks to everyone else exactly once.
//   2. Nobody is in the same room two rounds in a row.
//   3. Nobody sits in the same room + seat twice (only unavoidable for the one
//      person who has to visit a room 3 times).
//   4. Seats switch Left/Right between rounds as often as possible.

const ROOMS = ['A', 'B', 'C'];
const ROOM_ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Round-robin pairings: one person stays fixed, the other five rotate.
function roundRobinPairs(people) {
  const rounds = [];
  for (let r = 0; r < 5; r++) {
    const pairs = [[people[5], people[r]]];
    for (let k = 1; k <= 2; k++) pairs.push([people[(r + k) % 5], people[(r - k + 5) % 5]]);
    rounds.push(pairs);
  }
  return rounds;
}

// Randomly order rounds and assign pairs to rooms until no one is in the same room twice in a row.
function assignRooms(pairRounds) {
  while (true) {
    const rounds = shuffle(pairRounds).map(pairs => {
      const order = pick(ROOM_ORDERS);
      return pairs.map((pair, i) => ({ pair, room: order[i] }));
    });
    const lastRoom = {};
    let ok = true;
    rounds.forEach(round => round.forEach(({ pair, room }) => {
      pair.forEach(p => {
        if (lastRoom[p] === room) ok = false;
        lastRoom[p] = room;
      });
    }));
    if (ok) return rounds;
  }
}

// Try every Left/Right combination (2^15) and keep a random one of the best.
function assignSeats(rounds) {
  let best = [];
  let bestScore = Infinity;
  for (let mask = 0; mask < 1 << 15; mask++) {
    const seen = Array.from({ length: 6 }, () => new Set());
    const lastSeat = {};
    let repeatSpots = 0;
    let sameSeatInARow = 0;
    let bit = 0;
    rounds.forEach(round => round.forEach(({ pair, room }) => {
      const flip = (mask >> bit++) & 1;
      [[pair[flip], 0], [pair[1 - flip], 1]].forEach(([p, seat]) => {
        const spot = room * 2 + seat;
        if (seen[p].has(spot)) repeatSpots++;
        seen[p].add(spot);
        if (lastSeat[p] === seat) sameSeatInARow++;
        lastSeat[p] = seat;
      });
    }));
    const score = repeatSpots * 100 + sameSeatInARow;
    if (score < bestScore) { bestScore = score; best = [mask]; }
    else if (score === bestScore) best.push(mask);
  }
  const mask = pick(best);
  let bit = 0;
  return rounds.map(round => round.map(({ pair, room }) => {
    const flip = (mask >> bit++) & 1;
    return { room: ROOMS[room], left: pair[flip], right: pair[1 - flip] };
  }));
}

// Returns 5 rounds, each a list of { room, left, right } with person indexes 0-5.
function buildSchedule() {
  const rounds = assignSeats(assignRooms(roundRobinPairs(shuffle([0, 1, 2, 3, 4, 5]))));
  return rounds.map(round => round.sort((a, b) => a.room.localeCompare(b.room)));
}

if (typeof module !== 'undefined') module.exports = { buildSchedule };

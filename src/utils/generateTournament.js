// Utility to generate a 32-slot tournament bracket with seeding and byes
// Input: teams: Array<{ name: string, teamId: string, points: number }>
// Output: Array of match objects for all phases

function getSeedingOrder32() {
  // Standard 32-team bracket seeding (1 vs 32, 2 vs 31, ...)
  return [
    1, 32, 16, 17, 9, 24, 8, 25,
    5, 28, 12, 21, 13, 20, 4, 29,
    3, 30, 14, 19, 11, 22, 6, 27,
    7, 26, 10, 23, 15, 18, 2, 31
  ];
}

export function generateTournament(teams) {
  // Sort by points descending
  const sorted = [...teams].sort((a, b) => b.points - a.points);
  const slots = 32;
  const byes = slots - sorted.length;
  // Assign byes to top N teams
  const seeded = sorted.map((team, i) => ({
    ...team,
    seed: i + 1,
    bye: i < byes
  }));

  // Place teams in bracket by seeding order
  const seedingOrder = getSeedingOrder32();
  const bracket = Array(slots).fill(null);
  seeded.forEach((team, i) => {
    bracket[seedingOrder[i] - 1] = team;
  });

  // Helper to create matchId
  const matchId = (phase, idx) => `${phase}_${idx + 1}`;

  // Build all matches for all phases
  const allMatches = [];
  let prevPhaseMatches = [];

  // Phase 1: 16 matches
  for (let i = 0; i < slots; i += 2) {
    const teamA = bracket[i];
    const teamB = bracket[i + 1];
    const idx = i / 2;
    const match = {
      matchId: matchId(1, idx),
      phase: 1,
      matchOrder: idx,
      teamA_id: teamA?.teamId || null,
      teamB_id: teamB?.teamId || null,
      teamA_name: teamA?.name || null,
      teamB_name: teamB?.name || null,
      scoreA: null,
      scoreB: null,
      winnerId: null,
      nextMatchId: matchId(2, Math.floor(idx / 2))
    };
    allMatches.push(match);
    prevPhaseMatches.push(match);
  }

  // Phases 2-5
  let phase = 2;
  let matchesInPhase = prevPhaseMatches.length / 2;
  while (matchesInPhase >= 1) {
    const thisPhase = [];
    for (let i = 0; i < matchesInPhase; i++) {
      const match = {
        matchId: matchId(phase, i),
        phase,
        matchOrder: i,
        teamA_id: null,
        teamB_id: null,
        teamA_name: null,
        teamB_name: null,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        nextMatchId: matchesInPhase > 1 ? matchId(phase + 1, Math.floor(i / 2)) : null
      };
      allMatches.push(match);
      thisPhase.push(match);
    }
    prevPhaseMatches = thisPhase;
    matchesInPhase = matchesInPhase / 2;
    phase++;
  }

  return allMatches;
}

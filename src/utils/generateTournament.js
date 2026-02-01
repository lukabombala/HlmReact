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
  const seedingOrder = getSeedingOrder32();
  const bracket = Array(slots).fill(null);
  for (let i = 0; i < Math.min(sorted.length, seedingOrder.length); i++) {
    bracket[seedingOrder[i] - 1] = {
      ...sorted[i],
      seed: i + 1
    };
  }

  // DEBUG: Log bracket assignment for diagnosis
  console.log('Bracket assignment:', bracket.map(t => t ? t.name : null));

  // DEBUG: Check for duplicate teamIds in bracket
  const seen = new Set();
  const duplicates = [];
  bracket.forEach(t => {
    if (t && t.teamId) {
      if (seen.has(t.teamId)) duplicates.push(t.teamId);
      seen.add(t.teamId);
    }
  });
  if (duplicates.length > 0) {
    console.warn('DUPLICATE TEAM IDS IN BRACKET:', duplicates);
  }

  // Helper to create matchId
  const matchId = (phase, idx) => `${phase}_${idx + 1}`;

  // Build only phase 1 matches, and empty placeholders for later phases
  const allMatches = [];
  let prevPhaseMatches = [];

  // Phase 1: 16 matches
  for (let i = 0; i < slots; i += 2) {
    let teamA = bracket[i];
    let teamB = bracket[i + 1];
    const idx = i / 2;
    // If only one team is present, always assign to teamA and set teamB to null
    if (teamA && !teamB) {
      // teamA is present, teamB is null
      // nothing to change
    } else if (!teamA && teamB) {
      // only teamB is present, move to teamA
      teamA = teamB;
      teamB = null;
    }
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

  // For phase 2+: leave all team slots empty
  let phase = 2;
  let matchesInPhase = Math.floor(prevPhaseMatches.length / 2);
  while (matchesInPhase >= 1) {
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
    }
    matchesInPhase = Math.floor(matchesInPhase / 2);
    phase++;
  }

  return allMatches;
}

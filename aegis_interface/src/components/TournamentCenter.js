const MOCK_TOURNAMENT = {
  name: 'eFootball Champions Series 2025',
  phase: 'Quarter Finals',
  brackets: [
    { match: 'France vs England', score: '2 - 1', status: 'completed', winner: 'France' },
    { match: 'Germany vs Spain',  score: '1 - 1 (4-3)', status: 'completed', winner: 'Germany' },
    { match: 'Brazil vs Portugal', score: '3 - 0', status: 'completed', winner: 'Brazil' },
    { match: 'Argentina vs Italy', score: '0 - 0 (5-4)', status: 'completed', winner: 'Argentina' },
  ],
  leaderboard: [
    { rank: 1, name: 'Victor O.', team: 'France', pts: 87, w: 28, l: 5, d: 3 },
    { rank: 2, name: 'Alex M.',  team: 'Germany', pts: 82, w: 26, l: 6, d: 4 },
    { rank: 3, name: 'Sarah K.', team: 'Brazil', pts: 79, w: 25, l: 7, d: 4 },
    { rank: 4, name: 'James W.', team: 'Argentina', pts: 76, w: 24, l: 8, d: 4 },
    { rank: 5, name: 'Emma L.',  team: 'Italy', pts: 72, w: 23, l: 9, d: 3 },
  ]
};

export function setupTournamentCenter() {
  const container = document.getElementById('tournament-center');
  if (!container) return;

  function render() {
    const t = MOCK_TOURNAMENT;

    const bracketCards = t.brackets.map(b => `
      <div class="tourney-bracket">
        <div class="tourney-bracket__teams">${b.match}</div>
        <div class="tourney-bracket__score ${b.status}">${b.score}</div>
        <div class="tourney-bracket__status ${b.status}">${b.status.toUpperCase()}</div>
      </div>
    `).join('');

    const leaderRows = t.leaderboard.map(p => `
      <div class="tourney-leader__row">
        <span class="tourney-leader__rank">#${p.rank}</span>
        <span class="tourney-leader__name">${p.name}</span>
        <span class="tourney-leader__team">${p.team}</span>
        <span class="tourney-leader__pts">${p.pts}</span>
        <span class="tourney-leader__wl">${p.w}-${p.l}-${p.d}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="section-header">TOURNAMENT COMMAND CENTER</div>
      <div class="tourney-title">
        <span class="tourney-title__name">${t.name}</span>
        <span class="tourney-title__phase">${t.phase}</span>
      </div>
      <div class="tourney-section-label">LIVE BRACKETS</div>
      <div class="tourney-brackets">${bracketCards}</div>
      <div class="tourney-section-label">LEADERBOARD · TOP 5</div>
      <div class="tourney-leaderboard">
        <div class="tourney-leader__header">
          <span>RK</span><span>PLAYER</span><span>TEAM</span><span>PTS</span><span>W-L-D</span>
        </div>
        ${leaderRows}
      </div>
    `;
  }

  render();
  setInterval(render, 10000);

  return { render };
}

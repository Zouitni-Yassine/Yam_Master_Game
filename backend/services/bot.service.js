const GameService = require('./game.service');

// Valeur stratégique des combinaisons — les rares valent plus
const COMBO_VALUE = {
    yam: 6, carre: 5, suite: 4, full: 3,
    moinshuit: 2, sec: 2, defi: 3,
    brelan1: 1, brelan2: 1, brelan3: 1,
    brelan4: 1, brelan5: 1, brelan6: 1,
};

const BotService = {

    // ============================================================
    //  LINE ANALYSIS HELPERS
    // ============================================================

    /** All lines (row, col, 2 diags) passing through a cell */
    _getLinesThrough: (grid, row, col) => {
        const ROWS = grid.length, COLS = grid[0].length;
        const lines = [];

        // Row
        lines.push(grid[row].map((cell, c) => ({ row, col: c, owner: cell.owner })));

        // Column
        lines.push(grid.map((r, ri) => ({ row: ri, col, owner: r[col].owner })));

        // Diagonal ↘  (r - c = constant)
        const diag1 = [];
        const diff = row - col;
        for (let r = 0; r < ROWS; r++) {
            const c = r - diff;
            if (c >= 0 && c < COLS) diag1.push({ row: r, col: c, owner: grid[r][c].owner });
        }
        if (diag1.length >= 3) lines.push(diag1);

        // Diagonal ↗  (r + c = constant)
        const diag2 = [];
        const s = row + col;
        for (let r = 0; r < ROWS; r++) {
            const c = s - r;
            if (c >= 0 && c < COLS) diag2.push({ row: r, col: c, owner: grid[r][c].owner });
        }
        if (diag2.length >= 3) lines.push(diag2);

        return lines;
    },

    /** Analyse a line after placing `placerKey` at (targetRow, targetCol).
     *  Returns { maxRun, openEnds } for the contiguous run that includes the target. */
    _analyzeLine: (line, targetRow, targetCol, placerKey) => {
        const idx = line.findIndex(c => c.row === targetRow && c.col === targetCol);
        if (idx === -1) return { maxRun: 0, openEnds: 0 };

        const owners = line.map((c, i) => i === idx ? placerKey : c.owner);

        let start = idx, end = idx;
        while (start > 0 && owners[start - 1] === placerKey) start--;
        while (end < owners.length - 1 && owners[end + 1] === placerKey) end++;

        const maxRun = end - start + 1;
        let openEnds = 0;
        if (start > 0 && owners[start - 1] === null) openEnds++;
        if (end < owners.length - 1 && owners[end + 1] === null) openEnds++;

        return { maxRun, openEnds };
    },

    /** Count own pieces in the 8 neighbours */
    _countAdjacent: (grid, row, col, playerKey) => {
        let count = 0;
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length && grid[r][c].owner === playerKey) count++;
        }
        return count;
    },

    /** Best cell score for a given combo on the grid (used by decideLock) */
    _gridValueForCombo: (grid, comboId, botKey, humanKey) => {
        let best = -1;
        grid.forEach((row, ri) => row.forEach((cell, ci) => {
            if (cell.id === comboId && cell.owner === null) {
                const s = BotService._scoreCellHard(grid, ri, ci, botKey, humanKey);
                if (s > best) best = s;
            }
        }));
        return best;
    },

    // ============================================================
    //  CELL SCORING — HARD MODE  (the brain of the bot)
    // ============================================================

    _scoreCellHard: (grid, row, col, botKey, humanKey) => {
        // Simulate placement for both sides
        const simOwn = grid.map((r, ri) => r.map((cell, ci) =>
            ri === row && ci === col ? { ...cell, owner: botKey } : cell));
        const simOpp = grid.map((r, ri) => r.map((cell, ci) =>
            ri === row && ci === col ? { ...cell, owner: humanKey } : cell));

        const afterOwn = GameService.grid.computeScores(simOwn);
        const afterOpp = GameService.grid.computeScores(simOpp);

        // Instant win → absolute priority
        if (afterOwn[botKey].winner) return 10000;
        // Block opponent instant win
        if (afterOpp[humanKey].winner) return 9000;

        const before = GameService.grid.computeScores(grid);
        const ownGain   = afterOwn[botKey].score   - before[botKey].score;
        const blockGain = afterOpp[humanKey].score  - before[humanKey].score;

        // ---- Positional analysis ----
        const lines = BotService._getLinesThrough(grid, row, col);
        let ownThreats = 0;   // lines where bot gets 3+ aligned
        let ownStrong  = 0;   // lines where bot gets 4+ aligned
        let oppThreats = 0;
        let oppStrong  = 0;
        let openness   = 0;

        for (const line of lines) {
            const ownA = BotService._analyzeLine(line, row, col, botKey);
            const oppA = BotService._analyzeLine(line, row, col, humanKey);

            if (ownA.maxRun >= 4) ownStrong++;
            if (ownA.maxRun >= 3) ownThreats++;
            if (oppA.maxRun >= 4) oppStrong++;
            if (oppA.maxRun >= 3) oppThreats++;
            openness += ownA.openEnds;
        }

        let score = 0;

        // Alignment gains
        score += ownGain * 12;
        score += blockGain * 10;

        // Fork bonus (multiple simultaneous threats — opponent can't block both)
        if (ownStrong >= 2)                         score += 600;
        else if (ownStrong >= 1 && ownThreats >= 2) score += 350;
        else if (ownThreats >= 2)                   score += 120;
        else if (ownThreats >= 1)                   score += 30;

        // Blocking opponent forks / strong lines
        if (oppStrong >= 2)      score += 500;
        else if (oppStrong >= 1) score += 250;
        else if (oppThreats >= 2) score += 100;

        // Open-ended lines can grow → more threatening
        score += openness * 4;

        // Center proximity (center cell = most lines through it)
        const centerDist = Math.abs(row - 2) + Math.abs(col - 2);
        score += (4 - centerDist) * 3;

        // Adjacency to own pieces
        score += BotService._countAdjacent(grid, row, col, botKey) * 5;

        return score;
    },

    // ============================================================
    //  CELL SCORING — MEDIUM MODE  (simpler)
    // ============================================================

    _scoreCellMedium: (grid, row, col, botKey, humanKey) => {
        const simOwn = grid.map((r, ri) => r.map((cell, ci) =>
            ri === row && ci === col ? { ...cell, owner: botKey } : cell));
        const simOpp = grid.map((r, ri) => r.map((cell, ci) =>
            ri === row && ci === col ? { ...cell, owner: humanKey } : cell));

        const before   = GameService.grid.computeScores(grid);
        const afterOwn = GameService.grid.computeScores(simOwn);
        const afterOpp = GameService.grid.computeScores(simOpp);

        if (afterOwn[botKey].winner)   return 1000;
        if (afterOpp[humanKey].winner) return 999;

        const ownGain   = afterOwn[botKey].score   - before[botKey].score;
        const blockGain = afterOpp[humanKey].score  - before[humanKey].score;
        const threatBonus = blockGain >= 2 ? 40 : 0;

        return ownGain * 2 + blockGain * 1.5 + threatBonus;
    },

    // ============================================================
    //  DECIDE LOCK  (which dice to keep between rolls)
    // ============================================================

    decideLock: (dices, difficulty, grid, botKey, humanKey) => {
        if (difficulty === 'easy') return [];

        const freq = Array(7).fill(0);
        const values = [];
        dices.filter(d => d.value && d.value !== '').forEach(d => {
            const v = parseInt(d.value); freq[v]++; values.push(v);
        });

        let bestVal = 0, bestCount = 0;
        for (let v = 1; v <= 6; v++) {
            if (freq[v] > bestCount) { bestCount = freq[v]; bestVal = v; }
        }

        const suite1 = [1, 2, 3, 4, 5].filter(v => freq[v] > 0).length;
        const suite2 = [2, 3, 4, 5, 6].filter(v => freq[v] > 0).length;

        // ---- MEDIUM MODE: original simple logic ----
        if (difficulty !== 'hard') {
            let lockIds = [];
            if (Math.max(suite1, suite2) >= 4) {
                const suitSet = suite1 >= suite2 ? new Set([1, 2, 3, 4, 5]) : new Set([2, 3, 4, 5, 6]);
                const seen = new Set();
                dices.forEach(d => {
                    const v = parseInt(d.value);
                    if (suitSet.has(v) && !seen.has(v)) { lockIds.push(d.id); seen.add(v); }
                });
            } else if (bestCount >= 2) {
                let kept = 0;
                dices.forEach(d => {
                    if (parseInt(d.value) === bestVal && kept < 3) { lockIds.push(d.id); kept++; }
                });
            }
            return lockIds;
        }

        // ---- HARD MODE: grid-aware strategy evaluation ----
        if (!grid) {
            // Fallback if no grid
            let lockIds = [];
            if (bestCount >= 2) {
                let kept = 0;
                dices.forEach(d => {
                    if (parseInt(d.value) === bestVal && kept < 4) { lockIds.push(d.id); kept++; }
                });
            }
            return lockIds;
        }

        const strategies = [];

        // --- Strategy: keep N-of-a-kind (for each value with 2+) ---
        for (let v = 1; v <= 6; v++) {
            if (freq[v] < 2) continue;
            const lockIds = [];
            dices.forEach(d => { if (parseInt(d.value) === v) lockIds.push(d.id); });

            let gridScore = 0;
            // brelan
            gridScore += Math.max(0, BotService._gridValueForCombo(grid, `brelan${v}`, botKey, humanKey)) * 0.8;
            // carre (likely if 3+)
            if (freq[v] >= 3) gridScore += Math.max(0, BotService._gridValueForCombo(grid, 'carre', botKey, humanKey)) * 0.5;
            // yam (likely if 4+)
            if (freq[v] >= 4) gridScore += Math.max(0, BotService._gridValueForCombo(grid, 'yam', botKey, humanKey)) * 0.8;
            // full possibility
            let secondCount = 0;
            for (let w = 1; w <= 6; w++) { if (w !== v && freq[w] >= 2) secondCount = Math.max(secondCount, freq[w]); }
            if (freq[v] >= 3 && secondCount >= 2)
                gridScore += Math.max(0, BotService._gridValueForCombo(grid, 'full', botKey, humanKey)) * 0.6;

            const probBonus = freq[v] * 3;
            strategies.push({ lockIds, score: gridScore + probBonus });
        }

        // --- Strategy: pursue straight ---
        if (Math.max(suite1, suite2) >= 3) {
            const suitSet = suite1 >= suite2 ? new Set([1, 2, 3, 4, 5]) : new Set([2, 3, 4, 5, 6]);
            const lockIds = [];
            const seen = new Set();
            dices.forEach(d => {
                const v = parseInt(d.value);
                if (suitSet.has(v) && !seen.has(v)) { lockIds.push(d.id); seen.add(v); }
            });

            const gridScore = Math.max(0, BotService._gridValueForCombo(grid, 'suite', botKey, humanKey));
            const progress = Math.max(suite1, suite2);
            const probBonus = progress >= 4 ? 15 : progress >= 3 ? 5 : 0;
            strategies.push({ lockIds, score: gridScore + probBonus });
        }

        // --- Strategy: pursue ≤8 ---
        const lowDice = dices.filter(d => d.value && d.value !== '' && parseInt(d.value) <= 2);
        if (lowDice.length >= 2) {
            const lockIds = lowDice.map(d => d.id);
            const gridScore = Math.max(0, BotService._gridValueForCombo(grid, 'moinshuit', botKey, humanKey));
            const sum = values.reduce((a, b) => a + b, 0);
            const probBonus = sum <= 8 ? 12 : lowDice.length >= 3 ? 6 : 0;
            strategies.push({ lockIds, score: gridScore + probBonus });
        }

        // --- Strategy: pursue full house (keep 3 + 2) ---
        if (bestCount >= 3) {
            let pairVal = 0;
            for (let v = 1; v <= 6; v++) { if (v !== bestVal && freq[v] >= 2) pairVal = v; }
            if (pairVal) {
                // Already have full
                const lockIds = [];
                dices.forEach(d => {
                    const v = parseInt(d.value);
                    if (v === bestVal || v === pairVal) lockIds.push(d.id);
                });
                const gridScore = Math.max(0, BotService._gridValueForCombo(grid, 'full', botKey, humanKey));
                strategies.push({ lockIds, score: gridScore + 14 });
            } else {
                // Have 3-of-a-kind, hope for pair
                const lockIds = [];
                let kept = 0;
                dices.forEach(d => {
                    if (parseInt(d.value) === bestVal && kept < 3) { lockIds.push(d.id); kept++; }
                });
                const fullVal = Math.max(0, BotService._gridValueForCombo(grid, 'full', botKey, humanKey));
                const carreVal = Math.max(0, BotService._gridValueForCombo(grid, 'carre', botKey, humanKey));
                const brelanVal = Math.max(0, BotService._gridValueForCombo(grid, `brelan${bestVal}`, botKey, humanKey));
                const gridScore = Math.max(fullVal * 0.4, carreVal * 0.3, brelanVal * 0.7);
                strategies.push({ lockIds, score: gridScore + 8 });
            }
        }

        if (strategies.length === 0) return [];
        strategies.sort((a, b) => b.score - a.score);
        return strategies[0].lockIds;
    },

    // ============================================================
    //  SHOULD STOP ROLLING  (don't waste rolls when result is great)
    // ============================================================

    shouldStopRolling: (dices, choices, grid, botKey, humanKey) => {
        if (!choices || choices.length === 0) return false;

        const hasYam   = choices.some(c => c.id === 'yam');
        const hasCarre = choices.some(c => c.id === 'carre');
        const hasSuite = choices.some(c => c.id === 'suite');
        const hasFull  = choices.some(c => c.id === 'full');

        // Yam → always stop
        if (hasYam) return true;

        // High-value combo with a good grid cell → stop
        for (const combo of [hasCarre && 'carre', hasSuite && 'suite', hasFull && 'full'].filter(Boolean)) {
            if (BotService._gridValueForCombo(grid, combo, botKey, humanKey) >= 40) return true;
        }

        // Any combo that leads to a win or blocks a win → stop
        for (const choice of choices) {
            const tg = GameService.grid.updateGridAfterSelectingChoice(choice.id, grid);
            for (let ri = 0; ri < tg.length; ri++) {
                for (let ci = 0; ci < tg[ri].length; ci++) {
                    if (!tg[ri][ci].canBeChecked) continue;
                    if (BotService._scoreCellHard(grid, ri, ci, botKey, humanKey) >= 9000) return true;
                }
            }
        }

        return false;
    },

    // ============================================================
    //  SHOULD DECLARE DEFI  (risk/reward before 2nd roll)
    // ============================================================

    shouldDeclareDefi: (dices, grid, botKey, humanKey) => {
        const freq = Array(7).fill(0);
        dices.forEach(d => { if (d.value) freq[parseInt(d.value)]++; });

        let bestCount = 0;
        for (let v = 1; v <= 6; v++) if (freq[v] > bestCount) bestCount = freq[v];

        let hasPair = false;
        for (let v = 1; v <= 6; v++) if (freq[v] === 2) hasPair = true;

        const suite1 = [1, 2, 3, 4, 5].filter(v => freq[v] > 0).length;
        const suite2 = [2, 3, 4, 5, 6].filter(v => freq[v] > 0).length;
        const sum = dices.reduce((a, d) => a + parseInt(d.value || 0), 0);

        // Check if defi cells are strategically valuable
        const defiVal = BotService._gridValueForCombo(grid, 'defi', botKey, humanKey);
        if (defiVal < 10) return false; // Defi cells not useful

        // Already have a non-brelan combo → safe defi
        const hasFull = bestCount >= 3 && hasPair;
        const hasCarre = bestCount >= 4;
        const hasSuite = Math.max(suite1, suite2) >= 5;
        const hasMoinshuit = sum <= 8;
        if (hasFull || hasCarre || hasSuite || hasMoinshuit) return true;

        // Close to straight (4/5) with valuable defi cell → risky but worth it
        if (Math.max(suite1, suite2) >= 4 && defiVal >= 30) return true;

        // Close to full (3-of-a-kind, need pair) with valuable defi cell
        if (bestCount >= 3 && defiVal >= 30) return true;

        return false;
    },

    // ============================================================
    //  DECIDE CHOICE  (which combo to pick)
    // ============================================================

    decideChoice: (availableChoices, grid, botKey, humanKey, difficulty) => {
        if (!availableChoices || availableChoices.length === 0) return null;

        const validChoices = availableChoices.filter(choice => {
            const tg = GameService.grid.updateGridAfterSelectingChoice(choice.id, grid);
            return tg.some(row => row.some(cell => cell.canBeChecked));
        });
        if (validChoices.length === 0) return null;

        if (difficulty === 'easy') return validChoices[Math.floor(Math.random() * validChoices.length)].id;

        const scorer = difficulty === 'hard' ? BotService._scoreCellHard : BotService._scoreCellMedium;
        let bestId = validChoices[0].id;
        let bestScore = -Infinity;

        for (const choice of validChoices) {
            const tg = GameService.grid.updateGridAfterSelectingChoice(choice.id, grid);
            const candidates = [];

            tg.forEach((row, ri) => row.forEach((cell, ci) => {
                if (!cell.canBeChecked) return;
                candidates.push(scorer(grid, ri, ci, botKey, humanKey));
            }));

            if (candidates.length === 0) continue;
            const maxCell = Math.max(...candidates);

            // Win or block win → absolute priority
            if (maxCell >= 9000) return choice.id;

            const avg = candidates.reduce((a, b) => a + b, 0) / candidates.length;
            const intrinsicValue = COMBO_VALUE[choice.id] || 1;

            let compositeScore;
            if (difficulty === 'hard') {
                // Best cell matters most + flexibility bonus + combo rarity
                compositeScore = maxCell * 0.75 + avg * 0.15 + intrinsicValue * 2 + candidates.length * 0.5;
            } else {
                compositeScore = maxCell * 0.7 + avg * 0.3 + intrinsicValue * 0.2 + candidates.length * 0.15;
            }

            if (compositeScore > bestScore) { bestScore = compositeScore; bestId = choice.id; }
        }

        return bestId;
    },

    // ============================================================
    //  DECIDE CELL  (where to place on the grid)
    // ============================================================

    decideCell: (grid, choiceId, botKey, humanKey, difficulty) => {
        const tg = GameService.grid.updateGridAfterSelectingChoice(choiceId, grid);
        const candidates = [];
        tg.forEach((row, ri) => row.forEach((cell, ci) => {
            if (cell.canBeChecked) candidates.push({ id: cell.id, row: ri, col: ci });
        }));
        if (candidates.length === 0) return null;
        if (difficulty === 'easy') return candidates[Math.floor(Math.random() * candidates.length)];

        const scorer = difficulty === 'hard' ? BotService._scoreCellHard : BotService._scoreCellMedium;
        let best = candidates[0];
        let bestScore = -Infinity;

        for (const c of candidates) {
            const s = scorer(grid, c.row, c.col, botKey, humanKey);
            if (s > bestScore) { bestScore = s; best = c; }
        }

        return best;
    },

    // ============================================================
    //  MAGIC CARD DECISION
    // ============================================================

    decideMagicCard: (game, botKey, humanKey) => {
        if ((game.magicCardUses[botKey] || 0) <= 0) return false;

        const scores = GameService.grid.computeScores(game.gameState.grid);
        let botTokens = 0, humanTokens = 0;
        game.gameState.grid.forEach(row => row.forEach(cell => {
            if (cell.owner === botKey) botTokens++;
            if (cell.owner === humanKey) humanTokens++;
        }));

        // Too early — wait for at least 3 tokens on the board
        if (botTokens + humanTokens < 3) return false;

        const botScore  = scores[botKey].score;
        const humanScore = scores[humanKey].score;

        // Opponent has 4 aligned (2+ pts) — critical threat, must disrupt
        if (humanScore >= 2) return true;

        // Opponent has 3 aligned (1+ pts) — use card to try to break it
        if (humanScore >= 1 && humanTokens >= 3) return true;

        // Bot is behind in score
        if (humanScore > botScore) return true;

        // Opponent has more tokens — try to remove one
        if (humanTokens > botTokens && humanTokens >= 3) return true;

        // Mid-game: use card proactively if opponent is building up
        if (humanTokens >= 4 && botTokens <= humanTokens) return true;

        return false;
    },
};

module.exports = BotService;

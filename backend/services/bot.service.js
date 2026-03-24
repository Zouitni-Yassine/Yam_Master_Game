const GameService = require('./game.service');

const BotService = {
    decideLock: (dices, difficulty) => {
        if (difficulty === 'easy') return [];
        const freq = Array(7).fill(0);
        dices.filter(d => d.value && d.value !== '').forEach(d => freq[parseInt(d.value)]++);
        let bestVal = 0, bestCount = 0;
        for (let v = 1; v <= 6; v++) { if (freq[v] > bestCount) { bestCount = freq[v]; bestVal = v; } }
        const vals = new Set(dices.filter(d => d.value && d.value !== '').map(d => parseInt(d.value)));
        const suite1 = [1,2,3,4,5].filter(v => vals.has(v)).length;
        const suite2 = [2,3,4,5,6].filter(v => vals.has(v)).length;
        let lockIds = [];
        if (difficulty === 'hard' && Math.max(suite1, suite2) >= 4) {
            const suitSet = suite1 >= suite2 ? new Set([1,2,3,4,5]) : new Set([2,3,4,5,6]);
            const seen = new Set();
            dices.forEach(d => { const v = parseInt(d.value); if (suitSet.has(v) && !seen.has(v)) { lockIds.push(d.id); seen.add(v); } });
        } else if (bestCount >= 2) {
            const maxKeep = difficulty === 'hard' ? 4 : 3;
            let kept = 0;
            dices.forEach(d => { if (parseInt(d.value) === bestVal && kept < maxKeep) { lockIds.push(d.id); kept++; } });
        }
        return lockIds;
    },
    decideChoice: (availableChoices, grid, botKey, humanKey, difficulty) => {
        if (!availableChoices || availableChoices.length === 0) return null;

        // Filter out choices that have no valid cells left on the grid
        const validChoices = availableChoices.filter(choice => {
            const tg = GameService.grid.updateGridAfterSelectingChoice(choice.id, grid);
            return tg.some(row => row.some(cell => cell.canBeChecked));
        });
        if (validChoices.length === 0) return null;

        if (difficulty === 'easy') return validChoices[Math.floor(Math.random() * validChoices.length)].id;
        let bestId = validChoices[0].id, bestScore = -Infinity;
        for (const choice of validChoices) {
            const tg = GameService.grid.updateGridAfterSelectingChoice(choice.id, grid);
            let maxCell = -Infinity;
            tg.forEach((row, ri) => row.forEach((cell, ci) => {
                if (!cell.canBeChecked) return;
                const s = BotService._scoreCell(tg, ri, ci, botKey, humanKey);
                if (s > maxCell) maxCell = s;
            }));
            if (maxCell > bestScore) { bestScore = maxCell; bestId = choice.id; }
        }
        return bestId;
    },
    decideCell: (grid, choiceId, botKey, humanKey, difficulty) => {
        const tg = GameService.grid.updateGridAfterSelectingChoice(choiceId, grid);
        const candidates = [];
        tg.forEach((row, ri) => row.forEach((cell, ci) => { if (cell.canBeChecked) candidates.push({ id: cell.id, row: ri, col: ci }); }));
        if (candidates.length === 0) return null;
        if (difficulty === 'easy') return candidates[Math.floor(Math.random() * candidates.length)];
        let best = candidates[0], bestScore = -Infinity;
        for (const c of candidates) {
            const s = BotService._scoreCell(tg, c.row, c.col, botKey, humanKey);
            if (s > bestScore) { bestScore = s; best = c; }
        }
        return best;
    },
    _scoreCell: (grid, row, col, botKey, humanKey) => {
        const simOwn = grid.map((r, ri) => r.map((cell, ci) => ri === row && ci === col ? { ...cell, owner: botKey } : cell));
        const simOpp = grid.map((r, ri) => r.map((cell, ci) => ri === row && ci === col ? { ...cell, owner: humanKey } : cell));
        const before = GameService.grid.computeScores(grid);
        const afterOwn = GameService.grid.computeScores(simOwn);
        const afterOpp = GameService.grid.computeScores(simOpp);
        if (afterOwn[botKey].winner) return 1000;
        const ownGain = afterOwn[botKey].score - before[botKey].score;
        const blockGain = afterOpp[humanKey].score - before[humanKey].score;
        return ownGain * 2 + blockGain * 1.5;
    }
};

module.exports = BotService;

'use strict';

const EFFECTS = ['remove_own', 'remove_opponent', 'score_minus', 'empty'];

const MagicService = {

    apply(game, playerKey) {
        if ((game.magicCardUses[playerKey] || 0) <= 0) return null;

        game.magicCardUses[playerKey]--;
        const opponentKey = playerKey === 'player:1' ? 'player:2' : 'player:1';
        const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

        if (effect === 'remove_own') {
            const owned = [];
            game.gameState.grid.forEach((row, ri) =>
                row.forEach((cell, ci) => { if (cell.owner === playerKey) owned.push({ ri, ci }); })
            );
            if (owned.length > 0) {
                const pick = owned[Math.floor(Math.random() * owned.length)];
                game.gameState.grid[pick.ri][pick.ci] = { ...game.gameState.grid[pick.ri][pick.ci], owner: null };
            }
        } else if (effect === 'remove_opponent') {
            const owned = [];
            game.gameState.grid.forEach((row, ri) =>
                row.forEach((cell, ci) => { if (cell.owner === opponentKey) owned.push({ ri, ci }); })
            );
            if (owned.length > 0) {
                const pick = owned[Math.floor(Math.random() * owned.length)];
                game.gameState.grid[pick.ri][pick.ci] = { ...game.gameState.grid[pick.ri][pick.ci], owner: null };
            }
        } else if (effect === 'score_minus') {
            // -1 point randomly for the player OR the opponent
            const target = Math.random() < 0.5 ? playerKey : opponentKey;
            game.scoreBonus[target] = (game.scoreBonus[target] || 0) - 1;
            return { effect, playerKey, target, usesLeft: game.magicCardUses[playerKey] };
        }
        // 'empty' → nothing happens

        return { effect, playerKey, usesLeft: game.magicCardUses[playerKey] };
    },
};

module.exports = MagicService;

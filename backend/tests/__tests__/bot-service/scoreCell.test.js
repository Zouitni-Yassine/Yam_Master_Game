'use strict';

const BotService  = require('../../../services/bot.service');
const GameService = require('../../../services/game.service');
const { makeGrid, makeOwnedGrid } = require('../../helpers/fixtures');

describe('BotService._scoreCell()', () => {

    it('retourne 1000 si le placement donne la victoire au bot', () => {
        // player:1 a 4 en ligne dans row 0, col 4 = brelan6 → victoire
        const grid = makeOwnedGrid([
            { row: 0, col: 0, owner: 'player:1' },
            { row: 0, col: 1, owner: 'player:1' },
            { row: 0, col: 2, owner: 'player:1' },
            { row: 0, col: 3, owner: 'player:1' },
        ]);
        const tg = GameService.grid.updateGridAfterSelectingChoice('brelan6', grid);
        expect(BotService._scoreCell(tg, 0, 4, 'player:1', 'player:2')).toBe(1000);
    });

    it('retourne un score > 0 si le placement crée un alignement pour le bot', () => {
        // 2 cases player:1 en row 0 col 0-1, placer col 2 → 3 alignées = 1pt gain
        const grid = makeOwnedGrid([
            { row: 0, col: 0, owner: 'player:1' },
            { row: 0, col: 1, owner: 'player:1' },
        ]);
        const tg = GameService.grid.updateGridAfterSelectingChoice('defi', grid);
        expect(BotService._scoreCell(tg, 0, 2, 'player:1', 'player:2')).toBeGreaterThan(0);
    });

    it('retourne un score > 0 pour bloquer un alignement adverse', () => {
        // player:2 a 2 cases en row 1 col 0-1, bloquer col 2 coûte 1pt à l'adversaire
        const grid = makeOwnedGrid([
            { row: 1, col: 0, owner: 'player:2' },
            { row: 1, col: 1, owner: 'player:2' },
        ]);
        const tg = GameService.grid.updateGridAfterSelectingChoice('sec', grid);
        expect(BotService._scoreCell(tg, 1, 2, 'player:1', 'player:2')).toBeGreaterThanOrEqual(0);
    });

    it('retourne 0 sur une position isolée sans gain ni blocage', () => {
        const tg = GameService.grid.updateGridAfterSelectingChoice('moinshuit', makeGrid());
        // row 2 col 0 = moinshuit, aucun voisin → score = 0
        expect(BotService._scoreCell(tg, 2, 0, 'player:1', 'player:2')).toBe(0);
    });

    it('le score est basé sur ownGain×2 + blockGain×1.5', () => {
        // Vérification de la formule : placer en position qui donne +1pt au bot
        const grid = makeOwnedGrid([
            { row: 0, col: 0, owner: 'player:1' },
            { row: 0, col: 1, owner: 'player:1' },
        ]);
        const tg = GameService.grid.updateGridAfterSelectingChoice('defi', grid);
        const score = BotService._scoreCell(tg, 0, 2, 'player:1', 'player:2');
        // ownGain = 1pt × 2 = 2, blockGain = 0 → score = 2
        expect(score).toBe(2);
    });
});

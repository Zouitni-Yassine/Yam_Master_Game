'use strict';

const BotService  = require('../../../services/bot.service');
const { makeGrid, makeOwnedGrid } = require('../../helpers/fixtures');

const wrap = (ids) => ids.map(id => ({ id, value: id }));

describe('BotService.decideChoice()', () => {

    describe('cas limites', () => {
        it('retourne null pour availableChoices vide', () => {
            expect(BotService.decideChoice([], makeGrid(), 'player:1', 'player:2', 'hard')).toBeNull();
        });

        it('retourne null pour availableChoices null', () => {
            expect(BotService.decideChoice(null, makeGrid(), 'player:1', 'player:2', 'hard')).toBeNull();
        });

        it('retourne null si toutes les cases de la combinaison sont prises', () => {
            const fullCells = [];
            for (let r = 0; r < 5; r++)
                for (let c = 0; c < 5; c++)
                    fullCells.push({ row: r, col: c, owner: 'player:1' });
            expect(
                BotService.decideChoice(wrap(['brelan1', 'yam']), makeOwnedGrid(fullCells), 'player:1', 'player:2', 'hard')
            ).toBeNull();
        });
    });

    describe('easy', () => {
        it('retourne un ID appartenant aux choices valides', () => {
            const choices = wrap(['suite', 'yam', 'carre']);
            const result = BotService.decideChoice(choices, makeGrid(), 'player:1', 'player:2', 'easy');
            expect(['suite', 'yam', 'carre']).toContain(result);
        });
    });

    describe('medium', () => {
        it('retourne un ID valide parmi les choices disponibles', () => {
            const result = BotService.decideChoice(wrap(['brelan3', 'full']), makeGrid(), 'player:1', 'player:2', 'medium');
            expect(['brelan3', 'full']).toContain(result);
        });
    });

    describe('hard', () => {
        it('retourne un ID valide parmi les choices disponibles', () => {
            const result = BotService.decideChoice(wrap(['suite', 'brelan4']), makeGrid(), 'player:1', 'player:2', 'hard');
            expect(['suite', 'brelan4']).toContain(result);
        });

        it('choisit brelan6 pour compléter une ligne de 4 en row 0 col 4', () => {
            // row 0, col 4 = 'brelan6' — placer ici = 5 en ligne = victoire
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:1' },
                { row: 0, col: 1, owner: 'player:1' },
                { row: 0, col: 2, owner: 'player:1' },
                { row: 0, col: 3, owner: 'player:1' },
            ]);
            const result = BotService.decideChoice(wrap(['brelan1', 'brelan6']), grid, 'player:1', 'player:2', 'hard');
            expect(result).toBe('brelan6');
        });
    });
});

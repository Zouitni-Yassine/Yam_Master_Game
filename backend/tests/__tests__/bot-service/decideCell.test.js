'use strict';

const BotService  = require('../../../services/bot.service');
const { makeGrid, makeOwnedGrid } = require('../../helpers/fixtures');

describe('BotService.decideCell()', () => {

    describe('cas limites', () => {
        it('retourne null si aucune case disponible pour la combinaison', () => {
            const fullCells = [];
            for (let r = 0; r < 5; r++)
                for (let c = 0; c < 5; c++)
                    fullCells.push({ row: r, col: c, owner: 'player:1' });
            expect(BotService.decideCell(makeOwnedGrid(fullCells), 'yam', 'player:1', 'player:2', 'hard')).toBeNull();
        });
    });

    describe('easy', () => {
        it('retourne un objet { id, row, col } valide', () => {
            const cell = BotService.decideCell(makeGrid(), 'brelan1', 'player:1', 'player:2', 'easy');
            expect(cell).not.toBeNull();
            expect(cell).toHaveProperty('id');
            expect(cell).toHaveProperty('row');
            expect(cell).toHaveProperty('col');
        });

        it('la case retournée correspond bien à la combinaison demandée', () => {
            const cell = BotService.decideCell(makeGrid(), 'yam', 'player:1', 'player:2', 'easy');
            expect(cell.id).toBe('yam');
        });
    });

    describe('medium', () => {
        it('retourne un objet { id, row, col } valide', () => {
            const cell = BotService.decideCell(makeGrid(), 'carre', 'player:1', 'player:2', 'medium');
            expect(cell).not.toBeNull();
            expect(cell.id).toBe('carre');
        });
    });

    describe('hard', () => {
        it('retourne un objet { id, row, col } valide', () => {
            const cell = BotService.decideCell(makeGrid(), 'suite', 'player:1', 'player:2', 'hard');
            expect(cell).not.toBeNull();
            expect(cell.id).toBe('suite');
        });

        it('choisit la case gagnante (row=0, col=4) pour compléter un alignement de 5', () => {
            // row 0, col 4 = brelan6 → aligner après 4 en ligne = victoire
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:1' },
                { row: 0, col: 1, owner: 'player:1' },
                { row: 0, col: 2, owner: 'player:1' },
                { row: 0, col: 3, owner: 'player:1' },
            ]);
            const cell = BotService.decideCell(grid, 'brelan6', 'player:1', 'player:2', 'hard');
            expect(cell.row).toBe(0);
            expect(cell.col).toBe(4);
        });
    });
});

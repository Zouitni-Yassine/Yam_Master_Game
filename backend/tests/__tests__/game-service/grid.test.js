'use strict';

const GameService = require('../../../services/game.service');
const { makeGrid, makeOwnedGrid, makeRowWin, makeColWin, makeDiagWin } = require('../../helpers/fixtures');

describe('GameService.grid', () => {

    describe('resetcanBeCheckedCells()', () => {
        it('met canBeChecked=false sur toutes les cases', () => {
            const grid = makeGrid();
            grid[0][0].canBeChecked = true;
            grid[2][3].canBeChecked = true;
            GameService.grid.resetcanBeCheckedCells(grid)
                .forEach(row => row.forEach(cell => expect(cell.canBeChecked).toBe(false)));
        });

        it('conserve les propriétaires existants', () => {
            const grid = makeOwnedGrid([{ row: 0, col: 0, owner: 'player:1' }]);
            const reset = GameService.grid.resetcanBeCheckedCells(grid);
            expect(reset[0][0].owner).toBe('player:1');
        });

        it('retourne une nouvelle grille (immutabilité)', () => {
            const grid = makeGrid();
            expect(GameService.grid.resetcanBeCheckedCells(grid)).not.toBe(grid);
        });
    });

    describe('updateGridAfterSelectingChoice()', () => {
        it('marque comme sélectionnables les cases vides correspondant à la combo', () => {
            const updated = GameService.grid.updateGridAfterSelectingChoice('brelan1', makeGrid());
            const checkable = updated.flat().filter(c => c.canBeChecked);
            expect(checkable.length).toBeGreaterThan(0);
            checkable.forEach(c => expect(c.id).toBe('brelan1'));
        });

        it('ne marque pas les cases déjà possédées', () => {
            const grid = makeOwnedGrid([{ row: 0, col: 0, owner: 'player:1' }]); // row0 col0 = brelan1
            const updated = GameService.grid.updateGridAfterSelectingChoice('brelan1', grid);
            expect(updated[0][0].canBeChecked).toBe(false);
        });

        it('ne marque pas les cases d\'un autre id', () => {
            const updated = GameService.grid.updateGridAfterSelectingChoice('yam', makeGrid());
            updated.flat().filter(c => c.canBeChecked).forEach(c => expect(c.id).toBe('yam'));
        });
    });

    describe('selectCell()', () => {
        it('attribue le propriétaire à la case ciblée', () => {
            const grid = makeGrid();
            const updated = GameService.grid.selectCell('brelan1', 0, 0, 'player:1', grid);
            expect(updated[0][0].owner).toBe('player:1');
        });

        it('ne modifie pas les autres cases', () => {
            const updated = GameService.grid.selectCell('brelan1', 0, 0, 'player:1', makeGrid());
            expect(updated[0][1].owner).toBeNull();
            expect(updated[1][0].owner).toBeNull();
        });

        it('retourne une nouvelle grille sans modifier l\'originale', () => {
            const grid = makeGrid();
            const updated = GameService.grid.selectCell('brelan1', 0, 0, 'player:1', grid);
            expect(updated).not.toBe(grid);
            expect(grid[0][0].owner).toBeNull();
        });
    });

    describe('computeScores()', () => {
        it('retourne score=0 et winner=false pour une grille vide', () => {
            const scores = GameService.grid.computeScores(makeGrid());
            expect(scores['player:1']).toEqual({ score: 0, winner: false });
            expect(scores['player:2']).toEqual({ score: 0, winner: false });
        });

        it('1 point pour 3 cases alignées horizontalement', () => {
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:1' },
                { row: 0, col: 1, owner: 'player:1' },
                { row: 0, col: 2, owner: 'player:1' },
            ]);
            expect(GameService.grid.computeScores(grid)['player:1'].score).toBe(1);
        });

        it('2 points pour 4 cases alignées horizontalement', () => {
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:1' },
                { row: 0, col: 1, owner: 'player:1' },
                { row: 0, col: 2, owner: 'player:1' },
                { row: 0, col: 3, owner: 'player:1' },
            ]);
            expect(GameService.grid.computeScores(grid)['player:1'].score).toBe(2);
        });

        it('winner=true pour 5 cases alignées en ligne', () => {
            expect(GameService.grid.computeScores(makeRowWin(0, 'player:1'))['player:1'].winner).toBe(true);
        });

        it('winner=true pour 5 cases alignées en colonne', () => {
            expect(GameService.grid.computeScores(makeColWin(0, 'player:2'))['player:2'].winner).toBe(true);
        });

        it('winner=true pour 5 cases alignées en diagonale', () => {
            expect(GameService.grid.computeScores(makeDiagWin('player:1'))['player:1'].winner).toBe(true);
        });

        it('calcule les scores des deux joueurs indépendamment', () => {
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:1' },
                { row: 0, col: 1, owner: 'player:1' },
                { row: 0, col: 2, owner: 'player:1' },
                { row: 1, col: 0, owner: 'player:2' },
                { row: 1, col: 1, owner: 'player:2' },
                { row: 1, col: 2, owner: 'player:2' },
            ]);
            const scores = GameService.grid.computeScores(grid);
            expect(scores['player:1'].score).toBe(1);
            expect(scores['player:2'].score).toBe(1);
        });

        it('la victoire d\'un joueur ne donne pas winner à l\'adversaire', () => {
            expect(GameService.grid.computeScores(makeRowWin(0, 'player:1'))['player:2'].winner).toBe(false);
        });

        it('1 point pour 3 cases alignées verticalement', () => {
            const grid = makeOwnedGrid([
                { row: 0, col: 0, owner: 'player:2' },
                { row: 1, col: 0, owner: 'player:2' },
                { row: 2, col: 0, owner: 'player:2' },
            ]);
            expect(GameService.grid.computeScores(grid)['player:2'].score).toBe(1);
        });
    });
});

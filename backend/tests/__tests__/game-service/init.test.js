'use strict';

const GameService = require('../../../services/game.service');
const { makeGrid } = require('../../helpers/fixtures');

describe('GameService.init', () => {

    describe('gameState()', () => {
        it('retourne currentTurn = player:1', () => {
            expect(GameService.init.gameState().gameState.currentTurn).toBe('player:1');
        });

        it('retourne un timer de 30 secondes', () => {
            expect(GameService.init.gameState().gameState.timer).toBe(30);
        });

        it('retourne une grille 5×5', () => {
            const grid = GameService.init.gameState().gameState.grid;
            expect(grid).toHaveLength(5);
            grid.forEach(row => expect(row).toHaveLength(5));
        });

        it('retourne 5 dés dans le deck', () => {
            expect(GameService.init.gameState().gameState.deck.dices).toHaveLength(5);
        });

        it('retourne des instances indépendantes (pas de référence partagée)', () => {
            const gs1 = GameService.init.gameState();
            const gs2 = GameService.init.gameState();
            gs1.gameState.grid[0][0].owner = 'player:1';
            expect(gs2.gameState.grid[0][0].owner).toBeNull();
        });

        it('initialise choices avec isDefi=false, idSelectedChoice=null et availableChoices=[]', () => {
            const { choices } = GameService.init.gameState().gameState;
            expect(choices.isDefi).toBe(false);
            expect(choices.idSelectedChoice).toBeNull();
            expect(choices.availableChoices).toEqual([]);
        });
    });

    describe('deck()', () => {
        it('retourne 5 dés avec value="" et locked=true', () => {
            const { dices } = GameService.init.deck();
            expect(dices).toHaveLength(5);
            dices.forEach(d => {
                expect(d.value).toBe('');
                expect(d.locked).toBe(true);
            });
        });

        it('retourne rollsCounter=1 et rollsMaximum=3', () => {
            const deck = GameService.init.deck();
            expect(deck.rollsCounter).toBe(1);
            expect(deck.rollsMaximum).toBe(3);
        });

        it('retourne des instances indépendantes', () => {
            const d1 = GameService.init.deck();
            const d2 = GameService.init.deck();
            d1.dices[0].value = '6';
            expect(d2.dices[0].value).toBe('');
        });
    });

    describe('choices()', () => {
        it('retourne les valeurs par défaut', () => {
            const c = GameService.init.choices();
            expect(c.isDefi).toBe(false);
            expect(c.isSec).toBe(false);
            expect(c.idSelectedChoice).toBeNull();
            expect(c.availableChoices).toEqual([]);
        });
    });

    describe('grid()', () => {
        it('retourne une grille 5×5', () => {
            const grid = GameService.init.grid();
            expect(grid).toHaveLength(5);
            grid.forEach(row => expect(row).toHaveLength(5));
        });

        it('toutes les cases sont sans propriétaire et non sélectionnables', () => {
            GameService.init.grid().forEach(row =>
                row.forEach(cell => {
                    expect(cell.owner).toBeNull();
                    expect(cell.canBeChecked).toBe(false);
                    expect(cell.id).toBeTruthy();
                })
            );
        });
    });
});

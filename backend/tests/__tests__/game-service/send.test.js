'use strict';

const GameService = require('../../../services/game.service');
const { makeRowWin } = require('../../helpers/fixtures');

// Crée un gameState prêt à l'emploi
const makeGS = (overrides = {}) => ({
    ...GameService.init.gameState().gameState,
    ...overrides,
});

describe('GameService.send.forPlayer', () => {

    describe('viewQueueState()', () => {
        it('retourne inQueue=true et inGame=false', () => {
            const state = GameService.send.forPlayer.viewQueueState();
            expect(state.inQueue).toBe(true);
            expect(state.inGame).toBe(false);
        });
    });

    describe('gameTimer()', () => {
        it('joueur actif reçoit le timer, adversaire reçoit 0', () => {
            const gs = makeGS({ currentTurn: 'player:1', timer: 25 });
            const { playerTimer, opponentTimer } = GameService.send.forPlayer.gameTimer('player:1', gs);
            expect(playerTimer).toBe(25);
            expect(opponentTimer).toBe(0);
        });

        it('joueur inactif reçoit 0, adversaire reçoit le timer', () => {
            const gs = makeGS({ currentTurn: 'player:1', timer: 25 });
            const { playerTimer, opponentTimer } = GameService.send.forPlayer.gameTimer('player:2', gs);
            expect(playerTimer).toBe(0);
            expect(opponentTimer).toBe(25);
        });
    });

    describe('deckViewState()', () => {
        it('displayPlayerDeck=true pour le joueur actif', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            expect(GameService.send.forPlayer.deckViewState('player:1', gs).displayPlayerDeck).toBe(true);
        });

        it('displayOpponentDeck=true pour le joueur inactif', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            expect(GameService.send.forPlayer.deckViewState('player:2', gs).displayOpponentDeck).toBe(true);
        });

        it('displayRollButton=true si rollsCounter <= rollsMaximum', () => {
            const gs = makeGS();
            gs.deck.rollsCounter = 2;
            gs.deck.rollsMaximum = 3;
            expect(GameService.send.forPlayer.deckViewState('player:1', gs).displayRollButton).toBe(true);
        });

        it('displayRollButton=false si rollsCounter > rollsMaximum', () => {
            const gs = makeGS();
            gs.deck.rollsCounter = 4;
            gs.deck.rollsMaximum = 3;
            expect(GameService.send.forPlayer.deckViewState('player:1', gs).displayRollButton).toBe(false);
        });
    });

    describe('choicesViewState()', () => {
        it('canMakeChoice=true pour le joueur actif', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            expect(GameService.send.forPlayer.choicesViewState('player:1', gs).canMakeChoice).toBe(true);
        });

        it('canMakeChoice=false pour le joueur inactif', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            expect(GameService.send.forPlayer.choicesViewState('player:2', gs).canMakeChoice).toBe(false);
        });

        it('canDeclareDefi=true au 2e lancer si pas encore déclaré', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            gs.deck.rollsCounter = 2;
            gs.choices.isDefi = false;
            expect(GameService.send.forPlayer.choicesViewState('player:1', gs).canDeclareDefi).toBe(true);
        });

        it('canDeclareDefi=false si isDefi déjà activé', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            gs.deck.rollsCounter = 2;
            gs.choices.isDefi = true;
            expect(GameService.send.forPlayer.choicesViewState('player:1', gs).canDeclareDefi).toBe(false);
        });

        it('canDeclareDefi=false si pas au 2e lancer', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            gs.deck.rollsCounter = 1;
            gs.choices.isDefi = false;
            expect(GameService.send.forPlayer.choicesViewState('player:1', gs).canDeclareDefi).toBe(false);
        });
    });

    describe('gridViewState()', () => {
        it('winner=null sur grille vide', () => {
            const view = GameService.send.forPlayer.gridViewState('player:1', makeGS());
            expect(view.winner).toBeNull();
        });

        it('winner=\'player:1\' quand player:1 aligne 5 en ligne', () => {
            const gs = makeGS({ grid: makeRowWin(0, 'player:1') });
            expect(GameService.send.forPlayer.gridViewState('player:1', gs).winner).toBe('player:1');
        });

        it('canSelectCells=false pour le joueur inactif', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            gs.choices.availableChoices = [{ id: 'suite' }];
            expect(GameService.send.forPlayer.gridViewState('player:2', gs).canSelectCells).toBe(false);
        });

        it('canSelectCells=false si aucun choix disponible', () => {
            const gs = makeGS({ currentTurn: 'player:1' });
            gs.choices.availableChoices = [];
            expect(GameService.send.forPlayer.gridViewState('player:1', gs).canSelectCells).toBe(false);
        });
    });
});

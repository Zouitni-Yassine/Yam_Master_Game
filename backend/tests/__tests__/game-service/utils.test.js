'use strict';

const GameService = require('../../../services/game.service');
const { makeDices, makeGamesArray } = require('../../helpers/fixtures');

describe('GameService.utils', () => {

    describe('findGameIndexById()', () => {
        it('retourne l\'index correct pour chaque jeu', () => {
            const games = makeGamesArray();
            expect(GameService.utils.findGameIndexById(games, 'game-A')).toBe(0);
            expect(GameService.utils.findGameIndexById(games, 'game-B')).toBe(1);
            expect(GameService.utils.findGameIndexById(games, 'game-C')).toBe(2);
        });

        it('retourne -1 si l\'ID n\'existe pas', () => {
            expect(GameService.utils.findGameIndexById(makeGamesArray(), 'inexistant')).toBe(-1);
        });

        it('retourne -1 sur tableau vide', () => {
            expect(GameService.utils.findGameIndexById([], 'game-A')).toBe(-1);
        });
    });

    describe('findGameIndexBySocketId()', () => {
        it('trouve un jeu actif par socket player:1', () => {
            expect(GameService.utils.findGameIndexBySocketId(makeGamesArray(), 'sA1')).toBe(0);
        });

        it('trouve un jeu actif par socket player:2', () => {
            expect(GameService.utils.findGameIndexBySocketId(makeGamesArray(), 'sC2')).toBe(2);
        });

        it('ignore les jeux terminés (ended=true)', () => {
            // game-B est ended=true
            expect(GameService.utils.findGameIndexBySocketId(makeGamesArray(), 'sB1')).toBe(-1);
        });

        it('retourne -1 si le socket est inconnu', () => {
            expect(GameService.utils.findGameIndexBySocketId(makeGamesArray(), 'inexistant')).toBe(-1);
        });
    });

    describe('findDiceIndexByDiceId()', () => {
        it('retourne l\'index du dé correspondant', () => {
            const dices = makeDices([1, 2, 3, 4, 5]);
            expect(GameService.utils.findDiceIndexByDiceId(dices, 3)).toBe(2);
        });

        it('retourne le premier dé (id=1)', () => {
            const dices = makeDices([1, 2, 3, 4, 5]);
            expect(GameService.utils.findDiceIndexByDiceId(dices, 1)).toBe(0);
        });

        it('retourne le dernier dé (id=5)', () => {
            const dices = makeDices([1, 2, 3, 4, 5]);
            expect(GameService.utils.findDiceIndexByDiceId(dices, 5)).toBe(4);
        });

        it('retourne -1 si l\'ID n\'existe pas', () => {
            expect(GameService.utils.findDiceIndexByDiceId(makeDices([1, 2, 3, 4, 5]), 99)).toBe(-1);
        });
    });
});

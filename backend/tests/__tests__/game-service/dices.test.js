'use strict';

const GameService = require('../../../services/game.service');
const { makeDices, makeBlankDices } = require('../../helpers/fixtures');

describe('GameService.dices', () => {

    describe('roll()', () => {
        it('attribue une valeur 1–6 aux dés vierges (value="")', () => {
            const rolled = GameService.dices.roll(makeBlankDices());
            rolled.forEach(d => {
                const v = parseInt(d.value);
                expect(v).toBeGreaterThanOrEqual(1);
                expect(v).toBeLessThanOrEqual(6);
            });
        });

        it('déverrouille les dés vierges après le lancer', () => {
            const rolled = GameService.dices.roll(makeBlankDices());
            rolled.forEach(d => expect(d.locked).toBe(false));
        });

        it('ne modifie pas les dés verrouillés (valeur conservée)', () => {
            const dices = makeDices([3, 3, 3, 1, 2], [1, 2, 3]);
            const rolled = GameService.dices.roll(dices);
            expect(rolled[0].value).toBe('3');
            expect(rolled[1].value).toBe('3');
            expect(rolled[2].value).toBe('3');
        });

        it('relance les dés non verrouillés avec une valeur existante', () => {
            const dices = makeDices([1, 2, 3, 4, 5], []);
            const rolled = GameService.dices.roll(dices);
            rolled.forEach(d => {
                expect(parseInt(d.value)).toBeGreaterThanOrEqual(1);
                expect(parseInt(d.value)).toBeLessThanOrEqual(6);
            });
        });

        it('retourne un nouveau tableau (immutabilité)', () => {
            const dices = makeBlankDices();
            expect(GameService.dices.roll(dices)).not.toBe(dices);
        });
    });

    describe('lockEveryDice()', () => {
        it('verrouille tous les dés', () => {
            const dices = makeDices([1, 2, 3, 4, 5], []);
            GameService.dices.lockEveryDice(dices).forEach(d => expect(d.locked).toBe(true));
        });

        it('retourne un nouveau tableau (immutabilité)', () => {
            const dices = makeDices([1, 2, 3, 4, 5]);
            expect(GameService.dices.lockEveryDice(dices)).not.toBe(dices);
        });
    });
});

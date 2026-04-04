'use strict';

const BotService = require('../../../services/bot.service');
const { makeDices } = require('../../helpers/fixtures');

describe('BotService.decideLock()', () => {

    describe('easy', () => {
        it('retourne toujours un tableau vide', () => {
            expect(BotService.decideLock(makeDices([3, 3, 3, 1, 2]), 'easy')).toEqual([]);
        });

        it('retourne vide même avec 5 dés identiques', () => {
            expect(BotService.decideLock(makeDices([6, 6, 6, 6, 6]), 'easy')).toEqual([]);
        });
    });

    describe('medium', () => {
        it('verrouille jusqu\'à 3 dés de la valeur la plus fréquente', () => {
            const dices = makeDices([4, 4, 4, 1, 2]);
            const locked = BotService.decideLock(dices, 'medium');
            expect(locked).toHaveLength(3);
            locked.forEach(id => expect(dices.find(d => d.id === id).value).toBe('4'));
        });

        it('ne verrouille pas plus de 3 dés même avec 4 identiques', () => {
            expect(BotService.decideLock(makeDices([5, 5, 5, 5, 2]), 'medium').length).toBeLessThanOrEqual(3);
        });

        it('retourne vide si aucune paire (tous uniques)', () => {
            // bestCount = 1 → condition bestCount >= 2 non satisfaite
            expect(BotService.decideLock(makeDices([1, 2, 3, 4, 5]), 'medium')).toHaveLength(0);
        });
    });

    describe('hard', () => {
        it('verrouille jusqu\'à 4 dés de la valeur la plus fréquente', () => {
            const dices = makeDices([6, 6, 6, 6, 2]);
            const locked = BotService.decideLock(dices, 'hard');
            expect(locked).toHaveLength(4);
            locked.forEach(id => expect(dices.find(d => d.id === id).value).toBe('6'));
        });

        it('préfère la suite 1-2-3-4-5 si 4+ valeurs présentes', () => {
            const dices = makeDices([1, 2, 3, 4, 6]);
            const locked = BotService.decideLock(dices, 'hard');
            const vals = locked.map(id => parseInt(dices.find(d => d.id === id).value));
            [1, 2, 3, 4].forEach(v => expect(vals).toContain(v));
        });

        it('préfère la suite 2-3-4-5-6 si elle a plus de valeurs que la suite 1-2-3-4-5', () => {
            // suite2 a 5 valeurs (2,3,4,5,6) vs suite1 qui en a 4 (2,3,4,5) → suite2 gagne
            const dices = makeDices([2, 3, 4, 5, 6]);
            const locked = BotService.decideLock(dices, 'hard');
            const vals = locked.map(id => parseInt(dices.find(d => d.id === id).value));
            [3, 4, 5, 6].forEach(v => expect(vals).toContain(v));
        });
    });

    describe('cas limites', () => {
        it('retourne vide si les dés ont value="" (non lancés)', () => {
            const dices = [1, 2, 3, 4, 5].map(id => ({ id, value: '', locked: true }));
            expect(BotService.decideLock(dices, 'hard')).toHaveLength(0);
        });
    });
});

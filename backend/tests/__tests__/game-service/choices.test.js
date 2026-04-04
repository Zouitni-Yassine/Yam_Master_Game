'use strict';

const GameService = require('../../../services/game.service');
const { makeDices } = require('../../helpers/fixtures');

describe('GameService.choices', () => {

    describe('findCombinations()', () => {

        describe('Brelan', () => {
            it('détecte Brelan3 pour trois dés à 3', () => {
                const ids = GameService.choices.findCombinations(makeDices([3, 3, 3, 1, 2]), false, false).map(c => c.id);
                expect(ids).toContain('brelan3');
            });

            it('ne détecte pas de Brelan avec seulement une paire', () => {
                const ids = GameService.choices.findCombinations(makeDices([2, 2, 1, 4, 5]), false, false).map(c => c.id);
                expect(ids.some(id => id.includes('brelan'))).toBe(false);
            });
        });

        describe('Full', () => {
            it('détecte Full pour brelan + paire', () => {
                const ids = GameService.choices.findCombinations(makeDices([4, 4, 4, 2, 2]), false, false).map(c => c.id);
                expect(ids).toContain('full');
            });

            it('ne détecte pas Full sans paire', () => {
                const ids = GameService.choices.findCombinations(makeDices([4, 4, 4, 1, 2]), false, false).map(c => c.id);
                expect(ids).not.toContain('full');
            });
        });

        describe('Carré', () => {
            it('détecte Carré pour 4 dés identiques', () => {
                const ids = GameService.choices.findCombinations(makeDices([5, 5, 5, 5, 2]), false, false).map(c => c.id);
                expect(ids).toContain('carre');
            });

            it('ne détecte pas Carré avec seulement un brelan', () => {
                const ids = GameService.choices.findCombinations(makeDices([5, 5, 5, 1, 2]), false, false).map(c => c.id);
                expect(ids).not.toContain('carre');
            });
        });

        describe('Yam', () => {
            it('détecte Yam pour 5 dés identiques', () => {
                const ids = GameService.choices.findCombinations(makeDices([6, 6, 6, 6, 6]), false, false).map(c => c.id);
                expect(ids).toContain('yam');
            });

            it('Yam inclut aussi Carré et le Brelan correspondant', () => {
                const ids = GameService.choices.findCombinations(makeDices([4, 4, 4, 4, 4]), false, false).map(c => c.id);
                expect(ids).toContain('yam');
                expect(ids).toContain('carre');
                expect(ids).toContain('brelan4');
            });
        });

        describe('Suite', () => {
            it('détecte Suite 1-2-3-4-5', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 5]), false, false).map(c => c.id);
                expect(ids).toContain('suite');
            });

            it('détecte Suite 2-3-4-5-6', () => {
                const ids = GameService.choices.findCombinations(makeDices([2, 3, 4, 5, 6]), false, false).map(c => c.id);
                expect(ids).toContain('suite');
            });

            it('ne détecte pas Suite pour une séquence incomplète', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 6]), false, false).map(c => c.id);
                expect(ids).not.toContain('suite');
            });
        });

        describe('≤8 (moinshuit)', () => {
            it('détecte moinshuit quand somme = 8', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 1, 2, 2, 2]), false, false).map(c => c.id);
                expect(ids).toContain('moinshuit');
            });

            it('détecte moinshuit quand somme < 8', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 1, 1, 1, 1]), false, false).map(c => c.id);
                expect(ids).toContain('moinshuit');
            });

            it('ne détecte pas moinshuit quand somme > 8', () => {
                const ids = GameService.choices.findCombinations(makeDices([2, 2, 2, 2, 2]), false, false).map(c => c.id);
                expect(ids).not.toContain('moinshuit');
            });
        });

        describe('Défi', () => {
            it('ajoute Défi si isDefi=true ET combo non-brelan présente', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 5]), true, false).map(c => c.id);
                expect(ids).toContain('defi');
            });

            it('n\'ajoute pas Défi si uniquement des brelans', () => {
                const ids = GameService.choices.findCombinations(makeDices([3, 3, 3, 1, 2]), true, false).map(c => c.id);
                expect(ids).not.toContain('defi');
            });

            it('n\'ajoute pas Défi si isDefi=false', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 5]), false, false).map(c => c.id);
                expect(ids).not.toContain('defi');
            });
        });

        describe('Sec', () => {
            it('ajoute Sec si isSec=true ET combo non-brelan présente', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 5]), false, true).map(c => c.id);
                expect(ids).toContain('sec');
            });

            it('n\'ajoute pas Sec si uniquement des brelans', () => {
                const ids = GameService.choices.findCombinations(makeDices([3, 3, 3, 1, 2]), false, true).map(c => c.id);
                expect(ids).not.toContain('sec');
            });

            it('n\'ajoute pas Sec si isSec=false', () => {
                const ids = GameService.choices.findCombinations(makeDices([1, 2, 3, 4, 5]), false, false).map(c => c.id);
                expect(ids).not.toContain('sec');
            });
        });

        it('retourne un tableau vide si aucune combinaison réalisable', () => {
            // 1,2,4,5,6 → pas de suite, pas de brelan, somme=18
            expect(GameService.choices.findCombinations(makeDices([1, 2, 4, 5, 6]), false, false)).toHaveLength(0);
        });
    });

    describe('lockDicesForChoice()', () => {

        it('verrouille exactement 3 dés pour un brelan', () => {
            const result = GameService.choices.lockDicesForChoice(makeDices([2, 2, 2, 4, 5]), 'brelan2');
            const locked = result.filter(d => d.locked);
            expect(locked).toHaveLength(3);
            locked.forEach(d => expect(d.value).toBe('2'));
        });

        it('verrouille exactement 4 dés pour un carré', () => {
            const result = GameService.choices.lockDicesForChoice(makeDices([6, 6, 6, 6, 1]), 'carre');
            const locked = result.filter(d => d.locked);
            expect(locked).toHaveLength(4);
            locked.forEach(d => expect(d.value).toBe('6'));
        });

        it('verrouille tous les dés pour yam', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([5, 5, 5, 5, 5]), 'yam').filter(d => d.locked)).toHaveLength(5);
        });

        it('verrouille tous les dés pour suite', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([1, 2, 3, 4, 5]), 'suite').filter(d => d.locked)).toHaveLength(5);
        });

        it('verrouille tous les dés pour full', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([3, 3, 3, 1, 1]), 'full').filter(d => d.locked)).toHaveLength(5);
        });

        it('verrouille tous les dés pour moinshuit', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([1, 1, 2, 2, 2]), 'moinshuit').filter(d => d.locked)).toHaveLength(5);
        });

        it('verrouille tous les dés pour sec', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([1, 2, 3, 4, 5]), 'sec').filter(d => d.locked)).toHaveLength(5);
        });

        it('verrouille tous les dés pour defi', () => {
            expect(GameService.choices.lockDicesForChoice(makeDices([2, 3, 4, 5, 6]), 'defi').filter(d => d.locked)).toHaveLength(5);
        });

        it('retourne un nouveau tableau (immutabilité)', () => {
            const dices = makeDices([1, 1, 1, 2, 3]);
            expect(GameService.choices.lockDicesForChoice(dices, 'brelan1')).not.toBe(dices);
        });
    });
});

'use strict';

const GameService = require('../../../services/game.service');

describe('GameService.timer', () => {
    it('getTurnDuration() retourne 30', () => {
        expect(GameService.timer.getTurnDuration()).toBe(30);
    });

    it('getEndTurnDuration() retourne 5', () => {
        expect(GameService.timer.getEndTurnDuration()).toBe(5);
    });
});

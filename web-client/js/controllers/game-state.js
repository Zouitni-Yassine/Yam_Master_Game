const GameState = (() => {
    const state = {
        inQueue: false, inGame: false,
        idPlayer: null, idOpponent: null,
        isMyTurn: false, isRolling: false,
        currentDeck: null, currentChoices: null, currentGrid: null,
        selectedChoice: null, selectedGridCell: null, canSelectCells: false,
        rollsCounter: 0, rollsMaximum: 3,
        hasRolledThisTurn: false,
        opponentRollsCounter: 0,
        opponentInitialized: false,
        animGeneration: 0,
        pendingServerDices: null, scatterCallback: null,
        previousPlayerScore: 0
    };

    function init() {
        GameSocketHandlers.setup(state);
        GameUIHandlers.setup(state);

        DiceSystem.onDiceClick((index, diceState) => {
            if (!state.isMyTurn || state.rollsCounter === 0) return;
            DiceSystem.setDiceLocked(index, !diceState.locked);
            SocketClient.lockDice(diceState.id);
            SoundManager.play('click');
        });
    }

    return { init, getState: () => state };
})();

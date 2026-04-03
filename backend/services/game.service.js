// websocket-server/services/game.service.js

// Durée d'un tour en secondes
const TURN_DURATION = 30;
// Durée après le dernier lancer avant changement de tour
const END_TURN_DURATION = 5;

const CHOICES_INIT = {
    isDefi: false,
    isSec: false,
    idSelectedChoice: null,
    availableChoices: [],
};

const ALL_COMBINATIONS = [
    { value: 'Brelan1', id: 'brelan1' },
    { value: 'Brelan2', id: 'brelan2' },
    { value: 'Brelan3', id: 'brelan3' },
    { value: 'Brelan4', id: 'brelan4' },
    { value: 'Brelan5', id: 'brelan5' },
    { value: 'Brelan6', id: 'brelan6' },
    { value: 'Full', id: 'full' },
    { value: 'Carré', id: 'carre' },
    { value: 'Yam', id: 'yam' },
    { value: 'Suite', id: 'suite' },
    { value: '≤8', id: 'moinshuit' },
    { value: 'Sec', id: 'sec' },
    { value: 'Défi', id: 'defi' }
];

const GRID_INIT = [
    [
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: 'Yam', id: 'yam', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
    ]
];

const DECK_INIT = {
    dices: [
        { id: 1, value: '', locked: true },
        { id: 2, value: '', locked: true },
        { id: 3, value: '', locked: true },
        { id: 4, value: '', locked: true },
        { id: 5, value: '', locked: true },
    ],
    rollsCounter: 1,
    rollsMaximum: 3
};

const GAME_INIT = {
    gameState: {
        currentTurn: 'player:1',
        timer: null,
        player1Score: 0,
        player2Score: 0,
        grid: [],
        choices: {},
        deck: {}
    }
};

const GameService = {

    init: {
        gameState: () => {
            const game = { ...GAME_INIT, gameState: { ...GAME_INIT.gameState } };
            game.gameState.timer = TURN_DURATION;
            game.gameState.deck = { ...DECK_INIT, dices: DECK_INIT.dices.map(d => ({ ...d })) };
            game.gameState.choices = { ...CHOICES_INIT };
            game.gameState.grid = GRID_INIT.map(row => row.map(cell => ({ ...cell })));
            return game;
        },

        deck: () => {
            return { ...DECK_INIT, dices: DECK_INIT.dices.map(d => ({ ...d })) };
        },

        choices: () => {
            return { ...CHOICES_INIT };
        },

        grid: () => {
            return GRID_INIT.map(row => row.map(cell => ({ ...cell })));
        },
    },

    send: {
        forPlayer: {
            viewGameState: (playerKey, game) => {
                return {
                    inQueue: false,
                    inGame: true,
                    playerKey,
                    idPlayer:
                        (playerKey === 'player:1')
                            ? game.player1Socket.id
                            : game.player2Socket.id,
                    idOpponent:
                        (playerKey === 'player:1')
                            ? game.player2Socket.id
                            : game.player1Socket.id
                };
            },

            viewQueueState: () => {
                return {
                    inQueue: true,
                    inGame: false,
                };
            },

            gameTimer: (playerKey, gameState) => {
                const playerTimer = gameState.currentTurn === playerKey ? gameState.timer : 0;
                const opponentTimer = gameState.currentTurn === playerKey ? 0 : gameState.timer;
                return { playerTimer, opponentTimer };
            },

            deckViewState: (playerKey, gameState) => {
                return {
                    displayPlayerDeck: gameState.currentTurn === playerKey,
                    displayOpponentDeck: gameState.currentTurn !== playerKey,
                    displayRollButton: gameState.deck.rollsCounter <= gameState.deck.rollsMaximum,
                    rollsCounter: gameState.deck.rollsCounter,
                    rollsMaximum: gameState.deck.rollsMaximum,
                    dices: gameState.deck.dices
                };
            },

            choicesViewState: (playerKey, gameState) => {
                return {
                    displayChoices: true,
                    canMakeChoice: playerKey === gameState.currentTurn,
                    idSelectedChoice: gameState.choices.idSelectedChoice,
                    availableChoices: gameState.choices.availableChoices,
                    isDefi: gameState.choices.isDefi,
                    canDeclareDefi: playerKey === gameState.currentTurn
                        && gameState.deck.rollsCounter === 2
                        && !gameState.choices.isDefi
                };
            },

            gridViewState: (playerKey, gameState) => {
                const scores = GameService.grid.computeScores(gameState.grid);
                const opponentKey = playerKey === 'player:1' ? 'player:2' : 'player:1';
                const winner = scores['player:1'].winner ? 'player:1' : (scores['player:2'].winner ? 'player:2' : null);
                return {
                    displayGrid: true,
                    canSelectCells: (playerKey === gameState.currentTurn) && (gameState.choices.availableChoices.length > 0),
                    grid: gameState.grid,
                    playerScore: scores[playerKey].score,
                    opponentScore: scores[opponentKey].score,
                    winner
                };
            },
        }
    },

    timer: {
        getTurnDuration: () => {
            return TURN_DURATION;
        },
        getEndTurnDuration: () => {
            return END_TURN_DURATION;
        }
    },

    dices: {
        roll: (dicesToRoll) => {
            return dicesToRoll.map(dice => {
                if (dice.value === '') {
                    return { id: dice.id, value: String(Math.floor(Math.random() * 6) + 1), locked: false };
                } else if (!dice.locked) {
                    return { ...dice, value: String(Math.floor(Math.random() * 6) + 1) };
                } else {
                    return dice;
                }
            });
        },

        lockEveryDice: (dicesToLock) => {
            return dicesToLock.map(dice => ({ ...dice, locked: true }));
        }
    },

    utils: {
        findGameIndexById: (games, idGame) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].idGame === idGame) return i;
            }
            return -1;
        },

        findGameIndexBySocketId: (games, socketId) => {
            for (let i = 0; i < games.length; i++) {
                if (!games[i].ended && (games[i].player1Socket.id === socketId || games[i].player2Socket.id === socketId)) return i;
            }
            return -1;
        },

        findDiceIndexByDiceId: (dices, idDice) => {
            for (let i = 0; i < dices.length; i++) {
                if (dices[i].id === idDice) return i;
            }
            return -1;
        }
    },

    grid: {
        resetcanBeCheckedCells: (grid) => {
            return grid.map(row => row.map(cell => ({ ...cell, canBeChecked: false })));
        },

        updateGridAfterSelectingChoice: (idSelectedChoice, grid) => {
            return grid.map(row => row.map(cell => ({
                ...cell,
                canBeChecked: cell.id === idSelectedChoice && cell.owner === null
            })));
        },

        selectCell: (idCell, rowIndex, cellIndex, currentTurn, grid) => {
            return grid.map((row, rIdx) => row.map((cell, cIdx) => {
                if (rIdx === rowIndex && cIdx === cellIndex) {
                    return { ...cell, owner: currentTurn };
                }
                return cell;
            }));
        },

        computeScores: (grid) => {
            const ROWS = grid.length, COLS = grid[0].length;
            const result = {};

            for (const p of ['player:1', 'player:2']) {
                let score = 0, winner = false;

                const checkLine = (cells) => {
                    let run = 0;
                    const flush = (n) => {
                        if (n >= 5) winner = true;
                        else if (n >= 3) score += n - 2; // 3→1pt, 4→2pts
                    };
                    for (const cell of cells) {
                        if (cell.owner === p) run++;
                        else { flush(run); run = 0; }
                    }
                    flush(run);
                };

                for (let r = 0; r < ROWS; r++) checkLine(grid[r]);
                for (let c = 0; c < COLS; c++) checkLine(grid.map(row => row[c]));
                for (let k = -(COLS-1); k <= ROWS-1; k++) {
                    const cells = [];
                    for (let r = 0; r < ROWS; r++) { const c = r - k; if (c >= 0 && c < COLS) cells.push(grid[r][c]); }
                    if (cells.length >= 3) checkLine(cells);
                }
                for (let k = 0; k <= ROWS+COLS-2; k++) {
                    const cells = [];
                    for (let r = 0; r < ROWS; r++) { const c = k - r; if (c >= 0 && c < COLS) cells.push(grid[r][c]); }
                    if (cells.length >= 3) checkLine(cells);
                }

                result[p] = { score, winner };
            }
            return result;
        },
    },

    choices: {
        lockDicesForChoice: (dices, choiceId) => {
            const newDices = dices.map(d => ({ ...d, locked: false }));

            if (choiceId.includes('brelan')) {
                const value = parseInt(choiceId.slice(-1));
                let count = 0;
                return newDices.map(d => {
                    if (parseInt(d.value) === value && count < 3) {
                        count++;
                        return { ...d, locked: true };
                    }
                    return d;
                });
            }

            if (choiceId === 'carre') {
                const counts = Array(7).fill(0);
                newDices.forEach(d => counts[parseInt(d.value)]++);
                const value = counts.findIndex(c => c >= 4);
                let count = 0;
                return newDices.map(d => {
                    if (parseInt(d.value) === value && count < 4) {
                        count++;
                        return { ...d, locked: true };
                    }
                    return d;
                });
            }

            // full, yam, suite, moinshuit, sec, defi → lock all
            return newDices.map(d => ({ ...d, locked: true }));
        },

        findCombinations: (dices, isDefi, isSec) => {
            const availableCombinations = [];
            const counts = Array(7).fill(0);
            let hasPair = false;
            let threeOfAKindValue = null;
            let hasThreeOfAKind = false;
            let hasFourOfAKind = false;
            let hasFiveOfAKind = false;
            let hasStraight = false;
            let sum = 0;

            for (let i = 0; i < dices.length; i++) {
                const diceValue = parseInt(dices[i].value);
                counts[diceValue]++;
                sum += diceValue;
            }

            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 2) {
                    hasPair = true;
                } else if (counts[i] === 3) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                } else if (counts[i] === 4) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                } else if (counts[i] === 5) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                    hasFiveOfAKind = true;
                }
            }

            const sortedValues = dices.map(d => parseInt(d.value)).sort((a, b) => a - b);
            hasStraight = sortedValues.every((v, idx) => idx === 0 || v === sortedValues[idx - 1] + 1);

            const isLessThanEqual8 = sum <= 8;

            ALL_COMBINATIONS.forEach(combination => {
                if (
                    (combination.id.includes('brelan') && hasThreeOfAKind && parseInt(combination.id.slice(-1)) === threeOfAKindValue) ||
                    (combination.id === 'full' && hasPair && hasThreeOfAKind) ||
                    (combination.id === 'carre' && hasFourOfAKind) ||
                    (combination.id === 'yam' && hasFiveOfAKind) ||
                    (combination.id === 'suite' && hasStraight) ||
                    (combination.id === 'moinshuit' && isLessThanEqual8)
                ) {
                    availableCombinations.push(combination);
                }
            });

            const notOnlyBrelan = availableCombinations.some(c => !c.id.includes('brelan'));

            // Défi only if declared AND at least one non-brelan combination achieved
            if (isDefi && notOnlyBrelan) {
                availableCombinations.push(ALL_COMBINATIONS.find(c => c.id === 'defi'));
            }

            if (isSec && availableCombinations.length > 0 && notOnlyBrelan) {
                availableCombinations.push(ALL_COMBINATIONS.find(c => c.id === 'sec'));
            }

            return availableCombinations;
        }
    }
};

module.exports = GameService;

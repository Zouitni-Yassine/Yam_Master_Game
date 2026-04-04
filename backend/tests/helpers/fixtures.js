/**
 * Factories partagées pour les tests.
 * Centralise la création des données de test pour éviter la duplication.
 */

const GameService = require('../../services/game.service');

// ─── Dés ────────────────────────────────────────────────────────────────────

/**
 * Crée un tableau de 5 dés avec les valeurs fournies.
 * @param {number[]} values - Valeurs de 1 à 6 pour chaque dé
 * @param {number[]} lockedIds - IDs des dés à verrouiller (1–5)
 */
const makeDices = (values, lockedIds = []) =>
    values.map((v, i) => ({
        id: i + 1,
        value: String(v),
        locked: lockedIds.includes(i + 1),
    }));

/** Dés non lancés (état initial du deck) */
const makeBlankDices = () =>
    [1, 2, 3, 4, 5].map(id => ({ id, value: '', locked: true }));

// ─── Grille ──────────────────────────────────────────────────────────────────

/**
 * Crée une grille 5×5 vierge (copie propre de l'init).
 */
const makeGrid = () => GameService.init.grid();

/**
 * Crée une grille avec des propriétaires prédéfinis.
 * @param {Array<{row: number, col: number, owner: string}>} cells
 */
const makeOwnedGrid = (cells = []) => {
    const grid = makeGrid();
    cells.forEach(({ row, col, owner }) => {
        grid[row][col].owner = owner;
    });
    return grid;
};

/**
 * Crée une grille avec une ligne horizontale complète appartenant à un joueur.
 * @param {number} rowIndex - Ligne à remplir (0–4)
 * @param {string} owner - 'player:1' ou 'player:2'
 */
const makeRowWin = (rowIndex, owner) => {
    const cells = [0, 1, 2, 3, 4].map(col => ({ row: rowIndex, col, owner }));
    return makeOwnedGrid(cells);
};

/**
 * Crée une grille avec une colonne complète appartenant à un joueur.
 * @param {number} colIndex - Colonne à remplir (0–4)
 * @param {string} owner
 */
const makeColWin = (colIndex, owner) => {
    const cells = [0, 1, 2, 3, 4].map(row => ({ row, col: colIndex, owner }));
    return makeOwnedGrid(cells);
};

/**
 * Crée une grille avec la diagonale principale remplie.
 * @param {string} owner
 */
const makeDiagWin = (owner) => {
    const cells = [0, 1, 2, 3, 4].map(i => ({ row: i, col: i, owner }));
    return makeOwnedGrid(cells);
};

// ─── Jeux ────────────────────────────────────────────────────────────────────

/**
 * Crée un objet game simulé avec des sockets factices.
 * @param {Object} overrides - Propriétés à écraser sur le game
 */
const makeGame = (overrides = {}) => ({
    idGame: 'game-test-001',
    player1Socket: { id: 'socket-p1-xxx' },
    player2Socket: { id: 'socket-p2-yyy' },
    ended: false,
    gameState: {
        currentTurn: 'player:1',
        timer: 30,
        deck: GameService.init.deck(),
        choices: GameService.init.choices(),
        grid: makeGrid(),
    },
    ...overrides,
});

/**
 * Crée un tableau de jeux simulés pour tester findGameIndex*.
 */
const makeGamesArray = () => [
    makeGame({ idGame: 'game-A', player1Socket: { id: 'sA1' }, player2Socket: { id: 'sA2' }, ended: false }),
    makeGame({ idGame: 'game-B', player1Socket: { id: 'sB1' }, player2Socket: { id: 'sB2' }, ended: true }),
    makeGame({ idGame: 'game-C', player1Socket: { id: 'sC1' }, player2Socket: { id: 'sC2' }, ended: false }),
];

module.exports = {
    makeDices,
    makeBlankDices,
    makeGrid,
    makeOwnedGrid,
    makeRowWin,
    makeColWin,
    makeDiagWin,
    makeGame,
    makeGamesArray,
};

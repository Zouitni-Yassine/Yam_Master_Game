const BotService = require('./services/bot.service');
const GameService = require('./services/game.service');

let passed = 0, failed = 0;
function test(name, actual, expected) {
    if (actual === expected) { console.log('  OK', name); passed++; }
    else { console.log('  FAIL', name, '- got:', actual, 'expected:', expected); failed++; }
}
function testTrue(name, val) { test(name, !!val, true); }
function testGt(name, val, min) {
    if (val > min) { console.log('  OK', name, '(' + val + ' > ' + min + ')'); passed++; }
    else { console.log('  FAIL', name, '- got:', val, 'should be >', min); failed++; }
}

const g1 = GameService.init.grid();

// ===================== _scoreCellHard =====================
console.log('\n--- _scoreCellHard ---');

const gWinRow = GameService.init.grid();
gWinRow[0][0].owner = 'player:1'; gWinRow[0][1].owner = 'player:1';
gWinRow[0][3].owner = 'player:1'; gWinRow[0][4].owner = 'player:1';
test('Win detection = 10000', BotService._scoreCellHard(gWinRow, 0, 2, 'player:1', 'player:2'), 10000);

const gBlockRow = GameService.init.grid();
gBlockRow[0][0].owner = 'player:2'; gBlockRow[0][1].owner = 'player:2';
gBlockRow[0][3].owner = 'player:2'; gBlockRow[0][4].owner = 'player:2';
test('Block win = 9000', BotService._scoreCellHard(gBlockRow, 0, 2, 'player:1', 'player:2'), 9000);

const gFork = GameService.init.grid();
gFork[0][2].owner = 'player:1'; gFork[1][2].owner = 'player:1';
gFork[2][0].owner = 'player:1'; gFork[2][1].owner = 'player:1';
const forkScore = BotService._scoreCellHard(gFork, 2, 2, 'player:1', 'player:2');
const cornerScore = BotService._scoreCellHard(gFork, 4, 4, 'player:1', 'player:2');
testGt('Fork cell >> corner cell', forkScore, cornerScore * 2);

// ===================== decideLock =====================
console.log('\n--- decideLock ---');

test('Easy = no locks',
    BotService.decideLock(
        [{id:1,value:'3',locked:false},{id:2,value:'3',locked:false},{id:3,value:'3',locked:false},{id:4,value:'1',locked:false},{id:5,value:'5',locked:false}],
        'easy', g1, 'player:1', 'player:2'
    ).length, 0);

const lockH = BotService.decideLock(
    [{id:1,value:'5',locked:false},{id:2,value:'5',locked:false},{id:3,value:'5',locked:false},{id:4,value:'1',locked:false},{id:5,value:'6',locked:false}],
    'hard', g1, 'player:1', 'player:2'
);
testTrue('Hard keeps 3-of-a-kind (3+ locked)', lockH.length >= 3);

const lockSt = BotService.decideLock(
    [{id:1,value:'2',locked:false},{id:2,value:'3',locked:false},{id:3,value:'4',locked:false},{id:4,value:'5',locked:false},{id:5,value:'1',locked:false}],
    'hard', g1, 'player:1', 'player:2'
);
testTrue('Hard keeps straight pieces (4+ locked)', lockSt.length >= 4);

const lockM = BotService.decideLock(
    [{id:1,value:'3',locked:false},{id:2,value:'3',locked:false},{id:3,value:'6',locked:false},{id:4,value:'1',locked:false},{id:5,value:'5',locked:false}],
    'medium', g1, 'player:1', 'player:2'
);
testTrue('Medium backward compat works', lockM.length >= 2);

// ===================== shouldStopRolling =====================
console.log('\n--- shouldStopRolling ---');

testTrue('Stop with Yam', BotService.shouldStopRolling(
    [{id:1,value:'4'},{id:2,value:'4'},{id:3,value:'4'},{id:4,value:'4'},{id:5,value:'4'}],
    [{id:'yam',value:'Yam'}], g1, 'player:1', 'player:2'));

const gWinCol = GameService.init.grid();
gWinCol[1][0].owner = 'player:1'; gWinCol[2][0].owner = 'player:1';
gWinCol[3][0].owner = 'player:1'; gWinCol[4][0].owner = 'player:1';
testTrue('Stop when win via brelan1', BotService.shouldStopRolling(
    [{id:1,value:'1'},{id:2,value:'1'},{id:3,value:'1'},{id:4,value:'2'},{id:5,value:'6'}],
    [{id:'brelan1',value:'Brelan1'}], gWinCol, 'player:1', 'player:2'));

test('Dont stop with weak hand', BotService.shouldStopRolling(
    [{id:1,value:'1'},{id:2,value:'3'},{id:3,value:'5'},{id:4,value:'2'},{id:5,value:'6'}],
    [{id:'moinshuit',value:'<=8'}], g1, 'player:1', 'player:2'), false);

// ===================== shouldDeclareDefi =====================
console.log('\n--- shouldDeclareDefi ---');

testTrue('Defi with straight already done', BotService.shouldDeclareDefi(
    [{id:1,value:'1'},{id:2,value:'2'},{id:3,value:'3'},{id:4,value:'4'},{id:5,value:'5'}],
    g1, 'player:1', 'player:2'));

// ===================== decideChoice =====================
console.log('\n--- decideChoice ---');

const choices1 = [{id:'brelan3',value:'Brelan3'},{id:'full',value:'Full'}];
const cid1 = BotService.decideChoice(choices1, g1, 'player:1', 'player:2', 'hard');
testTrue('Returns valid choice id', choices1.some(c => c.id === cid1));

const gAlmost = GameService.init.grid();
gAlmost[0][0].owner = 'player:1'; gAlmost[0][1].owner = 'player:1';
gAlmost[0][3].owner = 'player:1'; gAlmost[0][4].owner = 'player:1';
const winChoice = BotService.decideChoice(
    [{id:'brelan3',value:'Brelan3'},{id:'defi',value:'Defi'}],
    gAlmost, 'player:1', 'player:2', 'hard');
test('Choose winning combo (defi at 0,2)', winChoice, 'defi');

// ===================== decideCell =====================
console.log('\n--- decideCell ---');

const cell = BotService.decideCell(g1, 'brelan3', 'player:1', 'player:2', 'hard');
testTrue('Returns a cell object', cell && cell.row !== undefined && cell.col !== undefined);

// Prefers winning cell
const gWinCell = GameService.init.grid();
gWinCell[0][0].owner = 'player:1'; gWinCell[1][0].owner = 'player:1';
gWinCell[2][0].owner = 'player:1'; gWinCell[3][0].owner = 'player:1';
// brelan3 at (0,1) and (4,0). (4,0) completes col 0 for 5-in-a-row!
const wCell = BotService.decideCell(gWinCell, 'brelan3', 'player:1', 'player:2', 'hard');
test('Picks winning cell row', wCell.row, 4);
test('Picks winning cell col', wCell.col, 0);

// ===================== decideMagicCard =====================
console.log('\n--- decideMagicCard ---');

const gMagic = GameService.init.gameState();
gMagic.magicCardUses = {'player:1': 2, 'player:2': 2};
// 4 consecutive on row 0 → score = 2 for player:2
gMagic.gameState.grid[0][0].owner = 'player:2'; gMagic.gameState.grid[0][1].owner = 'player:2';
gMagic.gameState.grid[0][2].owner = 'player:2'; gMagic.gameState.grid[0][3].owner = 'player:2';
gMagic.gameState.grid[2][2].owner = 'player:1'; gMagic.gameState.grid[3][3].owner = 'player:1';
testTrue('Use magic when opponent threatens', BotService.decideMagicCard(gMagic, 'player:1', 'player:2'));

const gEarly = GameService.init.gameState();
gEarly.magicCardUses = {'player:1': 2, 'player:2': 2};
gEarly.gameState.grid[0][0].owner = 'player:1';
test('No magic early game', BotService.decideMagicCard(gEarly, 'player:1', 'player:2'), false);

// ===================== _getLinesThrough =====================
console.log('\n--- _getLinesThrough ---');

const lines1 = BotService._getLinesThrough(g1, 2, 2);
test('Center = 4 lines', lines1.length, 4);

const lines2 = BotService._getLinesThrough(g1, 0, 0);
test('Corner = 3 lines', lines2.length, 3);

// ===================== RESULTS =====================
console.log('\n=============================');
console.log('PASSED:', passed, '/', passed + failed);
if (failed > 0) console.log('FAILED:', failed);
else console.log('ALL TESTS PASSED!');

process.exit(failed > 0 ? 1 : 0);

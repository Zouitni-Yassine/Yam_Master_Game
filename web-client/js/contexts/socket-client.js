/* ============================================
   SOCKET CLIENT
   Connects to the existing backend socket.io server
   ============================================ */

const SocketClient = (() => {
    let socket = null;
    const SERVER_URL = 'http://localhost:3000';

    // Callbacks
    let onConnectCallback = null;
    let onDisconnectCallback = null;
    let onQueueAddedCallback = null;
    let onGameStartCallback = null;
    let onTimerCallback = null;
    let onDeckViewStateCallback = null;
    let onChoicesViewStateCallback = null;
    let onGridViewStateCallback = null;
    let onRoomCreatedCallback = null;
    let onRoomJoinedCallback = null;
    let onRoomErrorCallback = null;
    let onRankingUpdateCallback = null;
    let onUserLoggedCallback = null;
    let onUserErrorCallback = null;
    let onRankingListCallback = null;

    function connect() {
        socket = io(SERVER_URL, {
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            if (onConnectCallback) onConnectCallback(socket.id);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            if (onDisconnectCallback) onDisconnectCallback();
        });

        // Queue events
        socket.on('queue.added', (data) => {
            console.log('[Socket] Queue added:', data);
            if (onQueueAddedCallback) onQueueAddedCallback(data);
        });

        // Game events
        socket.on('game.start', (data) => {
            console.log('[Socket] Game start:', data);
            if (onGameStartCallback) onGameStartCallback(data);
        });

        socket.on('game.timer', (data) => {
            if (onTimerCallback) onTimerCallback(data);
        });

        socket.on('game.deck.view-state', (data) => {
            if (onDeckViewStateCallback) onDeckViewStateCallback(data);
        });

        socket.on('game.choices.view-state', (data) => {
            if (onChoicesViewStateCallback) onChoicesViewStateCallback(data);
        });

        socket.on('game.grid.view-state', (data) => {
            if (onGridViewStateCallback) onGridViewStateCallback(data);
        });

        socket.on('room.created', (data) => { if (onRoomCreatedCallback) onRoomCreatedCallback(data); });
        socket.on('room.joined',  (data) => { if (onRoomJoinedCallback)  onRoomJoinedCallback(data); });
        socket.on('room.error',   (data) => { if (onRoomErrorCallback)   onRoomErrorCallback(data); });
        socket.on('ranking.update', (data) => { if (onRankingUpdateCallback) onRankingUpdateCallback(data); });
        socket.on('user.logged', (data) => { if (onUserLoggedCallback) onUserLoggedCallback(data); });
        socket.on('user.error',  (data) => { if (onUserErrorCallback)  onUserErrorCallback(data); });
        socket.on('ranking.list', (data) => { if (onRankingListCallback) onRankingListCallback(data); });
    }

    // ---- Emit actions ----
    function joinQueue() {
        if (socket) socket.emit('queue.join');
    }

    function leaveQueue() {
        if (socket) socket.emit('queue.leave');
    }

    function rollDice() {
        if (socket) socket.emit('game.dices.roll');
    }

    function lockDice(idDice) {
        if (socket) socket.emit('game.dices.lock', idDice);
    }

    function selectChoice(choiceId) {
        if (socket) socket.emit('game.choices.selected', { choiceId });
    }

    function selectGridCell(cellId, rowIndex, cellIndex) {
        if (socket) socket.emit('game.grid.selected', { cellId, rowIndex, cellIndex });
    }

    function joinBot(difficulty) { if (socket) socket.emit('queue.join.bot', { difficulty }); }
    function createRoom() { if (socket) socket.emit('room.create'); }
    function joinRoom(code) { if (socket) socket.emit('room.join', { code }); }
    function userLogin(username, password) { if (socket) socket.emit('user.login', { username, password }); }
    function userRegister(username, password, avatar) { if (socket) socket.emit('user.register', { username, password, avatar }); }
    function getRankingList() { if (socket) socket.emit('user.ranking.get'); }

    // ---- Register callbacks ----
    function onConnect(cb) { onConnectCallback = cb; }
    function onDisconnect(cb) { onDisconnectCallback = cb; }
    function onQueueAdded(cb) { onQueueAddedCallback = cb; }
    function onGameStart(cb) { onGameStartCallback = cb; }
    function onTimer(cb) { onTimerCallback = cb; }
    function onDeckViewState(cb) { onDeckViewStateCallback = cb; }
    function onChoicesViewState(cb) { onChoicesViewStateCallback = cb; }
    function onGridViewState(cb) { onGridViewStateCallback = cb; }
    function onRoomCreated(cb) { onRoomCreatedCallback = cb; }
    function onRoomJoined(cb)  { onRoomJoinedCallback = cb; }
    function onRoomError(cb)   { onRoomErrorCallback = cb; }
    function onRankingUpdate(cb) { onRankingUpdateCallback = cb; }
    function onUserLogged(cb) { onUserLoggedCallback = cb; }
    function onUserError(cb)  { onUserErrorCallback = cb; }
    function onRankingList(cb) { onRankingListCallback = cb; }

    function getSocket() { return socket; }

    return {
        connect, joinQueue, leaveQueue,
        rollDice, lockDice, selectChoice, selectGridCell,
        joinBot, createRoom, joinRoom,
        userLogin, userRegister, getRankingList,
        onConnect, onDisconnect, onQueueAdded, onGameStart,
        onTimer, onDeckViewState, onChoicesViewState, onGridViewState,
        onRoomCreated, onRoomJoined, onRoomError, onRankingUpdate,
        onUserLogged, onUserError, onRankingList,
        getSocket
    };
})();

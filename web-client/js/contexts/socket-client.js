/* ============================================
   SOCKET CLIENT
   Connects to the existing backend socket.io server
   ============================================ */

const SocketClient = (() => {
    let socket = null;
    const SERVER_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : window.location.origin;

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
    let onSurrenderedCallback = null;
    let onOpponentDisconnectedCallback = null;
    let onOpponentReconnectedCallback = null;
    let onOpponentTimeoutCallback = null;
    let onReconnectedCallback = null;
    let onRematchRequestedCallback = null;
    let onRematchAcceptedCallback  = null;
    let onRematchCancelledCallback = null;
    let onOpponentLeftGameoverCallback = null;
    let onReplayListCallback = null;
    let onReplayDataCallback = null;

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
        socket.on('ranking.list',             (data) => { if (onRankingListCallback)             onRankingListCallback(data); });
        socket.on('game.surrendered',          (data) => { if (onSurrenderedCallback)             onSurrenderedCallback(data); });
        socket.on('game.opponent.disconnected',(data) => { if (onOpponentDisconnectedCallback)    onOpponentDisconnectedCallback(data); });
        socket.on('game.opponent.reconnected', ()     => { if (onOpponentReconnectedCallback)     onOpponentReconnectedCallback(); });
        socket.on('game.opponent.timeout',     ()     => { if (onOpponentTimeoutCallback)         onOpponentTimeoutCallback(); });
        socket.on('game.reconnected',          (data) => { if (onReconnectedCallback)             onReconnectedCallback(data); });
        socket.on('game.rematch.requested',    ()     => { if (onRematchRequestedCallback)         onRematchRequestedCallback(); });
        socket.on('game.rematch.accepted',     ()     => { if (onRematchAcceptedCallback)          onRematchAcceptedCallback(); });
        socket.on('game.rematch.cancelled',        ()  => { if (onRematchCancelledCallback)          onRematchCancelledCallback(); });
        socket.on('game.opponent.left.gameover',   ()  => { if (onOpponentLeftGameoverCallback)      onOpponentLeftGameoverCallback(); });
        socket.on('user.replays.list',             (d) => { if (onReplayListCallback)                onReplayListCallback(d); });
        socket.on('replay.data',                   (d) => { if (onReplayDataCallback)                onReplayDataCallback(d); });
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

    function surrender()    { if (socket) socket.emit('game.surrender'); }
    function reconnectGame(){ if (socket) socket.emit('game.reconnect'); }
    function rematchRequest(mode, botDifficulty, gameId) { if (socket) socket.emit('game.rematch.request', { mode, botDifficulty, gameId: gameId || null }); }
    function rematchDecline()                    { if (socket) socket.emit('game.rematch.decline'); }
    function gameoverLeave()                     { if (socket) socket.emit('game.gameover.leave'); }
    function declareDefi() { if (socket) socket.emit('game.defi.declare'); }
    function joinBot(difficulty) { if (socket) socket.emit('queue.join.bot', { difficulty }); }
    function createRoom() { if (socket) socket.emit('room.create'); }
    function joinRoom(code) { if (socket) socket.emit('room.join', { code }); }
    function userLogin(username, password) { if (socket) socket.emit('user.login', { username, password }); }
    function userRegister(username, password, avatar, firstname, lastname, email, dob) { if (socket) socket.emit('user.register', { username, password, avatar, firstname, lastname, email, dob }); }
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
    function onRankingList(cb)             { onRankingListCallback = cb; }
    function onSurrendered(cb)             { onSurrenderedCallback = cb; }
    function onOpponentDisconnected(cb)    { onOpponentDisconnectedCallback = cb; }
    function onOpponentReconnected(cb)     { onOpponentReconnectedCallback = cb; }
    function onOpponentTimeout(cb)         { onOpponentTimeoutCallback = cb; }
    function onReconnected(cb)             { onReconnectedCallback = cb; }
    function onRematchRequested(cb)        { onRematchRequestedCallback = cb; }
    function onRematchAccepted(cb)         { onRematchAcceptedCallback = cb; }
    function onRematchCancelled(cb)        { onRematchCancelledCallback = cb; }
    function onOpponentLeftGameover(cb)    { onOpponentLeftGameoverCallback = cb; }
    function onReplayList(cb)              { onReplayListCallback = cb; }
    function onReplayData(cb)              { onReplayDataCallback = cb; }
    function getReplayList()               { if (socket) socket.emit('user.replays.get'); }
    function getReplay(idGame)             { if (socket) socket.emit('replay.get', { idGame }); }

    function getSocket() { return socket; }

    return {
        connect, joinQueue, leaveQueue,
        rollDice, lockDice, selectChoice, selectGridCell,
        declareDefi, joinBot, createRoom, joinRoom,
        userLogin, userRegister, getRankingList,
        surrender, reconnectGame,
        onConnect, onDisconnect, onQueueAdded, onGameStart,
        onTimer, onDeckViewState, onChoicesViewState, onGridViewState,
        onRoomCreated, onRoomJoined, onRoomError, onRankingUpdate,
        onUserLogged, onUserError, onRankingList,
        onSurrendered, onOpponentDisconnected, onOpponentReconnected,
        onOpponentTimeout, onReconnected,
        onRematchRequested, onRematchAccepted, onRematchCancelled, onOpponentLeftGameover,
        rematchRequest, rematchDecline, gameoverLeave,
        onReplayList, onReplayData, getReplayList, getReplay,
        getSocket
    };
})();

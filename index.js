const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.get('/', (req, res) => {
  res.render('index.html', { title: 'Express with EJS' });
})

app.get('/game', (req, res) => {
  console.log(req.query.id)
  res.render('game.html', { title: 'Express with EJS' });
})

const games = {}
const winningPositions = [
  (0, 1, 2),
  (3, 4, 5),
  (6, 7, 8),
  (0, 3, 6),
  (1, 4, 7),
  (2, 5, 8),
  (0, 4, 8),
  (2, 4, 6)
]

class Game {
  constructor(id) {
    this.id = id
    this.players = {}
    this.currentPlayer = null
    this.winner = null
    this.board = [null, null, null, null, null, null, null, null, null]
    this.playersMap = {}
  }
}

const tmp = new Game()
games['test'] = tmp

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('setId', id => {
    console.log('id', id)
  })

  socket.on('join', (gameId, username, sign, userId) => {
    console.log('join', gameId, username, sign, userId)

    if (userId === null) {
      userId = uuidv4()
      socket.emit('setUserId', userId)
    }

    if (!Object.keys(games).includes(gameId)) {
      socket.emit('error', 'Game not found.')
      return
    }

    const game = games[gameId]
    game.playersMap[socket.id] = userId

    if (!Object.keys(game.players).includes(userId) && Object.keys(game.players).length == 2) {
      socket.emit('log', 'Room full.', 'info')
      return
    }

    if (!Object.keys(game.players).includes(userId)) {
      game.players[userId] = { username, sign, score: 0, online: true }
    }

    socket.join(gameId)
    io.to(gameId).emit('log', `${username} joins the room.`, 'info')

    if (Object.keys(game.players).length == 2) {
      if (!game.currentPlayer) {
        const n = Math.floor(Math.random() * 2);
        game.currentPlayer = Object.keys(game.players)[n]
      }
      io.to(gameId).emit('log', `Game starts, ${game.players[game.currentPlayer].username} making move.`, 'info')
    }
    io.to(gameId).emit('gameState', game)
  })

  socket.on('gameMove', (gameId, fieldIndex) => {
    const game = games[gameId]
    const userId = game.playersMap[socket.id]
    console.log(game.playersMap)
    console.log(userId, socket.id)

    if (game.currentPlayer !== userId) {
      io.to(gameId).emit('log', `${game.players[userId].username} is unpatient.`, 'info')
      return
    } else if (game.board[fieldIndex] !== null) {
      io.to(gameId).emit('log', `${game.players[userId].username} is unpatient.`, 'info')
      return
    }

    game.board[fieldIndex] = game.players[userId].sign

    const userIndexes = []
    const userSign = game.players[userId].sign

    game.board.forEach((s, index) => {
      if (s === userSign) userIndexes.push(index)
    })

    let win = false;
    if (userIndexes.length >= 3) {
      for (let arr of winningPositions) {
        console.log(arr)
        let tmp = true
        for (let i in arr) {
          if (!userIndexes.includes(i)) {
            tmp = false
            break
          }
        }
        if (tmp === true) {
          win = true;
          break
        }
      }
    }

    if (win === true) {
      game.board = [null, null, null, null, null, null, null, null, null]
      game.players[userId].score += 1
      io.to(gameId).emit('log', `${game.players[userId].username} wins round.`, 'info')
    }
    else if (!game.board.includes(null)) {
      game.board = [null, null, null, null, null, null, null, null, null]
      io.to(gameId).emit('log', `Draw.`, 'info')
    }

    game.currentPlayer = Object.keys(game.players).find(k => k !== userId)
    io.to(gameId).emit('log', `${game.players[game.currentPlayer].username} making move.`, 'info')
    io.to(gameId).emit('gameState', game)
  })

  socket.on('disconnecting', () => {
    console.log('\ndisconnecting', socket.id)
    console.log(socket.rooms)
    socket.rooms.forEach(room => {
      if (room === socket.id) return
      if (!Object.keys(games).includes(room)) return
      const game = games[room]
      const userId = game.playersMap[socket.id]
      game.players[userId].offline = false
      io.to(room).emit('gameState', game)
      return
    })
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
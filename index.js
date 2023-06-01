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

app.get('/online', (req, res) => {
  if (!req.query.gameId) {
    const uuid = uuidv4();
    res.redirect(`online?gameId=${uuid}`)
  }
  res.render('online.html', { title: 'Express with EJS' });
})

app.get('/local', (req, res) => {
  res.render('local.html', { title: 'Express with EJS' });
})


app.get('/ai', (req, res) => {
  res.render('ai.html', { title: 'Express with EJS' });
})

const games = {}
const winingCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

class Game {
  constructor(id) {
    this.id = id
    this.players = {}
    this.currentPlayer = null
    this.lastCurrentPlayer = null
    this.board = [null, null, null, null, null, null, null, null, null]
    this.playersMap = {}
    this.pause = true
    this.winningCombination = null
    this.winner = null
  }
}

io.on('connection', (socket) => {

  socket.on('join', (gameId, username, userId) => {

    if (userId === null) {
      userId = uuidv4()
      socket.emit('setUserId', userId)
    }

    if (!Object.keys(games).includes(gameId)) {
      socket.emit('error', 'Game not found.')
      const tmpGame = new Game(gameId)
      games[gameId] = tmpGame
    }

    const game = games[gameId]
    game.playersMap[socket.id] = userId

    if (!Object.keys(game.players).includes(userId) && Object.keys(game.players).length == 2) {
      socket.emit('log', 'Room full.')
      return
    }

    socket.join(gameId)
    if (!Object.keys(game.players).includes(userId)) {
      const sign = Object.keys(game.players).length === 0 ? 'X' : 'O'
      game.players[userId] = { username, sign, score: 0, online: true, ready: true }
      io.to(gameId).emit('log', `${username} joins the room.`)
    } else {
      game.players[userId].online = true
      io.to(gameId).emit('log', `${username} came back.`)
      if (game.players[userId].ready === false) {
        socket.emit('readyRequest')
      }
    }

    if (Object.keys(game.players).length == 2) {
      if (!game.currentPlayer) {
        const n = Math.random() < .5 ? 0 : 1
        game.pause = false
        game.currentPlayer = Object.keys(game.players)[n]
        game.lastCurrentPlayer = game.currentPlayer
        io.to(gameId).emit('log', `game starts`)
        io.to(gameId).emit('log', `${game.players[game.currentPlayer].username}'s turn.`)
      }
    }
    io.to(gameId).emit('gameState', game)
  })

  socket.on('gameMove', (gameId, fieldIndex) => {
    const game = games[gameId]
    if (!game) return
    if (game.pause === true) return
    const userId = game.playersMap[socket.id]

    if (game.currentPlayer !== userId) {
      io.to(gameId).emit('log', `${game.players[userId].username} is unpatient.`)
      return
    } else if (game.board[fieldIndex] !== null) {
      io.to(gameId).emit('log', `${game.players[userId].username} is unpatient.`)
      return
    }

    const userSign = game.players[userId].sign
    game.board[fieldIndex] = userSign

    let win = false
    let winningCombination
    for (let combination of winingCombinations) {
        const [x, y, z] = combination
        if (game.board[x] === userSign && game.board[y] === userSign && game.board[z] === userSign) {
          win = true
          winningCombination = combination
          break
        }
    }

    if (win === true) {
      game.pause = true
      for (let pid in game.players) {
        game.players[pid].ready = false
      }
      game.players[userId].score += 1
      io.to(gameId).emit('log', `${game.players[userId].username} wins round.`)
      io.to(gameId).emit('gameEnd', winningCombination)
    }
    else if (!game.board.includes(null)) {
      game.pause = true
      for (let pid in game.players) {
        game.players[pid].ready = false
      }
      io.to(gameId).emit('log', `Draw.`)
      io.to(gameId).emit('gameEnd')
    } else {
      game.currentPlayer = Object.keys(game.players).find(k => k !== userId)
      io.to(gameId).emit('log', `${game.players[game.currentPlayer].username}'s turn.`)
    }
    io.to(gameId).emit('gameState', game)
  })

  socket.on('playAgain', (gameId) => {
    const game = games[gameId]
    if (game.pause === false) return

    const userId = game.playersMap[socket.id]
    game.players[userId].ready = true

    for (let pid in game.players) {
      if (game.players[pid].ready === false) return
    }

    game.board = [null, null, null, null, null, null, null, null, null]
    game.currentPlayer = Object.keys(game.players).find(k => k !== game.lastCurrentPlayer)
    game.lastCurrentPlayer = game.currentPlayer
    game.pause = false
    io.to(gameId).emit('log', `game starts.`)
    io.to(gameId).emit('log', `${game.players[game.currentPlayer].username}'s turn.`)
    io.to(gameId).emit('gameState', game)
  })

  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      if (room === socket.id) return
      if (!Object.keys(games).includes(room)) return
      const game = games[room]
      const userId = game.playersMap[socket.id]
      game.players[userId].online = false

      let tmp = 0
      for (let pid in game.players) {
        if (game.players[pid].online === true) tmp += 1
      }

      if (tmp === 0) {
        delete games[room]
      }

      io.to(room).emit('log', `${game.players[userId].username} chickened out.`)
      io.to(room).emit('gameState', game)
      return
    })
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
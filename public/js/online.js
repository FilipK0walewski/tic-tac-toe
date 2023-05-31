const urlParams = new URLSearchParams(window.location.search);
const fields = Array.from(document.getElementsByClassName('field'))

const info = document.getElementById('info')
const infoForm = document.getElementById('info-form')
const player0 = document.getElementById('player-0')
const player1 = document.getElementById('player-1')

let gameId = urlParams.get('gameId')
const socket = io(`/?gameId=${gameId}`);

socket.on("connect", () => {
  console.log('connected')
})

socket.on('disconnect', () => {
  console.log('disconnected')
})

socket.on('setUserId', userId => {
  localStorage.setItem('userId', userId)
})

socket.on('log', (text, type) => {
  logs.innerHTML += `<li>${text}</li>`
})

socket.on('gameEnd', () => {
  logs.innerHTML += `<li><button id="play-again">play again</button></li>`
  document.getElementById('play-again').addEventListener('click', () => {
    socket.emit('playAgain', gameId)
    logs.innerHTML = ''
  })
})

socket.on('gameState', data => {
  const userId = data.playersMap[socket.id]
  player0.innerHTML = `${data.players[userId].username}: ${data.players[userId].score}`

  if (Object.keys(data.players).length === 1) {
    player1.innerHTML = 'waiting for second player'
  } else if (Object.keys(data.players).length == 2) {
    const oponentId = Object.keys(data.players).find(k => k !== userId)
    const oponentStatus = data.players[oponentId].online === true ? '' : ' - disconnected'
    player1.innerHTML = `${data.players[oponentId].username}: ${data.players[oponentId].score}${oponentStatus}`
  }

  fields.forEach((field, index) => {
    if (data.board[index] === null) {
      field.innerHTML = "";
      return
    }
    field.innerHTML = `<span>${data.board[index]}</span>`
  });
})

fields.forEach((field, index) => {
  field.addEventListener("click", () => {
    socket.emit('gameMove', gameId, index)
  });
});

infoForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const username = infoForm.elements.username.value
  localStorage.setItem('username', username)
  socket.emit('join', gameId, username, null)
  info.close()
})

window.onload = () => {
  const username = localStorage.getItem('username')
  const userId = localStorage.getItem('userId')

  if (!username) {
    info.showModal()
    return
  }
  socket.emit('join', gameId, username, userId)
}
const urlParams = new URLSearchParams(window.location.search);

const board = document.getElementById('board')
const fields = Array.from(document.getElementsByClassName('field'))

const info = document.getElementById('info')
const infoForm = document.getElementById('info-form')

const logs = document.getElementById('logs')

let boardState = [null, null, null, null, null, null, null, null, null]

let id = urlParams.get('id')
const socket = io(`/?id=${id}`);

socket.on("connect", () => {
  console.log('connected')
  socket.emit
})

socket.on('disconnect', () => {
  console.log('disconnected')
})

socket.on('setUserId', userId => {
  localStorage.setItem('userId', userId)
})

socket.on('log', (text, type) => {
  console.log(text, type)
  console.log()
  logs.innerHTML += `<li>${text}</li>`
})

socket.on('gameState', data => {
  console.log(data)
  const userId = data.playersMap[socket.id]
  document.getElementById('player-0').innerHTML = `${data.players[userId].username}: ${data.players[userId].score}`

  if (data.currentPlayer) {
    const oponentId = Object.keys(data.players).find(k => k !== userId)
    const oponentStatus = data.players[oponentId].online === true ? 'connected' : 'disconnected'
    document.getElementById('player-1').innerHTML = `${data.players[oponentId].username}: ${data.players[oponentId].score}(${oponentStatus})`
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
    socket.emit('gameMove', id, index)
  });
});

infoForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const username = infoForm.elements.username.value
  const sign = infoForm.elements.sign.value
  localStorage.setItem('username', username)
  localStorage.setItem('sign', sign)

  socket.emit('join', id, username, sign, null)
})

window.onload = () => {
  const username = localStorage.getItem('username')
  const sign = localStorage.getItem('sign')
  const userId = localStorage.getItem('userId')

  if (!username || !sign) {
    info.showModal()
    return
  }
  socket.emit('join', id, username, sign, userId)
}
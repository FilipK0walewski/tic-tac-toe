const fields = Array.from(document.getElementsByClassName('field'))
let board = [null, null, null, null, null, null, null, null, null]

const player0 = document.getElementById('player-0')
const player1 = document.getElementById('player-1')
const msgContainer = document.getElementById('message-container')
const message = document.getElementById('message')

let freeze = false
let turn = Math.random() < .5 ? 0 : 1
let starts = turn
let player0Score = 0
let player1Score = 0

document.getElementById('play-again-btn').addEventListener('click', () => {
    msgContainer.style.display = 'none'
    board = [null, null, null, null, null, null, null, null, null]
    turn = starts === 0 ? 1 : 0
    starts = turn
    for (let field of fields) {
        field.innerHTML = ''
        field.classList.remove('disabled', 'win')
    }
    freeze = false
})

const winingCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
]

const getGameWinner = (board) => {
    for (let combination of winingCombinations) {
        const [x, y, z] = combination
        if (board[x] !== null && board[y] === board[x] && board[z] === board[x]) {
            for (let i = 0; i < fields.length; i++) {
                if (i === x || i === y || i === z) fields[i].classList.add('win')
                fields[i].classList.add('disabled')
            }
            return board[x]
        }
    }
    if (board.filter(i => i === null).length === 0) return -1
    return null
}

const updateScore = () => {
    player0.innerHTML = `player X score: ${player0Score}`
    player1.innerHTML = `player O score: ${player1Score}`
}

const showGameResult = (winner) => {
    msg = 'Draw!'
    if (winner === 0) {
        msg = 'Player X won!'
        player0Score += 1
    } else if (winner === 1) {
        msg = 'Player O won!'
        player1Score += 1
    }
    updateScore()
    message.innerHTML = msg
    msgContainer.style.display = 'flex'
    freeze = true
}

fields.forEach((field, index) => {
    field.addEventListener("click", () => {
        if (freeze === true) return
        if (board[index] !== null) return
        board[index] = turn
        field.innerHTML = turn === 0 ? 'X' : 'O'
        field.classList.add('disabled')
        const winner = getGameWinner(board)
        if (winner !== null) {
            showGameResult(winner)
            return
        }
        turn = turn === 0 ? 1 : 0
    });
});

updateScore()
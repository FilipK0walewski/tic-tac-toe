const fields = Array.from(document.getElementsByClassName('field'))
let board = [null, null, null, null, null, null, null, null, null]

const ai = document.getElementById('ai')
const player = document.getElementById('player')
const message = document.getElementById('message')
const messageContainer = document.getElementById('message-container')

let aiScore = 0
let playerScore = 0
let playerStarts = Math.random() < .5 ? true : false
let playerMove = playerStarts

document.getElementById('play-again-btn').addEventListener('click', () => {
    messageContainer.style.display = 'none'
    board = [null, null, null, null, null, null, null, null, null]
    playerMove = !playerStarts
    playerStarts = playerMove
    for (let field of fields) {
        field.innerHTML = ''
        field.classList.remove('disabled')
        field.classList.remove('win')
    }
    if (playerMove === false) aiMove()
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
            return [board[x], combination]
        }
    }
    if (board.filter(i => i === null).length === 0) return [0, null]
    return [null, null]
}

const minimax = (board, depth, isMaximizing) => {
    const [winner, a] = getGameWinner(board)
    if (winner !== null) {
        return winner
    }
    if (isMaximizing === true) {
        let bestScore = -Infinity
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 1
                let score = minimax(board, depth + 1, false)
                board[i] = null
                bestScore = Math.max(score, bestScore)
            }
        }
        return bestScore
    } else if (isMaximizing === false) {
        let bestScore = Infinity
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = -1
                let score = minimax(board, depth + 1, true)
                board[i] = null
                bestScore = Math.min(score, bestScore)
            }
        }
        return bestScore
    }
}

const updateScore = () => {
    ai.innerHTML = `ai score: ${aiScore}`
    player.innerHTML = `your score: ${playerScore}`
}

const showGameResult = (winner, combination) => {
    for (let i = 0; i < fields.length; i += 1) {
        fields[i].classList.add('disabled')
    }
    if (combination !== null) {
        for (let i of combination) {
            fields[i].classList.add('win')
        }
    }

    msg = 'Draw!'
    if (winner === 1) {
        msg = 'AI won!'
        aiScore += 1
    } else if (winner === -1) {
        msg = 'You won!!!'
        playerScore += 1
    }
    message.innerHTML = msg
    messageContainer.style.display = 'flex'
    updateScore()
}

const aiMove = () => {
    let bestScore = -Infinity
    let bestMove = null

    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 1
            let score = minimax(board, 0, false)
            board[i] = null
            if (score > bestScore) {
                bestScore = score
                bestMove = i
            }
        }
    }

    board[bestMove] = 1
    fields[bestMove].innerHTML = 'X'
    fields[bestMove].className += ' disabled'

    const [winner, combination] = getGameWinner(board)
    if (winner !== null) {
        showGameResult(winner, combination)
        return
    }

    playerMove = true
}

fields.forEach((field, index) => {
    field.addEventListener("click", () => {
        if (playerMove !== true) return
        if (board[index] !== null) return
        board[index] = -1
        field.innerHTML = 'O'
        field.className += ' disabled'
        const [winner, combination] = getGameWinner(board)
        playerMove = false
        if (winner !== null) {
            showGameResult(winner, combination)
            return
        }
        aiMove()
    });
});

if (playerMove === false) aiMove()
updateScore()
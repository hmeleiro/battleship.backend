const express = require('express')
const router = express.Router()

function range(start, stop, step) {
  if (typeof stop === 'undefined') {
    // one param defined
    stop = start
    start = 0
  }

  if (typeof step === 'undefined') {
    step = 1
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return []
  }

  const result = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }

  return result
}

function randomShip(length) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const isRow = Math.random() < 0.5 // Randomly choose row or column
  const startIndex = getRandomInt(0, 16 * 16 - length)

  if (isRow) {
    return range(startIndex, startIndex + length)
  } else {
    return range(startIndex, startIndex + length * 16, 16)
  }
}

const generateShips = (ships = [3, 4, 6]) => {
  return ships.map((ship) => {
    const shipCells = randomShip(ship)
    return shipCells.map((id) => ({ id, isHit: false }))
  })
}

const generateMap = () => {
  const board = []
  const l = 256
  for (let i = 0; i < l; i++) {
    board.push({ id: i, cellType: 'water', isHidden: true })
  }
  return board
}

function startGame() {
  const board = generateMap()
  const ships = [generateShips(), generateShips()]
  return { board, ships }
}

router.get('/creategame', (req, res) => {
  const newgame = startGame()
  res.json(newgame)
})

module.exports = router

const express = require('express')
const router = express.Router()
const DIMENSIONS = 16

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

const randomShip = (remainingCoords, shipLength, dim = 15) => {
  const checkIfShipAvailable = (shipCoords) => {
    let isShipAvailable = shipCoords.map((cellCoords) => {
      const i = remainingCoords.filter((e) => compareArrays(e, cellCoords))
      if (i.length > 0) {
        return i[0]
      } else {
        return null
      }
    })
    isShipAvailable =
      isShipAvailable.filter((e) => e !== null).length === shipLength
    return isShipAvailable
  }

  let isShipAvailable = false
  let shipCoords
  while (!isShipAvailable) {
    const [x, y] =
      remainingCoords[Math.floor(Math.random() * remainingCoords.length)]
    const isRow = Math.random() < 0.5

    if (isRow) {
      if (x + shipLength > dim) {
        const startIndex = x - shipLength + 1
        const coordsX = range(startIndex, x + 1)
        shipCoords = coordsX.map((x) => [x, y])
      } else {
        const startIndex = x
        const coordsX = range(startIndex, startIndex + shipLength)
        shipCoords = coordsX.map((x) => [x, y])
      }
    } else {
      if (y + shipLength > dim) {
        const startIndex = y - shipLength + 1
        const coordsY = range(startIndex, y + 1)
        shipCoords = coordsY.map((y) => [x, y])
      } else {
        const startIndex = y
        const coordsY = range(startIndex, startIndex + shipLength)
        shipCoords = coordsY.map((y) => [x, y])
      }
    }
    isShipAvailable = checkIfShipAvailable(shipCoords)
  }

  return shipCoords
}

const compareArrays = (a, b) => {
  return a.toString() === b.toString()
}

const generateShips = (players = [1, 2], shipLengths = [2, 3, 3, 4, 5]) => {
  function generateBoardCoords(m, n) {
    const result = []
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        result.push([i, j])
      }
    }
    return result
  }

  const coordsToIndex = (coords, width = DIMENSIONS) => {
    const [x, y] = coords
    return x + y * width
  }
  let remainingCoords = generateBoardCoords(DIMENSIONS, DIMENSIONS)

  return players.map((player) => {
    return shipLengths.map((shipLength) => {
      const shipCoords = randomShip(remainingCoords, shipLength)
      shipCoords.forEach((cellCoords) => {
        remainingCoords = remainingCoords.filter(
          (e) => !compareArrays(e, cellCoords),
        )
      })
      return shipCoords.map((coords) => ({
        id: coordsToIndex(coords),
        coords,
        isHit: false,
      }))
    })
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
const generateBoardCells = () => {
  const board = []
  const l = DIMENSIONS * DIMENSIONS
  for (let i = 0; i < l; i++) {
    board.push({ id: i, cellType: 'water', isHidden: true })
  }
  return board
}

function startGame() {
  const board = generateBoardCells()
  const ships = generateShips()
  return { board, ships }
}

router.get('/creategame', (req, res) => {
  const newgame = startGame()
  res.json(newgame)
})

module.exports = router

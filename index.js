const express = require('express')
const cors = require('cors')

const mongoose = require('mongoose')
const roomschema = require('./models/room')
const roomSchema = roomschema.schema
const Room = roomschema.model

const axios = require('axios').default
const app = express()

// Import routes
const status = require('./routes/status')
const creategame = require('./routes/creategame')

const MAX_USERS_PER_ROOM = 2
const PORT = 3000
const http = require('http').Server(app)
const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

app.use(cors())

mongoose.connect('mongodb://127.0.0.1:27017/battleships', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.log.bind(console, 'connection error: '))
db.once('open', function () {
  console.log('Connected successfully')
})

const roomsdb = db.useDb('rooms', {
  useCache: true,
})

// API routes
app.use('/api', status)
app.use('/api', creategame)

io.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`)

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected')
    socket.disconnect()
  })

  socket.on('join', async (data) => {
    const roomId = data.room
    const userId = data.userName
    console.log(`User ${userId} joining ${roomId}`)
    // Need to register models every time a new connection is created
    if (!roomsdb.models['Room']) {
      roomsdb.model('Room', roomSchema)
    }

    let room = await Room.findOne({ room: roomId })
      .then((room) => room)
      .catch((err) => res.status(500).json({ message: err.message }))

    if (room) {
      console.log(room.players)
      if (
        (room.players.length >= MAX_USERS_PER_ROOM) &
        !room.players.includes(userId)
      ) {
        socket.emit('roomFullError', { message: `Room ${roomId} is full.` })
        return
      }
      console.log(`Room ${roomId} exists in db.`)
      socket.join(roomId)
      if (room.players.indexOf(userId) === -1) {
        room.players.push(userId)
      }
      const doc = await Room.findOneAndUpdate(
        { room: roomId },
        { players: room.players },
      )
    } else {
      console.log(`Room ${roomId} does not exist in db. Creating.`)
      response = await axios
        .get(`http://localhost:${PORT}/api/creategame`)
        .then((response) => response)
        .catch((err) => console.log(err))
      room = {
        ships: response.data.ships,
        board: response.data.board,
        room: roomId,
        players: [userId],
        winner: false,
        playerOneTurn: true,
        step: 0,
      }
      const document = new Room(room)
      room = await document.save()
      socket.join(room.room)
    }

    if (room.players.length === 2) {
      io.to(roomId).emit('secondPlayerConnected', {
        message: `Second player connected to ${roomId}`,
      })

      io.to(roomId).emit('gameState', room)
    }
  })

  socket.on('gameState', (data) => {
    socket.broadcast.to(data.room).emit('gameState', data)
  })

  socket.on('nextTurn', (data) => {
    data.playerOneTurn = !data.playerOneTurn
    data.step = data.step += 1
    io.in(data.room).emit('newGameState', data)
  })

  socket.on('message', (data) => {
    console.log(`user: ${data.name} , msg: ${data.text}, room: ${data.room}`)
    io.to(data.room).emit('messageResponse', data)
  })

  socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data))
})

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

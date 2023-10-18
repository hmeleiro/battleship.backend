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

let users = []
let gameInfo = { data: 'test' }
io.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`)

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected')
    //Updates the list of users when a user disconnects from the server
    users = users.filter((user) => user.socketID !== socket.id)
    //Sends the list of users to the client
    io.emit('newUserResponse', users)
    socket.disconnect()
  })

  socket.on('newUser', (data) => {
    console.log(data)
    users.push(data)
    io.emit('newUserResponse', users)
    io.to(data.room).emit('user-connected', gameInfo)
  })

  socket.on('join', async (data) => {
    console.log(`User ${data.userName} joining ${data.room}`)
    // Need to register models every time a new connection is created
    if (!roomsdb.models['Room']) {
      roomsdb.model('Room', roomSchema)
    }

    await Room.findOne({ room: data.room })
      .then((room) => {
        if (room) {
          console.log('Room exists.')
          socket.join(data.room)
          socket.emit('gameResponse', room)
        } else {
          console.log('Room does not exist. Creating in db.')
          axios
            .get(`http://localhost:${PORT}/api/creategame`)
            .then((response) => {
              socket.join(data.room)
              const room = {
                ships: response.data.ships,
                board: response.data.board,
                room: data.room,
                winner: false,
                playerOneTurn: true,
              }
              Room.create(room)
              socket.emit('gameResponse', room)
            })
            .catch((err) => console.log(err))
        }
      })
      .catch((err) => res.status(500).json({ message: err.message }))
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

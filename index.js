const express = require('express')
const app = express()
const PORT = 3000
const http = require('http').Server(app)
const cors = require('cors')
const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

app.use(cors())

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

  socket.on('join', (data) => {
    console.log(`User ${data.userName} joining ${data.room}`)
    socket.join(data.room)
  })

  socket.on('message', (data) => {
    console.log(`user: ${data.name} , msg: ${data.text}, room: ${data.room}`)
    io.to(data.room).emit('messageResponse', data)
  })

  socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data))
})

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world',
  })
})

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})

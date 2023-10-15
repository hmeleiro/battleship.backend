const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

io.on('connection', (socket) => {
  socket.on('message', (message) => {
    io.emit('message', message)
  })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})

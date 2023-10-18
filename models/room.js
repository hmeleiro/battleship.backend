const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
  createdDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  room: {
    type: String,
    required: true,
  },
  ships: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  board: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  winner: {
    type: Boolean,
    required: true,
  },
  playerOneTurn: {
    type: Boolean,
    required: true,
  },
})

const Room = mongoose.model('Room', RoomSchema)

module.exports = {
  schema: RoomSchema,
  model: Room,
}

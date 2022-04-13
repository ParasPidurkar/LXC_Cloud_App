const config = require('getconfig')

const io = require('socket.io-client')

let socketURL
if (config.server.secure) {
  socketURL = `https://localhost:${config.server.port}`
} else {
  socketURL = `http://localhost:${config.server.port}`
}

const socketOptions = {
  transports: ['websocket'],
  'force new connection': true,
  secure: config.server.secure,

}

const client = io.connect(socketURL, socketOptions)

client.on('connect', () => {
  client.emit('create', '500', null)
  client.emit('message', { to: '501', payload: 'hello' })
})


client.on('remove', message => {
  console.log(`removed : ${JSON.stringify(message)}`)
})

client.on('joined', message => {
  console.log(`joined : ${JSON.stringify(message)}`)
})
client.on('presence', message => {
  console.log(`presence :${JSON.stringify(message)}`)
})


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}
  
  let rooms = ["500", "501", "502","503","700"]
  
  
  setInterval(() => {
    client.emit('message', {
      to: rooms[getRandomInt(rooms.length)],
      payload: 'hello'
    })
  }, 1000)

  client.on('message', message => {
    console.log(message)

  })
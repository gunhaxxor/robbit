const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const util = require("util");
const _ = require("lodash");
const ip = require("ip");

let PORT = 3000;
if (process.env.PORT) {
  PORT = process.env.PORT;
}

// middleware
io.use((socket, next) => {
  let name = socket.handshake.query.servername;
  let pwd = socket.handshake.query.serverpassword;
  if (name == process.env.TURN_USER && pwd == process.env.TURN_PASSWORD) {
    return next();
  }
  return next(new Error('authentication error'));
});

var users = [];

console.log("Startar social robot signaling server!");
console.log();
console.log(`If running this server locally set the following env vars to be used by ionic:`);
console.log(`SIGNALING_SERVER=http://${ip.address() + ':' + PORT}/`);
console.log();

app.get("/", function (req, res) {
  res.sendfile("index.html");
});

//we call this function immediately.
(() => {
  // console.log("promisifying io (socket.io instance) functions");
  // util.promisify(io.on);
})();

io.on("connection", function (socket) {
  console.log("socket connection established. id: " + socket.id);
  // if this socket is already logged in,
  // send a failed login message
  // if (_.findIndex(users, {socket: socket.id}) !== -1) {
  //   socket.emit("login_error", "You are already connected.");
  // }
  // socket.on("login", function(data) {
  //   // if this socket is already logged in,
  //   // send a failed login message
  //   if (
  //     _.findIndex(users, {
  //       socket: socket.id
  //     }) !== -1
  //   ) {
  //     socket.emit("login_error", "You are already connected.");
  //   }

  //   users.push({ id: data.id, socket: socket.id });
  //   console.log("socket with id " + socket.id + " logged in");
  // });

  (() => {
    console.log("promisifying the socket's functions");
    socket.join = util.promisify(socket.join);
    socket.leave = util.promisify(socket.leave);
  })();

  socket.on("join", data => {
    console.log(`socket ${socket.id} wants to join room ${data}`);
    let room = data;



    console.log('existing rooms: ', io.sockets.adapter.rooms);
    // prevent more than two clients in a room
    if (io.sockets.adapter.rooms[room] && Object.keys(io.sockets.adapter.rooms[room].sockets).length > 1) {
      console.log(`socket ${socket.id} couldn't join room ${room} since it was full`);
      socket.emit('errorMessage', 'that room seems to be full');

      return;
    }

    socket.join(room)
      .then(() => {
        console.log(`socket ${socket.id} is now joined to room ${data}`);
        console.log(`the connected socket has following rooms:`);
        console.log(socket.rooms);


        // Handle RTC signaling transparently. Just pass on the message to the other clients
        socket.on("signal", data => {
          console.log("received signaling message from socket " + socket.id);
          // console.log(data);
          console.log(`propagating signaling message to room: ${room}`);
          socket.to(room).emit("signal", data);
          // io.to(room).emit("signal", data);
        });

        // socket.on("sendMessage", function(message) {
        //   if (!message.peer_id) {
        //     console.log("no peer_id provided!!! Saay whaaaaaaa?!");
        //     return;
        //   }
        //   var peer_id = Number(message.peer_id);
        //   var contact = _.find(users, { id: peer_id });
        //   if (!contact) {
        //     console.log("no such peer found in the user list!");
        //     return;
        //   }
        //   console.log(
        //     "sending message of type " +
        //       message.type +
        //       " from " +
        //       message.id +
        //       " to " +
        //       message.peer_id
        //   );
        //   if (message.data) {
        //     console.log("data:" + JSON.stringify(message.data));
        //   }
        //   console.log("with socketId's: " + socket.id + ", " + contact.socket);
        //   io.to(contact.socket).emit("messageReceived", message);
        // });

        socket.on("robotControl", msg => {
          console.log(`propagating robotControl message to room: ${room}`);
          socket.to(room).emit("robotControl", msg);
          // io.to(room).emit("robotControl", msg);
          // console.log(msg);
        });


        // Send acknowledge that they joined the room
        roomMessage = {
          room: room,
          joined: true
        };
        socket.emit("room", roomMessage);
      })
      .catch((err) => console.log(`err: ${err}`));
  }) //on join end

  socket.on("leave", data => {
    socket.leave(data)
      .then(() => {
        console.log(`left room: ${data}`);
        socket.removeAllListeners("signal");
        socket.removeAllListeners("robotControl");
      })
      .catch(err => console.log(`error leaving room ${err}`));
  })

  socket.on("disconnect", () => {
    console.log("socket disconnected. id: " + socket.id);
    // _.remove(users, function(user) {
    //   return user.socket == socket.id;
    // });
  });
});

http.listen(PORT, function () {
  var host = http.address().address;
  var port = http.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
  // console.log('listening on *:' + PORT);
});

const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const Room = require("../room");

describe("my awesome project", () => {
  let io, serverSocket, clientSocket,room;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket3 = new Client(`http://localhost:${port}`);
      clientSocket4 = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        console.log("connected");
        serverSocket = socket;
      });
      clientSocket.on("connect", done);

      room = new Room("room",4,0,player_names=["player 1","player 2","player 3", "player 4"],connections=[clientSocket,clientSocket2,clientSocket3,clientSocket4]);
      room.game.setup(4,room.player_names);
      room.game.run();
      console.log(room.game);
    });
  });

  afterAll(() => {
    room.game.end = true;
    io.close();
    clientSocket.close();
  });

  test("just check if testing works in general", () => {
    expect("asd").toBe("asd");
    /*
    clientSocket.on("hello", (arg) => {
      expect(arg).toBe("world");
      done();
    });
    serverSocket.emit("hello", "world");
    */
  });
  test("check player names",()=>{
    expect(room.game.players.map(x=>x.name)).toEqual(["player 1","player 2","player 3", "player 4"]);
  })
/*>
  test("should work (with ack)", (done) => {
    serverSocket.on("hi", (cb) => {
      cb("hola");
    });
    clientSocket.emit("hi", (arg) => {
      expect(arg).toBe("hola");
      done();
    });
  });
  */
});
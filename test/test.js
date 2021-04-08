const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const Room = require("../room");
const GameClient = require("../gameclient");
const {waitFor} = require('../helper');

describe("my awesome project", () => {
  let io,clientSocket,room,server,clients;

  beforeAll((done) => {
    server = {rooms:[]};
    clients = [];
    const httpServer = createServer();
    io = new Server(httpServer);
    room = new Room("test_room",4,0,player_names=["player 1","player 2","player 3", "player 4"]);
    server.rooms.push(room);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket3 = new Client(`http://localhost:${port}`);
      clientSocket4 = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        let client = new GameClient(socket,io,server);
        client.setup("test_room");
        clients.push(client);
      });

      waitFor(x=>server.rooms[0].connections.every(function(i) { return i !== null; })).then(_ => {
        server.rooms[0].game.setup(server.rooms[0].player_limit,server.rooms[0].player_names);
        server.rooms[0].game.run();
        done();
    });
    });
  });

  afterAll(() => {
    clientSocket.close();
    clientSocket2.close();
    clientSocket3.close();
    clientSocket4.close();
    room.game.end = true;
    io.close();
  });

  test("just check if testing works in general", () => {
    expect("asd").toBe("asd");
  });
  test("check player names",()=>{
    expect(room.game.players.map(x=>x.name)).toEqual(["player 1","player 2","player 3", "player 4"]);
  })

  test("send_message", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      expect(room.game.chat).toEqual([]);
      clients[0].send_message("test");
      expect(room.game.chat).toEqual(["player 1: test"]);
      done();
    });
  });
});
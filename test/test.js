const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const Room = require("../room");
const socketServer = require("../socketServer");
const {waitFor} = require('../helper');

describe("my awesome project", () => {
  let io,clientSocket,room,server,clients;

  beforeAll((done) => {
    server = {rooms:[]};
    clients = [];
    const httpServer = createServer();
    io = new Server(httpServer);
    room = new Room("test_room",4,"",4,playerNames=["player 1","player 2","player 3", "player 4"],characters=["bart_cassidy","black_jack","calamity_janet","el_gringo"]);
    server.rooms.push(room);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket3 = new Client(`http://localhost:${port}`);
      clientSocket4 = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        let client = new socketServer(socket,io,server);
        client.setup("test_room");
        clients.push(client);
      });

      waitFor(x=>room.allPlayersConnected()).then(_ => {
        room.start();
        done();
    });
    });
  });

  afterAll(() => {
    clientSocket.close();
    clientSocket2.close();
    clientSocket3.close();
    clientSocket4.close();
    room.end = true;
    io.close();
  });

  test("just check if testing works in general", () => {
    expect("asd").toBe("asd");
  });
  test("check player names",()=>{
    expect(room.players.map(x=>x.name)).toEqual(["player 1","player 2","player 3", "player 4"]);
  })

  test("checkArrowsLeft", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      //check if arrowsLeft>0
      clients[0].curRoom.arrowsLeft = 4;
      clients[0].player.arrows = 5;
      clients[0].checkArrowsLeft();
      //sheriffs have +2 health
      if (clients[0].player.role==="sheriff"){
        expect(clients[0].player.life).toEqual(clients[0].player.character.life+2);
      } else {
        expect(clients[0].player.life).toEqual(clients[0].player.character.life);
      }
      expect(clients[0].player.arrows).toEqual(5);

      clients[0].curRoom.arrowsLeft = 0;
      clients[0].player.arrows = 1;
      clients[0].checkArrowsLeft();
      //sheriffs have +2 health
      if (clients[0].player.role==="sheriff"){
        expect(clients[0].player.life).toEqual(clients[0].player.character.life+1);
      } else {
        expect(clients[0].player.life).toEqual(clients[0].player.character.life-1);
      }
      expect(clients[0].player.arrows).toEqual(0);
      done();
    });
  });
  test("roll", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      expect(clients[0].player.curDices).toEqual([]);
      clients[0].roll();
      expect(clients[0].player.curDices.length).toEqual(5);
      //if player rolled an arrow or 3 dynamites, check if the effects work
      //if (clients[0].player.curDices)
      done();
    });
  });

  test("reroll", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      clients[0].roll();
      //if player rolled an arrow or 3 dynamites, check the effects at the initial roll
      clients[0].reroll(0);
      //check the reroll's effect
      done();
    });
  });

  test("sendMessage", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      clients[0].sendMessage("teszt");
      expect(clients[0].curRoom.chat[clients[0].curRoom.chat.length-1]).toEqual("player 1: teszt");
      done();
    });
  });

});
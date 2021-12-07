const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const Room = require("../room");
const SocketServer = require("../socketserver");
const {waitFor} = require('../helper');
const Dice = require("../dice");

describe("my awesome project", () => {
  let io,clientSocket,room,server,clients;

  beforeAll((done) => {
    server = {rooms:[]};
    clients = [];
    const httpServer = createServer();
    io = new Server(httpServer);
    room = new Room("test_room", 8, "", 8, playerNames=["player 1","player 2","player 3", "player 4", "player 5","player 6","player 7", "player 8"], characters=["el_gringo","jesse_jones","jourdonnais","suzy_lafayette","willy_the_kid","calamity_janet","rose_doolan","paul_regret"]);
    server.rooms.push(room);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket3 = new Client(`http://localhost:${port}`);
      clientSocket4 = new Client(`http://localhost:${port}`);
      clientSocket5 = new Client(`http://localhost:${port}`);
      clientSocket6 = new Client(`http://localhost:${port}`);
      clientSocket7 = new Client(`http://localhost:${port}`);
      clientSocket8 = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        let client = new SocketServer(socket,io,server);
        client.addSocket("test_room");
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

  test("check if tester runs", () => {
    expect("asd").toBe("asd");
  });
  test("check player names",()=>{
    expect(room.players.map(x=>x.name)).toEqual(["player 1","player 2","player 3", "player 4", "player 5","player 6","player 7", "player 8"]);
  })

  test("checkArrowsLeft", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      let life_before = clients[0].player.life;
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
      expect(clients[0].player.life).toEqual(life_before-1);
      expect(clients[0].player.arrows).toEqual(0);
      done();
    });
  });
  test("roll", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      expect(clients[0].player.curDices).toEqual([]);
      clients[0].roll([0,1,2,3,4]);
      //check number of rolled dices
      expect(clients[0].player.curDices.length).toEqual(5);
      //check dice types
      expect(clients[0].player.curDices.map(x=>x.type)).toEqual([0,1,2,3,4]);
      //player rolled an arrow, check if arrow was received
      expect(clients[0].player.arrows).toEqual(1);
      done();
    });
  });

  test("reroll", (done) => {
    waitFor(x=>clients[0].player).then(x=>{
      let life_before = clients[0].player.life;
      clients[0].roll([0,1,2,3,4]);
      //if player rolled an arrow or 3 dynamites, check the effects at the initial roll
      clients[0].reroll(2,1);
      clients[0].reroll(3,1);
      expect(clients[0].player.curDices.map(x=>x.type)).toEqual([0,1,1,1,4]);
      expect(clients[0].player.life).toEqual(life_before-1);
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

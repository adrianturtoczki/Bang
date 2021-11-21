'use strict';

const Room = require('./room');
const Dice = require('./dice');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const config = require('./config.js');
const path = require('path');
const CircularJSON = require('circular-json');
const SocketServer = require('./socketserver');

class ExpressServer{
  constructor(){
    let router = express.Router();
    app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.urlencoded({
      extended: true
    }))
    app.use(express.json());

    this.clients = [];
    this.rooms = [];
    this.http = http;
    this.io = io;
    
    router.get('/', (req, res) => {
      console.log('/');
      res.sendFile(path.join(__dirname + '/public/lobby.html'));
    });
    
    router.get('/rooms', (req, res) => {
      res.send(CircularJSON.stringify(this.rooms));
    });
    
    router.get('/game', (req, res) => {
      console.log("/game");
      let room = this.rooms.find(x => x.name === req.query.room);
      if (!room.started){
        res.sendFile(path.join(__dirname + '/public/game.html'));
      } else {
        res.sendFile(path.join(__dirname + '/public/lobby.html'));
      }
    });
    
    router.post('/join_room', (req, res) => {
      console.log('/join_room');
      let room = this.rooms.find(x=>x.name==req.body.roomName);
      //checks if name already in room
      if (room.playerNames.includes(req.body.playerName)){
        console.log("error: name already in room!");
        res.send({"message":"name_already_in_room"});
      } else if (room.password!=req.body.password) {
        console.log("error: bad password!");
        res.send({"message":"bad_password"});
      } else {
        room.addPlayer(req.body.playerName);
        res.send({"message":"ok"});
      }
    });
    
    router.post('/create_room', (req, res) => {
      console.log('/create_room');
      if (this.rooms.find(x=>x.name===req.body.roomName)){
        res.send({"message":"room_already_exists"});
      } else {
        let new_room = new Room(req.body.roomName,parseInt(req.body.playerLimit),req.body.password);
        new_room.addPlayer(req.body.playerName);
        this.rooms.push(new_room);
        
        res.send({"message":"ok"});
      }
    });
    
    app.use(config.baseUrl,router);
    http.listen(config.port, () => console.log('server started'));

    io.on('connection', (socket) => {
      let client = new SocketServer(socket,io,this);
    });
  }
}

new ExpressServer();
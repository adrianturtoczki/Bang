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
const socketServer = require('./socketServer');

class expressServer{
  constructor(){
    var router = express.Router();
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
      let room = this.rooms.find(x=>x.name==req.query.room);
      //console.log(room.game);
      if (room.started==false){
        res.sendFile(path.join(__dirname + '/public/game.html'));
      } else {
        res.sendFile(path.join(__dirname + '/public/lobby.html'));
      }
    });
    
    router.post('/join_room', (req, res) => {
      console.log('/join_room');
      let room = this.rooms.find(x=>x.name==req.body.roomName);
      //checks if name already in room
      //console.log(req.body.playerName,room.playerNames);
      if (room.playerNames.includes(req.body.playerName)){
        console.log("error: name already in room!",req.body.playerName,room.playerNames);
        res.send({"accepted":"false"}); //todo fix
      } else if (room.password!=req.body.password) {
        console.log("error: bad password!",req.body.password,room.password);
        res.send({"accepted":"false"}); //todo fix
      } else {
        room.addPlayer(req.body.playerName);
        res.send({"accepted":"true"});
      }
    });
    
    router.post('/create_room', (req, res) => {
      console.log('/create_room');
      if (this.rooms.find(x=>x.name===req.body.roomName)){
        //todo popup room already exists?
        res.redirect('/');
      } else {
        let new_room = new Room(req.body.roomName,parseInt(req.body.playerLimit),req.body.password);
        new_room.addPlayer(req.body.playerName);
        this.rooms.push(new_room);
        
        res.redirect('/game?room='+req.body.roomName);
      }
    });
    
    app.use(config.baseUrl,router);
    http.listen(config.port, () => console.log('server started'));

    io.on('connection', (socket) => {
      let client = new socketServer(socket,io,this);
    });
  }
}

let server = new expressServer();
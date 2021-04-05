'use strict';

const Game = require('./game');
const Room = require('./room');
const Dice = require('./dice');
const {waitFor} = require('./helper')
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const config = require('./config.js');
const path = require('path');
const CircularJSON = require('circular-json');
const GameClient = require('./gameclient');

class GameServer{
  constructor(){
    var router = express.Router();
    app.use(express.static('public'));
    app.use(express.urlencoded({
      extended: true
    }))
    app.use(express.json());
    
    this.rooms = [];
    
    router.get('/', (req, res) => {
      console.log('/');
      res.sendFile(path.join(__dirname + '/public/setup.html'));
    });
    
    router.get('/rooms', (req, res) => {
      res.send(CircularJSON.stringify(this.rooms));
    });
    
    router.get('/game', (req, res) => {
      console.log("/game");
      let room = this.rooms.find(x=>x.name==req.query.room);
      console.log(room.game);
      if (room.game.started==false){
        res.sendFile(path.join(__dirname + '/public/game.html'));
      } else {
        res.sendFile(path.join(__dirname + '/public/setup.html'));
      }
    });
    
    router.post('/join_room', (req, res) => {
      console.log('/join_room');
      let room = this.rooms.find(x=>x.name==req.body.room_name);
      //checks if name already in room
      console.log(req.body.player_name,room.player_names);
      if (room.player_names.includes(req.body.player_name)){
        console.log("error: name already in room!",req.body.player_name,room.player_names);
        res.send({"accepted":"false"}); //todo fix
      } else {
        if (room.player_names.length<room.player_limit){
          room.player_names.push(req.body.player_name);
          room.players_left--;
        }
        res.send({"accepted":"true"});
      }
    });
    
    router.post('/create_room', (req, res) => {
      //console.log(req.body);
      if (this.rooms.find(x=>x.name===req.body.room_name)){
        //todo popup room already exists?
        res.redirect('/');
      } else {
        let new_room = new Room(req.body.room_name,parseInt(req.body.player_limit),parseInt(req.body.player_limit-1));
        this.rooms.push(new_room);
        new_room.player_names.push(req.body.player_name);
        new_room.connections = new Array(new_room.player_limit).fill(null);
      
        //waits for all players to connect then starts the game
        waitFor(x=>new_room.connections.every(function(i) { return i !== null; })).then(x=>{
          console.log("game started");
          console.log(new_room);
          console.log(this.rooms[this.rooms.length-1].player_names);
          new_room.game.setup(new_room.player_limit,new_room.player_names);
          new_room.game.run();
        });
        res.redirect('/game?room='+req.body.room_name);
      }
    });
    
    app.use(config.baseUrl,router);
    http.listen(config.port, () => console.log('server started'));

    io.on('connection', (socket) => {
      console.log(this);
      let client = new GameClient(socket,io,this);
  
    });
  }
}

let server = new GameServer();
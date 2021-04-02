'use strict';

const Game = require('./game');
const Room = require('./room');
const Dice = require('./dice');
const Helper = require('./helper')
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const config = require('./config.js');
const path = require('path');
const CircularJSON = require('circular-json');

var router = express.Router();
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: true
}))
app.use(express.json());

let rooms = [];

router.get('/', (req, res) => {
  console.log('/');
  res.sendFile(path.join(__dirname + '/public/setup.html'));
});

router.get('/rooms', (req, res) => {
  res.send(CircularJSON.stringify(rooms));
});

router.get('/game', (req, res) => {
  console.log("/game");
  let room = rooms.find(x=>x.name==req.query.room);
  console.log(room.game);
  if (room.game.started==false){
    res.sendFile(path.join(__dirname + '/public/game.html'));
  } else {
    res.sendFile(path.join(__dirname + '/public/setup.html'));
  }
});

router.post('/join_room', (req, res) => {
  console.log('/join_room');
  let room = rooms.find(x=>x.name==req.body.room_name);
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
  if (rooms.find(x=>x.name===req.body.room_name)){
    //todo popup room already exists?
    res.redirect('/');
  } else {
    let new_room = new Room(req.body.room_name,parseInt(req.body.player_limit),parseInt(req.body.player_limit-1));
    rooms.push(new_room);
    new_room.player_names.push(req.body.player_name);
    new_room.connections = new Array(new_room.player_limit).fill(null);
  
    //waits for all players to connect then starts the game
    Helper.waitFor(x=>new_room.connections.every(function(i) { return i !== null; })).then(x=>{
      console.log("game started");
      console.log(new_room);
      console.log(rooms[rooms.length-1].player_names);
      new_room.game.setup(new_room.player_limit,new_room.player_names);
      new_room.game.run();
    });
    res.redirect('/game?room='+req.body.room_name);
  }
});

app.use(config.baseUrl,router);
http.listen(config.port, () => console.log('server started'));

io.on('connection', (socket) => {

  socket.on('setup',setup);
  socket.on('end_turn', end_turn);
  socket.on('roll', roll);
  socket.on('reroll', reroll);
  socket.on('send_message', send_message); //public, maybe implement private later
  socket.on('disconnect', disconnect);

  let cur_room;
  let playerIndex = -1;
  let player;
  let player_role;

  Helper.waitFor(x=>cur_room&&cur_room.game.started).then(x=>{
    player = cur_room.game.players[playerIndex];
    player.index = playerIndex;
    player_role = cur_room.game.roles[playerIndex];
    console.log(player.name+' connected');
    io.to(cur_room.name).emit('current_turn',cur_room.game.players[cur_room.game.turn_count].name);
    console.log("playerindex:",playerIndex,player.index);
    socket.emit('players_data_setup',[cur_room.game.players,playerIndex,player_role,cur_room.game.arrows_left]);
    
  });

  function setup(room_name){
    console.log(rooms);
    console.log(rooms.find(x=>x.name===room_name));
    cur_room = rooms.find(x=>x.name===room_name);
    socket.join(cur_room.name);

    //todo check if playerindex always player.index
    for (let i in cur_room.connections){
      if (cur_room.connections[i] === null){
        playerIndex = parseInt(i);
        break;
      }
    }
    if (playerIndex == -1) return
    cur_room.connections[playerIndex] = socket;
  }

  // ending a turn
  function end_turn(selections){
    let alive_players = cur_room.game.players.filter(x=>x.life>0);

    //resolving
    console.log('resolving '+player.name+"'s turn ..");

    //character check: suzy lafayette
    if (player.name==='suzy_lafayette'&&selections.filter(x=>x[0]===2||x[0]===3).length === 0){
      player.life+=2;
    }
    //character check: el gringo
    if (selections.some(x=>(x!=0&&x!=1&&x!=3&&x!=4&&x!=5)&&(x[0]===2||x[0]===3)&&cur_room.game.players[x[1]].character.name==='el_gringo')){
        player.arrows++;
        cur_room.game.arrows_left--;
        check_arrows_left();
    }

    for (let s of selections){
      if (s!=null){
        console.log("resolving " +s+ " ..");
        let dice_type = s[0];
        let selected_player = cur_room.game.players[s[1]];
        console.log(dice_type,selected_player);
        if (dice_type===2||dice_type===3){
          selected_player.life--;
        } else if (dice_type===4&&selected_player.life<selected_player.starting_life){
          //character check: jesse jones
          if (selected_player.name==='jesse_jones'&&selected_player===player&&selected_player.life<=4){
            selected_player.life+=2;
          } else {
            selected_player.life++;
          }
        }
      }
    }

    let gatling_dices = selections.filter(x=>x===5);
    //character check: willy the kid
    console.log("teszt: "+gatling_dices.length+" : "+player.character.name);
    if (gatling_dices.length>=3||(gatling_dices.length===2&&player.character.name==='willy_the_kid')){
      cur_room.game.arrows_left+=player.arrows;
      player.arrows = 0;
      for (let p of alive_players){
        //character check: paul regret
        if (p!=player&&p.character.name!='paul_regret'){
          p.life--;
        }
      }
    }

    let killed_players = alive_players.filter(x=>x.life<=0) //return killed player's arrows back
    for (let p of killed_players){
     cur_room.game.arrows_left+=p.arrows;
     p.arrows = 0;
     p.life = 0;
     p.role = cur_room.game.roles[p.index];
    }

    let winner = cur_room.game.check_win_conditions(cur_room.player_limit)
    console.log(winner);
    if (winner){
      io.to(cur_room.name).emit('game_end',winner);
      rooms.splice(rooms.indexOf(cur_room),1);
    }

    //ending turn
    console.log(player.name+"'s turn ended");
    if (player.cur_turn){
      player.turn_end = true;
    }
    

    setTimeout(() => { //TODO: not ideal, would be better without timeout
      console.log("ending turn .. ");
      io.to(cur_room.name).emit('players_data_refresh',[cur_room.game.players,cur_room.game.arrows_left,cur_room.game.players.alive,cur_room.game.log]);
      io.to(cur_room.name).emit('current_turn',cur_room.game.players[cur_room.game.turn_count].name);
   }, 500);
  }

  //check if no arrows are left
  function check_arrows_left(){
    if (cur_room.game.arrows_left<=0){
      for (let p of cur_room.game.players){
        //character check: jourdonnais
        if (p.character.name!='jourdonnais'){
          p.life-=p.arrows;
        } else {
          p.life--;
        }
        p.arrows = 0;
      }
      cur_room.game.arrows_left = 9;
    }
  }

  //dice roll
  function roll(){
    if (player.rolled===false){

      let roll_results = [];
      for (let i = 0; i < 5; i++){
        let cur_dice = new Dice(player.roll(),i)
        roll_results.push(cur_dice);
        if (cur_dice.type === 0 ||cur_dice.type === 1 || cur_dice.type === 5){ //add all to selections except bullet1,2
          player.selections[i] = cur_dice.type;
          } else {
            player.selections[i] = null;
          }
      }

      let dynamite_dices = roll_results.filter(x=>x.type===1);
      for (let d of roll_results){

        if (d.type===0){
          player.arrows++;
          cur_room.game.arrows_left--;
  
          check_arrows_left();
        }
        else if (d.type==1){
          d.rerolls_left = 0;
        }
      }
      if (dynamite_dices.length>=3){
        player.life--;
        dynamite_dices.forEach(x=>x.ability_activated = true);
        roll_results.forEach(x=>x.rerolls_left = 0);
      }

      player.rolled = true;
      console.log(player.name + ' rolled: '+ roll_results.map(x=>x.type));
      cur_room.game.log.push(player.name + ' rolled: '+ roll_results.map(x=>x.type));

      player.cur_dices = roll_results;

      socket.emit('roll_results',[player.cur_dices,player.selections]);

      io.to(cur_room.name).emit('players_data_refresh',[cur_room.game.players,cur_room.game.arrows_left,cur_room.game.players_alive,cur_room.game.log]);

    }
  }

  function reroll(rerolled_dice_index){
    let rerolled_dice = player.cur_dices[rerolled_dice_index];

    rerolled_dice.type = player.roll();
    console.log(player.name + ' rerolled: '+ rerolled_dice.type);
    cur_room.game.log.push(player.name + ' rerolled: '+ rerolled_dice.type);

    if (rerolled_dice.type === 0 || rerolled_dice.type === 1 ||rerolled_dice.type === 5){
      player.selections[rerolled_dice_index] = rerolled_dice.type;
    } else {
      player.selections[rerolled_dice_index] = null;
    }

    rerolled_dice.rerolls_left--;

    let dynamite_dices = player.cur_dices.filter(x=>x.type===1&&x.ability_activated === false);

    if (rerolled_dice.type===0){
      cur_room.game.log.push(player.name+' gets an arrow.');
      player.arrows++;
      cur_room.game.arrows_left--;

      check_arrows_left();
    }
    else if (rerolled_dice.type==1){
      rerolled_dice.rerolls_left = 0;
    }

    if (dynamite_dices.length>=3){
      cur_room.game.log.push(player.name + ' rolled 3 dynamites.');
      player.life--;
      dynamite_dices.forEach(x=>x.ability_activated = true);
      player.cur_dices.forEach(x=>x.rerolls_left = 0);
    }

    socket.emit('roll_results',[player.cur_dices,player.selections]);

    io.to(cur_room.name).emit('players_data_refresh',[cur_room.game.players,cur_room.game.arrows_left,cur_room.game.players_alive,cur_room.game.log]);

  }

  function send_message(m){
    console.log(player+" sent message: "+m);
    cur_room.game.chat.push(player.name+": "+m);
    io.to(cur_room.name).emit('update_chat',cur_room.game.chat);
  }

  //disconnect
  function disconnect(socket){
    cur_room.connections[playerIndex] = null;
    io.to(cur_room.name).emit("a_player_disconnected");
    if (rooms.indexOf(cur_room)!=-1){
      rooms.splice(rooms.indexOf(cur_room),1);
    }
  }
});
'use strict';

const Game = require('./game');

const game = new Game();

let player_limit = 4; //limits number of players to 4 for now

const Dice = require('./dice');


//let player_names = []; //todo: delete comment when finished, debug
let player_names = ["Player 1","Player 2","Player 3","Player 4","Player 5","Player 6","Player 7","Player 8"].slice(0,player_limit);

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const config = require('./config.js');
const path = require('path');

app.use(express.static('public'));
var router = express.Router();
router.get('/', (req, res) => {
  console.log('/');
  res.sendFile(path.join(__dirname + '/public/setup.html'));
});
router.post('/game', (req, res) => {
  console.log('/game');
  console.log(req.body);
  if (player_names.length<player_limit){
    player_names.push(req.body.player_name);
  }
  res.sendFile(path.join(__dirname + '/public/game.html'));
});

//todo remove, for debug
router.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/game.html'));
});

app.use(config.baseUrl,router);
app.use(express.urlencoded({
  extended: true
}))

http.listen(8080, () => console.log('server started'));

console.log(__dirname);
  
function waitFor(conditionFunction) {

  const poll = resolve => {
    if(conditionFunction()) resolve();
    else setTimeout(_ => poll(resolve), 500);
  }

  return new Promise(poll);
}

//starting the game
waitFor(x=>player_names.length===player_limit).then(x=>{
  console.log("game started");
  console.log(player_names);
  game.setup(player_limit,player_names);
  game.run();
});

const connections = new Array(player_limit).fill(null);

io.on('connection', (socket) => {

  console.log("connected!");
  //setup
  let playerIndex = -1;
  for (let i in connections){
    if (connections[i] === null){
      playerIndex = parseInt(i);
      break;
    }
  }
  if (playerIndex == -1) return

  connections[playerIndex] = socket;

  let player;

  waitFor(x=>player_names.length===player_limit).then(x=>{
    player = game.players[playerIndex];
    player.index = playerIndex;
    console.log(player.name+' connected');
    io.sockets.emit('current_turn',game.players[game.turn_count].name);
    socket.emit('players_data_setup',[game.players,playerIndex,game.arrows_left]);//todo: hide other players' role
  
  });

  //hides game until all players are connected
  if (connections.every(function(i) { return i !== null; })){
    console.log("All players connected!");
    io.sockets.emit("all_players_connected",game.players);
  }

  // ending a turn
  socket.on('end_turn', (selections) => {

    //resolving
    console.log('resolving '+player.name+"'s turn ..");
    for (let s of selections){
      if (s!=null){
        console.log("resolving " +s+ " ..");
        let dice_type = s[0];
        let selected_player = game.players[s[1]];
        console.log(dice_type,selected_player);
        if (dice_type===2||dice_type===3){
          selected_player.life--;
        } else if (dice_type===4&&selected_player.life<selected_player.starting_life){
          selected_player.life++;
        }
      }
    }
    let gatling_dices = selections.filter(x=>x===5);
    if (gatling_dices.length>=3){
      game.arrows_left+=player.arrows;
      player.arrows = 0;
      for (let p of game.players){
        if (p!=player){
          console.log("other players:",p);
          p.life--;
        }
      }
    }

    let winner = game.check_win_conditions(player_limit)
    console.log(winner);
    if (winner){
      io.sockets.emit('game_end',winner);
    }

    //ending turn
    console.log(player.name+"'s turn ended");
    if (player.cur_turn){
      player.turn_end = true;
    }
    console.log([game.players,game.turn_count]);
    

    setTimeout(() => { //TODO: not ideal, would be better without timeout
      console.log("ending turn .. ");
      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players.alive]); //todo: hide other players' role
      io.sockets.emit('current_turn',game.players[game.turn_count].name);
   }, 500);
  });

  //check if no arrows are left
  function check_arrows(){
    if (game.arrows_left<=0){
      for (let p of game.players){
        p.arrows = 0;
        p.life--;
      }
      game.arrows_left = 9;
    }
  }

  //dice roll
  socket.on('roll', () => {
    console.log(player.name + ' rolled');
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
        switch(d.type){
          case 0:
            player.arrows++;
            game.arrows_left--;

            check_arrows();

            break;
          case 1:
            d.rerolls_left = 0;
            break;
        }
      }
      if (dynamite_dices.length>=3){
        player.life--;
        dynamite_dices.forEach(x=>x.ability_activated = true);
        roll_results.forEach(x=>x.rerolls_left = 0);
      }

      player.rolled = true;

      player.cur_dices = roll_results;

      socket.emit('roll_results',[player.cur_dices,player.selections]);

      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);//todo: hide other players' role

    }
  });

  socket.on('reroll', (rerolled_dice_index) => {
    console.log(player.name + ' rerolled');

    let rerolled_dice = player.cur_dices[rerolled_dice_index];

      rerolled_dice.type = player.roll();

      if (rerolled_dice.type === 0 || rerolled_dice.type === 1 ||rerolled_dice.type === 5){
        player.selections[rerolled_dice_index] = rerolled_dice.type;
      } else {
        player.selections[rerolled_dice_index] = null;
      }

      rerolled_dice.rerolls_left--;

      let dynamite_dices = player.cur_dices.filter(x=>x.type===1&&x.ability_activated === false);

      if (rerolled_dice.type===0){
        player.arrows++;
        game.arrows_left--;

        check_arrows();
      }
      else if (rerolled_dice.type==1){
        rerolled_dice.rerolls_left = 0;
      }

      if (dynamite_dices.length>=3){
        player.life--;
        dynamite_dices.forEach(x=>x.ability_activated = true);
        player.cur_dices.forEach(x=>x.rerolls_left = 0);
      }

      socket.emit('roll_results',[player.cur_dices,player.selections]);

      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);//todo: hide other players' role

  });


  //disconnect
  socket.on('disconnect', (socket) => {
    //console.log(player.name + ' disconnected');
    connections[playerIndex] = null;
    io.sockets.emit("a_player_disconnected");
  });


});
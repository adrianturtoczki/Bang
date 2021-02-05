'use strict';

const Game = require('./game');

const game = new Game();

let player_limit = 4; //limits number of players to 4 for now

const Dice = require('./dice');

let test_names = ["Player 1","Player 2","Player 3","Player 4","Player 5","Player 6","Player 7","Player 8"];

game.setup(player_limit,test_names.slice(0,player_limit));

const express = require('express');
const { DH_UNABLE_TO_CHECK_GENERATOR } = require('constants');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

http.listen(3000, () => console.log('server started'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });
  
const connections = new Array(player_limit).fill(null);

io.on('connection', (socket) => {

  //setup
  let playerIndex = -1;
  for (let i in connections){
    if (connections[i] === null){
      playerIndex = parseInt(i);
      break;
    }
  }
  if (playerIndex == -1) return

  let player = game.players[playerIndex];
  player.index = playerIndex;
  console.log(player.name+' connected');

  io.sockets.emit('current_turn',[game.players[game.turn_count].name]);
  socket.emit('players_data_setup',[game.players,playerIndex,game.arrows_left]);//todo: hide other players' role
  connections[playerIndex] = socket;

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
  
        switch(dice_type){ //dice behavior
          //arrow1
          case 2:
            selected_player.life--;
            break;
          //arrow2
          case 3:
            selected_player.life--;
            break;
          //beer
          case 4:
            if (selected_player.life<=selected_player.starting_life){
              selected_player.life++;
            }
            break;
              
        }
      }
    }

    console.log(game.check_win_conditions(player_limit));

    //ending turn
    console.log(player.name+"'s turn ended");
    if (player.cur_turn){
      player.turn_end = true;
    }
    console.log([game.players,game.turn_count]);
    

    setTimeout(() => { //TODO: not ideal, would be better without timeout
      console.log("ending turn .. ");
      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players.alive]); //todo: hide other players' role
      io.sockets.emit('current_turn',game.players[game.turn_count]);
   }, 500);
  });

  //dice roll
  socket.on('roll', () => {
    console.log(player.name + ' rolled');
    if (player.rolled===false){

      let roll_results = [];
      for (let i = 0; i < 5; i++){
          roll_results.push(new Dice(player.roll(),i));
      }

      let dynamite_dices = roll_results.filter(x=>x.type===1);
      let gatling_dices = roll_results.filter(x=>x.type===5);
      for (let d of roll_results){
        switch(d.type){
          case 0:
            player.arrows++;
            game.arrows_left--;

            //check if no arrows are left
            if (game.arrows_left<=0){
              for (let p of game.players){
                p.arrows = 0;
                p.life--;
              }
              game.arrows_left = 9;
            }

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
      if (gatling_dices.length>=3){
        game.arrows_left+=player.arrows;
        player.arrows = 0;
        for (let p of game.players){
          if (p!=player){
            console.log("other players:",p);
            p.life--;
          }
        }
        gatling_dices.forEach(x=>x.ability_activated = true);
      }

      player.rolled = true;

      player.cur_dices = roll_results;

      socket.emit('roll_results',player.cur_dices);

      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);//todo: hide other players' role

    }
  });

  socket.on('reroll', (rerolled_dice_index) => {
    console.log(player.name + ' rerolled');

    let rerolled_dice = player.cur_dices[rerolled_dice_index];

      rerolled_dice.type = player.roll();

      rerolled_dice.rerolls_left--;

      let dynamite_dices = player.cur_dices.filter(x=>x.type===1&&x.ability_activated === false);
      let gatling_dices = player.cur_dices.filter(x=>x.type===5&&x.ability_activated === false);

      if (rerolled_dice.type===0){
        player.arrows++;
        game.arrows_left--;

        //check if no arrows are left
        if (game.arrows_left<=0){
          for (let p of game.players){
            p.arrows = 0;
            p.life--;
          }
          game.arrows_left = 9;
        }
      }
      else if (rerolled_dice.type==1){
        rerolled_dice.rerolls_left = 0;
      }

      if (dynamite_dices.length>=3){
        player.life--;
        dynamite_dices.forEach(x=>x.ability_activated = true);
        player.cur_dices.forEach(x=>x.rerolls_left = 0);
      }
      if (gatling_dices.length>=3){
        game.arrows_left+=player.arrows;
        player.arrows = 0;
        for (let p of game.players){
          if (p!=player){
            console.log("other players:",p);
            p.life--;
          }
        }
        gatling_dices.forEach(x=>x.ability_activated = true);
      }

      socket.emit('roll_results',player.cur_dices);

      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);//todo: hide other players' role

  });


  //disconnect
  socket.on('disconnect', (socket) => {
    console.log(player.name + ' disconnected');
    connections[playerIndex] = null;
    io.sockets.emit("a_player_disconnected");
  });


});

//starting the game
game.run();
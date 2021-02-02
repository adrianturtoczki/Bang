'use strict';

const gameClass = require('./game');

const game = new gameClass();

let playerLimit = 4; //limits number of players to 4 for now

game.setup(playerLimit);

const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

http.listen(3000, () => console.log('server started'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });
  
const connections = new Array(playerLimit).fill(null);

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

  io.sockets.emit('turn_and_round',[game.players[game.turn_count].name,game.round_count]);
  socket.emit('players_data_setup',[game.players,playerIndex,game.arrows_left]);
  connections[playerIndex] = socket;

  //hides game until all players are connected
  if (connections.every(function(i) { return i !== null; })){
    console.log("All players connected!");
    io.sockets.emit("all_players_connected",game.players);
  }

  //resolving dices
  socket.on('resolve', (selections) => {

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

    console.log(game.check_win_conditions(playerLimit));

    io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);
  });

  // ending a turn
  socket.on('end_turn', () => {

    console.log(player.name+"'s turn ended");
    if (player.cur_turn){
      player.turn_end = true;
    }
    console.log([game.players,game.turn_count]);
    

    setTimeout(() => { //TODO: not ideal, would be better without timeout
      console.log("ending turn .. ");
      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players.alive]); 
      io.sockets.emit('turn_and_round',[game.players[game.turn_count].name,game.round_count]);
   }, 500);
  });

  //dice rolls
  socket.on('roll', () => {
    console.log(player.name + ' rolled');
    if (player.roll_num>0){

      let roll_results = [];
      for (let i = 0; i < 5; i++){
          roll_results.push(player.roll());
      }

      let dynamite_count = 0;
      let gatling_count = 0;
      for (let d of roll_results){
        switch(d){
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
            dynamite_count++;
            break;
          case 5:
            gatling_count++;
            break;
        }
      }
      if (dynamite_count>=3){
        player.roll_num = 0;
        player.life--;
      } else {
        player.roll_num--;
      }
      if (gatling_count>=3){
        game.arrows_left+=player.arrows;
        player.arrows = 0;
        for (let p of game.players){
          if (p!=player){
            console.log("other players:",p);
            p.life--;
          }
        }
      }

      socket.emit('roll_results',roll_results);

      io.sockets.emit('players_data_refresh',[game.players,game.arrows_left,game.players_alive]);

    }
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
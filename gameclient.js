const {waitFor} = require('./helper');
const Game = require('./game');
const Room = require('./room');
const Dice = require('./dice');

class GameClient{
    constructor(socket,io,server){
        this.socket = socket;
        this.io = io;
        this.server = server;
        this.cur_room;
        this.playerIndex = -1;
        this.player;
        this.player_role;

        this.setup = this.setup.bind(this);
        this.end_turn = this.end_turn.bind(this);
        this.roll = this.roll.bind(this);
        this.reroll = this.reroll.bind(this);
        this.send_message = this.send_message.bind(this);
        this.disconnect = this.disconnect.bind(this);

        this.socket.on('setup',this.setup);
        this.socket.on('end_turn', this.end_turn);
        this.socket.on('roll', this.roll);
        this.socket.on('reroll', this.reroll);
        this.socket.on('send_message', this.send_message); //public, maybe implement private later
        this.socket.on('disconnect', this.disconnect);

        waitFor(x=>this.cur_room&&this.cur_room.game.started).then(x=>{
            this.setup_all_connected();
          });
    }
    setup(room_name){
        //console.log("setup "+room_name);
        this.cur_room = this.server.rooms.find(x=>x.name===room_name);
        this.socket.join(this.cur_room.name);
    
        //todo check if playerIndex always player.index
        for (let i in this.cur_room.connections){
          if (this.cur_room.connections[i] === null){
            this.playerIndex = parseInt(i);
            break;
          }
        }
        if (this.playerIndex == -1) return
        this.cur_room.connections[this.playerIndex] = this.socket;
      }

    setup_all_connected(){
      //console.log("setup_all_connected");
      this.player = this.cur_room.game.players[this.playerIndex];
      this.player.index = this.playerIndex;
      this.player_role = this.cur_room.game.roles[this.playerIndex];
      //console.log(this.player.name+' connected');
      this.io.to(this.cur_room.name).emit('current_turn',this.cur_room.game.players[this.cur_room.game.turn_count].name);
      //console.log("playerIndex:",this.playerIndex,this.player.index);
      //console.log("player_role:",this.player_role);
      //console.log(this.cur_room.game.players,this.playerIndex);
      this.socket.emit('players_data_setup',[this.cur_room.game.players,this.playerIndex,this.player_role,this.cur_room.game.arrows_left]);
    }
    
    // ending a turn
    end_turn(selections){
      let alive_players = this.cur_room.game.players.filter(x=>x.life>0);
  
      //resolving
      //console.log('resolving '+this.player.name+"'s turn ..");
  
      //character check: suzy lafayette
      if (this.player.name==='suzy_lafayette'&&selections.filter(x=>x[0]===2||x[0]===3).length === 0){
        this.player.life+=2;
      }
      //character check: el gringo
      if (selections.some(x=>(x!=0&&x!=1&&x!=3&&x!=4&&x!=5)&&(x[0]===2||x[0]===3)&&this.cur_room.game.players[x[1]].character.name==='el_gringo')){
          this.player.arrows++;
          this.cur_room.game.arrows_left--;
          this.check_arrows_left();
      }
  
      for (let s of selections){
        if (s!=null){
          //console.log("resolving " +s+ " ..");
          let dice_type = s[0];
          let selected_player = this.cur_room.game.players[s[1]];
          //console.log(dice_type,selected_player);
          if (dice_type===2||dice_type===3){
            selected_player.life--;
          } else if (dice_type===4&&selected_player.life<selected_player.starting_life){
            //character check: jesse jones
            if (selected_player.name==='jesse_jones'&&selected_player===this.player&&selected_player.life<=4){
              selected_player.life+=2;
            } else {
              selected_player.life++;
            }
          }
        }
      }
  
      let gatling_dices = selections.filter(x=>x===5);
      //character check: willy the kid
      //console.log("teszt: "+gatling_dices.length+" : "+this.player.character.name);
      if (gatling_dices.length>=3||(gatling_dices.length===2&&this.player.character.name==='willy_the_kid')){
        this.cur_room.game.arrows_left+=this.player.arrows;
        this.player.arrows = 0;
        for (let p of alive_players){
          //character check: paul regret
          if (p!=this.player&&p.character.name!='paul_regret'){
            p.life--;
          }
        }
      }
  
      let killed_players = alive_players.filter(x=>x.life<=0) //return killed this.player's arrows back
      for (let p of killed_players){
        this.cur_room.game.arrows_left+=p.arrows;
        p.arrows = 0;
        p.life = 0;
        p.role = this.cur_room.game.roles[p.index];
      }
  
      let winner = this.cur_room.game.check_win_conditions(this.cur_room.player_limit)
      console.log(winner);
      if (winner){
        this.io.to(this.cur_room.name).emit('game_end',winner);
        this.server.rooms.splice(this.server.rooms.indexOf(this.cur_room),1);
      }
  
      //ending turn
      console.log(this.player.name+"'s turn ended");
      if (this.player.cur_turn){
        this.player.turn_end = true;
      }
      
  
      setTimeout(() => { //TODO: not ideal, would be better without timeout
        console.log("ending turn .. ");
        this.io.to(this.cur_room.name).emit('players_data_refresh',[this.cur_room.game.players,this.cur_room.game.arrows_left,this.cur_room.game.players.alive,this.cur_room.game.log]);
        this.io.to(this.cur_room.name).emit('current_turn',this.cur_room.game.players[this.cur_room.game.turn_count].name);
      }, 500);
    }
    
    //check if no arrows are left
    check_arrows_left(){
      if (this.cur_room.game.arrows_left<=0){
        for (let p of this.cur_room.game.players){
          //character check: jourdonnais
          if (p.character.name!='jourdonnais'){
            p.life-=p.arrows;
          } else {
            p.life--;
          }
          p.arrows = 0;
        }
        this.cur_room.game.arrows_left = 9;
      }
    }
    
    //dice roll
    roll(){
      if (this.player.rolled===false){
  
        let roll_results = [];
        for (let i = 0; i < 5; i++){
          let cur_dice = new Dice(this.player.roll(),i)
          roll_results.push(cur_dice);
          if (cur_dice.type === 0 ||cur_dice.type === 1 || cur_dice.type === 5){ //add all to selections except bullet1,2
            this.player.selections[i] = cur_dice.type;
            } else {
              this.player.selections[i] = null;
            }
        }
  
        let dynamite_dices = roll_results.filter(x=>x.type===1);
        for (let d of roll_results){
  
          if (d.type===0){
            this.player.arrows++;
            this.cur_room.game.arrows_left--;
    
            this.check_arrows_left();
          }
          else if (d.type==1){
            d.rerolls_left = 0;
          }
        }
        if (dynamite_dices.length>=3){
          this.player.life--;
          dynamite_dices.forEach(x=>x.ability_activated = true);
          roll_results.forEach(x=>x.rerolls_left = 0);
        }
  
        this.player.rolled = true;
        console.log(this.player.name + ' rolled: '+ roll_results.map(x=>x.type));
        this.cur_room.game.log.push(this.player.name + ' rolled: '+ roll_results.map(x=>x.type));
  
        this.player.cur_dices = roll_results;
  
        this.socket.emit('roll_results',[this.player.cur_dices,this.player.selections]);
  
        this.io.to(this.cur_room.name).emit('players_data_refresh',[this.cur_room.game.players,this.cur_room.game.arrows_left,this.cur_room.game.players_alive,this.cur_room.game.log]);
  
      }
    }
    
    reroll(rerolled_dice_index){
      let rerolled_dice = this.player.cur_dices[rerolled_dice_index];
  
      rerolled_dice.type = this.player.roll();
      console.log(this.player.name + ' rerolled: '+ rerolled_dice.type);
      this.cur_room.game.log.push(this.player.name + ' rerolled: '+ rerolled_dice.type);
  
      if (rerolled_dice.type === 0 || rerolled_dice.type === 1 ||rerolled_dice.type === 5){
        this.player.selections[rerolled_dice_index] = rerolled_dice.type;
      } else {
        this.player.selections[rerolled_dice_index] = null;
      }
  
      rerolled_dice.rerolls_left--;
  
      let dynamite_dices = this.player.cur_dices.filter(x=>x.type===1&&x.ability_activated === false);
  
      if (rerolled_dice.type===0){
        this.cur_room.game.log.push(this.player.name+' gets an arrow.');
        this.player.arrows++;
        this.cur_room.game.arrows_left--;
  
        this.check_arrows_left();
      }
      else if (rerolled_dice.type==1){
        rerolled_dice.rerolls_left = 0;
      }
  
      if (dynamite_dices.length>=3){
        this.cur_room.game.log.push(this.player.name + ' rolled 3 dynamites.');
        this.player.life--;
        dynamite_dices.forEach(x=>x.ability_activated = true);
        this.player.cur_dices.forEach(x=>x.rerolls_left = 0);
      }
  
      this.socket.emit('roll_results',[this.player.cur_dices,this.player.selections]);
  
      this.io.to(this.cur_room.name).emit('players_data_refresh',[this.cur_room.game.players,this.cur_room.game.arrows_left,this.cur_room.game.players_alive,this.cur_room.game.log]);
  
    }
    
    send_message(m){
      console.log(this.player.name+" sent message: "+m);
      this.cur_room.game.chat.push(this.player.name+": "+m);
      this.io.to(this.cur_room.name).emit('update_chat',this.cur_room.game.chat);
    }
    
    //disconnect
    disconnect(){
      this.cur_room.connections[this.playerIndex] = null;
      this.io.to(this.cur_room.name).emit("a_player_disconnected");
      if (this.server.rooms.indexOf(this.cur_room)!=-1){
        this.server.rooms.splice(this.server.rooms.indexOf(this.cur_room),1);
      }
      //this.server.clients.remove(this);
    }
}

module.exports = GameClient;
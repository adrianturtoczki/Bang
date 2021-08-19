const {waitFor} = require('./helper');
const Game = require('./game');
const Room = require('./room');
const Dice = require('./dice');

'use strict';

class GameClient{
    constructor(socket,io,server){
        this.socket = socket;
        this.io = io;
        this.server = server;
        this.curRoom;
        this.playerIndex = -1;
        this.player;
        this.player_role;

        this.setup = this.setup.bind(this);
        this.endTurn = this.endTurn.bind(this);
        this.roll = this.roll.bind(this);
        this.reroll = this.reroll.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.disconnect = this.disconnect.bind(this);

        this.socket.on('setup',this.setup);
        this.socket.on('endTurn', this.endTurn);
        this.socket.on('roll', this.roll);
        this.socket.on('reroll', this.reroll);
        this.socket.on('sendMessage', this.sendMessage); //public, maybe implement private later
        this.socket.on('disconnect', this.disconnect);

        waitFor(x=>this.curRoom&&this.curRoom.game.started).then(x=>{
            this.setupAllConnected();
          });
    }
    setup(roomName){
        //console.log("setup "+roomName);
        this.curRoom = this.server.rooms.find(x=>x.name===roomName);
        this.socket.join(this.curRoom.name);
    
        //todo check if playerIndex always player.index
        for (let i in this.curRoom.connections){
          if (this.curRoom.connections[i] === null){
            this.playerIndex = parseInt(i);
            break;
          }
        }
        if (this.playerIndex == -1) return
        this.curRoom.connections[this.playerIndex] = this.socket;
      }

    setupAllConnected(){
      //console.log("setup_all_connected");
      this.player = this.curRoom.game.players[this.playerIndex];
      this.player.index = this.playerIndex;
      this.player_role = this.curRoom.game.roles[this.playerIndex];
      //console.log(this.player.name+' connected');
      this.io.to(this.curRoom.name).emit('currentTurn',this.curRoom.game.players[this.curRoom.game.turnCount].name);
      this.socket.emit('playersDataSetup',[this.curRoom.game.players,this.playerIndex,this.player_role,this.curRoom.game.arrowsLeft]);
    }
    
    // ending a turn
    endTurn(selections){
      let alivePlayers = this.curRoom.game.players.filter(x=>x.life>0);
  
      //resolving
      //console.log('resolving '+this.player.name+"'s turn ..");
  
      //character check: suzy lafayette
      if (this.player.name==='suzy_lafayette'&&selections.filter(x=>x[0]===2||x[0]===3).length === 0){
        this.player.life+=2;
      }
      //character check: el gringo
      if (selections.some(x=>(x!=0&&x!=1&&x!=3&&x!=4&&x!=5)&&(x[0]===2||x[0]===3)&&this.curRoom.game.players[x[1]].character.name==='el_gringo')){
          this.player.arrows++;
          this.curRoom.game.arrowsLeft--;
          this.checkArrowsLeft();
      }
  
      for (let s of selections){
        if (s!=null){
          //console.log("resolving " +s+ " ..");
          let dice_type = s[0];
          let selectedPlayer = this.curRoom.game.players[s[1]];
          //console.log(dice_type,selectedPlayer);
          if (dice_type===2||dice_type===3){
            selectedPlayer.life--;
          } else if (dice_type===4&&selectedPlayer.life<selectedPlayer.startingLife){
            //character check: jesse jones
            if (selectedPlayer.name==='jesse_jones'&&selectedPlayer===this.player&&selectedPlayer.life<=4){
              selectedPlayer.life+=2;
            } else {
              selectedPlayer.life++;
            }
          }
        }
      }
  
      let gatlingDices = selections.filter(x=>x===5);
      //character check: willy the kid
      if (gatlingDices.length>=3||(gatlingDices.length===2&&this.player.character.name==='willy_the_kid')){
        this.curRoom.game.arrowsLeft+=this.player.arrows;
        this.player.arrows = 0;
        for (let p of alivePlayers){
          //character check: paul regret
          if (p!=this.player&&p.character.name!='paul_regret'){
            p.life--;
          }
        }
      }
  
      let killedPlayers = alivePlayers.filter(x=>x.life<=0) //return killed this.player's arrows back
      for (let p of killedPlayers){
        this.curRoom.game.arrowsLeft+=p.arrows;
        p.arrows = 0;
        p.life = 0;
        p.role = this.curRoom.game.roles[p.index];
      }
  
      let winner = this.curRoom.game.checkWinConditions(this.curRoom.playerLimit)
      console.log(winner);
      if (winner){
        this.io.to(this.curRoom.name).emit('game_end',winner);
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom),1);
      }
  
      //ending turn
      console.log(this.player.name+"'s turn ended");
      if (this.player.curTurn){
        this.player.turnEnd = true;
      }
      
  
      setTimeout(() => { //TODO: not ideal, would be better without timeout
        console.log("ending turn .. ");
        this.io.to(this.curRoom.name).emit('playersDataRefresh',[this.curRoom.game.players,this.curRoom.game.arrowsLeft,this.curRoom.game.players.alive,this.curRoom.game.chat]);
        this.io.to(this.curRoom.name).emit('currentTurn',this.curRoom.game.players[this.curRoom.game.turnCount].name);
      }, 500);
    }
    
    //check if no arrows are left
    checkArrowsLeft(){
     if (this.curRoom.game.arrowsLeft<=0){
        for (let p of this.curRoom.game.players){
          //character check: jourdonnais
          if (p.character.name!='jourdonnais'){
            p.life-=p.arrows;
          } else {
            p.life--;
          }
          p.arrows = 0;
        }
        this.curRoom.game.arrowsLeft = 9;
      }
    }
    
    //dice roll
    roll(){
      if (this.player.rolled===false){
  
        let rollResults = [];
        for (let i = 0; i < 5; i++){
          let cur_dice = new Dice(i);
          rollResults.push(cur_dice);
          if (cur_dice.type === 0 ||cur_dice.type === 1 || cur_dice.type === 5){ //add all to selections except bullet1,2
            this.player.selections[i] = cur_dice.type;
            } else {
              this.player.selections[i] = null;
            }
        }
  
        let dynamiteDices = rollResults.filter(x=>x.type===1);
        for (let d of rollResults){
  
          if (d.type===0){
            this.player.arrows++;
            this.curRoom.game.arrowsLeft--;
    
            this.checkArrowsLeft();
          }
          else if (d.type==1){
            d.rerollsLeft = 0;
          }
        }
        if (dynamiteDices.length>=3){
          this.player.life--;
          dynamiteDices.forEach(x=>x.abilityActivated = true);
          rollResults.forEach(x=>x.rerollsLeft = 0);
        }
  
        this.player.rolled = true;
        console.log(this.player.name + ' dobott: '+ rollResults.map(x=>x.name));
        this.curRoom.game.chat.push(this.player.name + ' dobott: '+ rollResults.map(x=>x.name));
  
        this.player.curDices = rollResults;
  
        this.socket.emit('rollResults',[this.player.curDices,this.player.selections]);
  
        this.io.to(this.curRoom.name).emit('playersDataRefresh',[this.curRoom.game.players,this.curRoom.game.arrowsLeft,this.curRoom.game.playersAlive,this.curRoom.game.chat]);
  
      }
    }
    
    reroll(rerolledDiceIndex){
      let rerolledDice = this.player.curDices[rerolledDiceIndex];
  
      rerolledDice.roll();
      console.log(this.player.name + ' újradobott: '+ rerolledDice.name);
      this.curRoom.game.chat.push(this.player.name + ' újradobott: '+ rerolledDice.name);
  
      if (rerolledDice.type === 0 || rerolledDice.type === 1 ||rerolledDice.type === 5){
        this.player.selections[rerolledDiceIndex] = rerolledDice.type;
      } else {
        this.player.selections[rerolledDiceIndex] = null;
      }
  
      rerolledDice.rerollsLeft--;
  
      let dynamiteDices = this.player.curDices.filter(x=>x.type===1&&x.abilityActivated === false);
  
      if (rerolledDice.type===0){
        this.curRoom.game.chat.push(this.player.name+' kapott egy nyilat.');
        this.player.arrows++;
        this.curRoom.game.arrowsLeft--;
  
        this.checkArrowsLeft();
      }
      else if (rerolledDice.type==1){
        rerolledDice.rerollsLeft = 0;
      }
  
      if (dynamiteDices.length>=3){
        this.curRoom.game.chat.push(this.player.name + ' 3 dinamitot dobott.');
        this.player.life--;
        dynamiteDices.forEach(x=>x.abilityActivated = true);
        this.player.curDices.forEach(x=>x.rerollsLeft = 0);
      }
  
      this.socket.emit('rollResults',[this.player.curDices,this.player.selections]);
  
      this.io.to(this.curRoom.name).emit('playersDataRefresh',[this.curRoom.game.players,this.curRoom.game.arrowsLeft,this.curRoom.game.playersAlive,this.curRoom.game.chat]);
  
    }
    
    sendMessage(m){
      console.log(this.player.name+" sent message: "+m);
      this.curRoom.game.chat.push(this.player.name+": "+m);
      this.io.to(this.curRoom.name).emit('updateChat',this.curRoom.game.chat);
    }
    
    //disconnect
    disconnect(){
      this.curRoom.connections[this.playerIndex] = null;
      this.io.to(this.curRoom.name).emit("aPlayerDisconnected");
      if (this.server.rooms.indexOf(this.curRoom)!=-1){
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom),1);
      }
      //this.server.clients.remove(this);
    }
}

module.exports = GameClient;
const {waitFor} = require('./helper');
const Room = require('./room');
const Dice = require('./dice');

'use strict';

class socketServer{
    constructor(socket,io,server){
        this.socket = socket;
        this.io = io;
        this.server = server;
        this.curRoom;
        this.playerIndex = -1;
        this.player;
        this.player_role;

        this.addSocket = this.addSocket.bind(this);
        this.endTurn = this.endTurn.bind(this);
        this.roll = this.roll.bind(this);
        this.reroll = this.reroll.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.setupAllConnected = this.setupAllConnected.bind(this);

        this.socket.on('addSocket',this.addSocket);
        this.socket.on('endTurn', this.endTurn);
        this.socket.on('roll', this.roll);
        this.socket.on('reroll', this.reroll);
        this.socket.on('sendMessage', this.sendMessage); //public, maybe implement private later
        this.socket.on('disconnect', this.disconnect);
        this.socket.on('setupAllConnected', this.setupAllConnected);

        waitFor(x => this.curRoom && this.curRoom.started).then(()=>{
          this.setupAllConnected();
        });

    }

    addSocket(roomName){
        this.curRoom = this.server.rooms.find(x => x.name === roomName);
        this.socket.join(this.curRoom.name);
    
        for (let i in this.curRoom.connections){
          if (this.curRoom.connections[i] === null){
            this.playerIndex = parseInt(i);
            break;
          }
        }
        if (this.playerIndex == -1) return
        this.curRoom.connections[this.playerIndex] = this.socket;
        if (this.curRoom.allPlayersConnected()){
          console.log("a játék elindult");
          this.curRoom.start();
          console.log(this.curRoom.name);
          
        }
        this.io.to(this.curRoom.name).emit('updatePlayerNumber',[this.curRoom.playerLimit,this.curRoom.playerLimit-this.curRoom.playersLeft]);

      }

    setupAllConnected(){
      this.player = this.curRoom.players[this.playerIndex];
      this.player.index = this.playerIndex;
      this.player_role = this.curRoom.roles[this.playerIndex];
      this.io.to(this.curRoom.name).emit('updateChat',this.curRoom.chat); //todo
      this.socket.emit('playersDataSetup',[this.curRoom.players,this.playerIndex,this.player_role,this.curRoom.arrowsLeft]);
    }
    
    // ending a turn
    endTurn(selections){
      let alivePlayers = this.curRoom.players.filter(x=>x.life>0);
  
      //resolving
  
      //character check: suzy lafayette
      if (this.player.name === 'suzy_lafayette' && selections.filter(x => x[0] === 2 || x[0] === 3).length === 0){
        this.player.life+=2;
      }
      //character check: el gringo
      console.log(this.curRoom.players,selections)
      if (selections.some(x => (x!=0 && x!=1 && x!=3 && x!=4 && x!=5) && (x[0] === 2 || x[0] === 3) && this.curRoom.players[x[1]].character.name === 'el_gringo')){ //todo check
          this.player.arrows++;
          this.curRoom.arrowsLeft--;
          this.checkArrowsLeft();
      }
  
      for (let s of selections){
        if (s != null){
          let dice_type = s[0];
          let selectedPlayer = this.curRoom.players[s[1]];
          if (dice_type === 2 || dice_type === 3){
            selectedPlayer.life--;
          } else if (dice_type === 4 && selectedPlayer.life < selectedPlayer.startingLife){
            //character check: jesse jones
            if (selectedPlayer.name === 'jesse_jones' && selectedPlayer === this.player && selectedPlayer.life <= 4){
              selectedPlayer.life+=2;
            } else {
              selectedPlayer.life++;
            }
          }
        }
      }
  
      let gatlingDices = selections.filter(x => x === 5);
      //character check: willy the kid
      if (gatlingDices.length >= 3 || (gatlingDices.length === 2 && this.player.character.name === 'willy_the_kid')){
        this.curRoom.arrowsLeft += this.player.arrows;
        this.player.arrows = 0;
        for (let p of alivePlayers){
          //character check: paul regret
          if (p != this.player && p.character.name != 'paul_regret'){
            p.life--;
          }
        }
      }
  
      let killedPlayers = alivePlayers.filter(x => x.life <= 0) //return killed this.player's arrows back
      for (let p of killedPlayers){
        this.curRoom.arrowsLeft += p.arrows;
        p.arrows = 0;
        p.life = 0;
        p.role = this.curRoom.roles[p.index];
      }
  
      let winner = this.curRoom.checkWinConditions(this.curRoom.playerLimit)
      console.log(winner);
      if (winner){
        this.io.to(this.curRoom.name).emit('game_end', winner);
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom), 1);
      }
  
      //ending turn
      console.log(this.player.name+"'s turn ended");
      if (this.player.curTurn){
        this.curRoom.nextPlayer();
      }
      
  
      setTimeout(() => {
        console.log("ending turn .. ");
        this.io.to(this.curRoom.name).emit('playersDataRefresh',[this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.players.alive, this.curRoom.chat]);
      }, 500);
    }
    
    //check if no arrows are left
    checkArrowsLeft(){
     if (this.curRoom.arrowsLeft <= 0){
        for (let p of this.curRoom.players){
          //character check: jourdonnais
          if (p.character.name != 'jourdonnais'){
            p.life -= p.arrows;
          } else {
            p.life--;
          }
          p.arrows = 0;
        }
        this.curRoom.arrowsLeft = 9;
      }
    }
    
    //dice roll
    roll(){
      if (this.player.rolled === false){
  
        let rollResults = [];
        for (let i = 0; i < 5; i++){
          let cur_dice = new Dice(i);
          rollResults.push(cur_dice);
          if (cur_dice.type === 0 || cur_dice.type === 1 || cur_dice.type === 5){ //add all to selections except bullet1,2
            this.player.selections[i] = cur_dice.type;
            } else {
              this.player.selections[i] = null;
            }
        }
  
        let dynamiteDices = rollResults.filter(x => x.type === 1);
        for (let d of rollResults){
  
          if (d.type === 0){
            this.player.arrows++;
            this.curRoom.arrowsLeft--;
    
            this.checkArrowsLeft();
          }
          else if (d.type === 1){
            d.rerollsLeft = 0;
          }
        }
        if (dynamiteDices.length >= 3){
          this.player.life--;
          dynamiteDices.forEach(x=>x.abilityActivated = true);
          rollResults.forEach(x=>x.rerollsLeft = 0);
        }
  
        this.player.rolled = true;
        console.log(this.player.name + ' dobott: '+ rollResults.map(x => x.name));
        this.curRoom.chat.push(this.player.name + ' dobott: '+ rollResults.map(x => x.name));
  
        this.player.curDices = rollResults;
  
        this.socket.emit('rollResults',[this.player.curDices, this.player.selections]);
  
        this.io.to(this.curRoom.name).emit('playersDataRefresh',[this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.playersAlive, this.curRoom.chat]);
  
      }
    }
    
    reroll(rerolledDiceIndex){
      let rerolledDice = this.player.curDices[rerolledDiceIndex];
  
      rerolledDice.roll();
      console.log(this.player.name + ' újradobott: '+ rerolledDice.name, rerolledDice.type);
      this.curRoom.chat.push(this.player.name + ' újradobott: '+ rerolledDice.name);
  
      if (rerolledDice.type === 0 || rerolledDice.type === 1 ||rerolledDice.type === 5){
        this.player.selections[rerolledDiceIndex] = rerolledDice.type;
      } else {
        this.player.selections[rerolledDiceIndex] = null;
      }
  
      rerolledDice.rerollsLeft--;
  
      let dynamiteDices = this.player.curDices.filter(x => x.type === 1 && x.abilityActivated === false);
  
      if (rerolledDice.type === 0){
        this.curRoom.chat.push(this.player.name+' kapott egy nyilat.');
        this.player.arrows++;
        this.curRoom.arrowsLeft--;
  
        this.checkArrowsLeft();
      }
      else if (rerolledDice.type === 1){
        rerolledDice.rerollsLeft = 0;
      }
  
      if (dynamiteDices.length >= 3){
        this.curRoom.chat.push(this.player.name + ' 3 dinamitot dobott.');
        this.player.life--;
        dynamiteDices.forEach(x => x.abilityActivated = true);
        this.player.curDices.forEach(x => x.rerollsLeft = 0);
      }
  
      this.socket.emit('rollResults', [this.player.curDices, this.player.selections]);
  
      this.io.to(this.curRoom.name).emit('playersDataRefresh', [this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.playersAlive, this.curRoom.chat]);
  
    }
    
    sendMessage(message){
      console.log(this.player.name+" sent message: "+message);
      this.curRoom.chat.push(this.player.name+": "+message);
      this.io.to(this.curRoom.name).emit('updateChat', this.curRoom.chat);
    }
    
    //disconnect
    disconnect(){
      this.curRoom.connections[this.playerIndex] = null;
      this.io.to(this.curRoom.name).emit("aPlayerDisconnected");
      if (this.server.rooms.indexOf(this.curRoom) != -1){
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom), 1);
      }
    }
}

module.exports = socketServer;
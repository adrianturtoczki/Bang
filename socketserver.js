const {waitFor} = require('./helper');
const Room = require('./room');
const Dice = require('./dice');

class SocketServer{
    constructor(socket,io,server){
        this.socket = socket;
        this.io = io;
        this.server = server;
        this.curRoom;
        this.playerIndex = -1;
        this.player;
        this.playerRole;
        this.addSocket = this.addSocket.bind(this);
        this.endTurn = this.endTurn.bind(this);
        this.roll = this.roll.bind(this);
        this.reroll = this.reroll.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.disconnect = this.disconnect.bind(this);

        this.socket.on('addSocket',this.addSocket);
        this.socket.on('endTurn', this.endTurn);
        this.socket.on('roll', this.roll);
        this.socket.on('reroll', this.reroll);
        this.socket.on('sendMessage', this.sendMessage);
        this.socket.on('disconnect', this.disconnect);

        waitFor(() => this.curRoom && this.curRoom.started).then(()=>{
          this.setupAllConnected();
        });

    }

    //Adds a socket to the room
    addSocket(roomName){
        this.curRoom = this.server.rooms.find(x => x.name === roomName);
        this.socket.join(this.curRoom.name);
    
        for (let i in this.curRoom.connections){
          if (this.curRoom.connections[i] === null){
            this.playerIndex = parseInt(i);
            break;
          }
        }
        if (this.playerIndex === -1) return
        this.curRoom.connections[this.playerIndex] = this.socket;
        if (this.curRoom.allPlayersConnected()){
          this.curRoom.start();
          console.log(this.curRoom.name+": "+"a játék elindult");
          
        }
        this.io.to(this.curRoom.name).emit('updatePlayerNumber',this.curRoom.playerLimit,this.curRoom.playerLimit-this.curRoom.playersLeft);

      }

      //Sets the player's data, then sends it to the client-side
    setupAllConnected(){
      this.player = this.curRoom.players[this.playerIndex];
      this.player.index = this.playerIndex;
      this.playerRole = this.curRoom.roles[this.playerIndex];
      this.io.to(this.curRoom.name).emit('updateChat',this.curRoom.chat);
      this.socket.emit('playersDataSetup',this.curRoom.players,this.playerIndex,this.playerRole,this.curRoom.arrowsLeft);
    }
    
    //checks if the player's health reached 0, and removes them from the game if yes.
    checkIfKilled(player){
      if (player.life<=0){
        if (!player.killed){
          player.killed = true;
          this.curRoom.chat.push(player.name+" meghalt.");
          this.curRoom.arrowsLeft += player.arrows;
          player.arrows = 0;
          player.life = 0;
          player.role = this.curRoom.roles[player.index];
          this.curRoom.alivePlayers.splice(this.curRoom.alivePlayers.indexOf(player),1);
  
          //checks if the killed player is the current one
          if (player.name==this.player.name){
            this.endTurn([]);
          }
          this.io.to(this.curRoom.name).emit('playersDataRefresh',this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
          console.log("checkifkilled:",this.curRoom.alivePlayers);
        }
      }
    }

    // ending a turn
    endTurn(selections){
  
      //resolving
  
      //character check: suzy lafayette
      if (this.player.character.name === 'suzy_lafayette' && selections.filter(x => x.type === 2 || x.type === 3).length === 0){
        this.player.life+=2;
      }
      //character check: el gringo 
      console.log(this.curRoom.name+": "+this.curRoom.players,selections)
      if (selections.some(x => (x.type === 2 || x.type === 3) && this.curRoom.players[x.selection].character.name === 'el_gringo')){
          this.player.arrows++;
          this.curRoom.chat.push(this.player.name+' kapott egy nyilat.');
          this.curRoom.arrowsLeft--;
          this.checkArrowsLeft();
      }
  
      for (let s of selections){
        if (s != null){
          let dice_type = s.type;
          let selectedPlayer = this.curRoom.players[s.selection];
          if (dice_type === 2 || dice_type === 3){
            selectedPlayer.life--;
            this.curRoom.chat.push(selectedPlayer.name + ' kapott egy lövést: '+ '<img class="smallDices" src="'+s.image+'">');
          } else if (dice_type === 4 && selectedPlayer.life < selectedPlayer.startingLife){
            //character check: jesse jones
            if (selectedPlayer.character.name === 'jesse_jones' && selectedPlayer === this.player && selectedPlayer.life <= 4){
              selectedPlayer.life+=2;
              this.curRoom.chat.push(selectedPlayer.name + ' kapott két sört: '+ '<img class="smallDices" src="'+s.image+'">');
            } else {
              selectedPlayer.life++;
              this.curRoom.chat.push(selectedPlayer.name + ' kapott egy sört: '+ '<img class="smallDices" src="'+s.image+'">');
            }
          }
        }
      }
  
      let gatlingDices = selections.filter(x => x.type === 5);
      //character check: willy the kid
      if (gatlingDices.length >= 3 || (gatlingDices.length === 2 && this.player.character.name === 'willy_the_kid')){
        this.curRoom.chat.push(this.player.name + ' gatlingot használt, így eldobja a nyilait.');
        this.curRoom.arrowsLeft += this.player.arrows;
        this.player.arrows = 0;
        for (let p of this.curRoom.alivePlayers){
          //character check: paul regret
          if (p != this.player && p.character.name != 'paul_regret'){
            p.life--;
            this.curRoom.chat.push(p.name + ' sebezve lett gatling által');
          }
        }
      }
  
      for (let p of this.curRoom.alivePlayers){
        this.checkIfKilled(p);
      }
  
      let winner = this.curRoom.checkWinConditions(this.curRoom.playerLimit)
      winner!=undefined ? console.log(this.curRoom.name+": a nyertes: "+winner) : console.log("nincs még nyertes");
      if (winner){
        this.io.to(this.curRoom.name).emit('gameEnd', winner);
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom), 1);
      }
  
      //ending turn
      console.log(this.curRoom.name+": "+this.player.name+" körének vége!");
      if (this.player.curTurn){
        this.curRoom.nextPlayer(this.player);
      }
      
      console.log(this.curRoom.name+": kör befejezése.. .. ");
      this.io.to(this.curRoom.name).emit('playersDataRefresh',this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
    }
    
    //check if no arrows are left, and damages the players if they have arrows
    checkArrowsLeft(){
     if (this.curRoom.arrowsLeft <= 0){
      this.io.to(this.curRoom.name).emit('playersDataRefresh',this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
      this.io.to(this.curRoom.name).emit('noArrowsLeft');
        for (let p of this.curRoom.alivePlayers){
          //character check: jourdonnais
          if (p.character.name != 'jourdonnais'){
            p.life -= p.arrows;
            this.curRoom.chat.push(p.name+' kapott ' + p.arrows +' sebzést a nyilaktól.');
          } else {
            p.life--;
            this.curRoom.chat.push(p.name+' kapott egy sebzést a nyilaktól.');
          }
          p.arrows = 0;
          this.checkIfKilled(p)
        }
        this.curRoom.arrowsLeft = 9;
      }
      this.io.to(this.curRoom.name).emit('playersDataRefresh',this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
    }
    
    //dice roll
    roll(types=[-1,-1,-1,-1,-1]){
      if (this.player.rolled === false){
  
        let rollResults = [];
        for (let i = 0; i < 5; i++){
          let cur_dice = new Dice(i,types[i]);
          rollResults.push(cur_dice);
          if (cur_dice.type === 0 || cur_dice.type === 1 || cur_dice.type === 5){ //add all to selections except bullet1,2
            this.player.selections[i] = cur_dice;
            } else {
              this.player.selections[i] = null;
            }
        }
  
        let dynamiteDices = rollResults.filter(x => x.type === 1);
        for (let d of rollResults){
  
          if (d.type === 0){
            this.player.arrows++;
            this.curRoom.arrowsLeft--;
    
          }
          else if (d.type === 1){
            d.rerollsLeft = 0;
          }
        }
        this.checkArrowsLeft();
        if (dynamiteDices.length >= 3){
          this.player.life--;
          this.checkIfKilled(this.player)
          dynamiteDices.forEach(x=>x.abilityActivated = true);
          rollResults.forEach(x=>x.rerollsLeft = 0);
        }
  
        this.player.rolled = true;
        console.log(this.curRoom.name+": "+this.player.name + ' dobott: '+ rollResults.map(x => x.name));
        this.curRoom.chat.push(this.player.name + ' dobott: '+ rollResults.map(x => '<img class="smallDices" src="'+x.image+'">'));
  
        this.player.curDices = rollResults;
  
        this.socket.emit('rollResults',this.player.curDices, this.player.selections);
  
        this.io.to(this.curRoom.name).emit('playersDataRefresh',this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
  
      }
    }
    
    //handles the rerolling of the dice
    reroll(rerolledDiceIndex,type=-1){
      let rerolledDice = this.player.curDices[rerolledDiceIndex];
      let originalDice = {...rerolledDice};
  
      rerolledDice.roll(type);
      console.log(this.curRoom.name+": "+this.player.name + ' újradobott: '+ rerolledDice.name, rerolledDice.type);
      this.curRoom.chat.push(this.player.name + ' újradobott: '+ '<img class="smallDices" src="'+originalDice.image+'">'+'->'+'<img class="smallDices" src="'+rerolledDice.image+'">');
  
      if (rerolledDice.type === 0 || rerolledDice.type === 1 ||rerolledDice.type === 5){
        this.player.selections[rerolledDiceIndex] = rerolledDice;
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
        this.checkIfKilled(this.player)
        dynamiteDices.forEach(x => x.abilityActivated = true);
        this.player.curDices.forEach(x => x.rerollsLeft = 0);
      }
  
      this.socket.emit('rollResults', this.player.curDices, this.player.selections);
  
      this.io.to(this.curRoom.name).emit('playersDataRefresh', this.curRoom.players, this.curRoom.arrowsLeft, this.curRoom.chat);
  
    }
    
    sendMessage(message){
      console.log(this.curRoom.name+": "+this.player.name+" küldött egy üzenetet: "+message);
      this.curRoom.chat.push(this.player.name+": "+message);
      this.io.to(this.curRoom.name).emit('updateChat', this.curRoom.chat);
    }
    
    //disconnect
    disconnect(reason){
      console.log("disconnect reason: ",reason);
      this.curRoom.connections[this.playerIndex] = null;
      this.io.to(this.curRoom.name).emit("aPlayerDisconnected");
      if (this.server.rooms.indexOf(this.curRoom) != -1){
        this.server.rooms.splice(this.server.rooms.indexOf(this.curRoom), 1);
      }
    }
}

module.exports = SocketServer;

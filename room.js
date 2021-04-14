const Game = require("./game");

class Room {
    constructor(roomName,playerLimit,playersLeft=playerLimit,playerNames=[],characters=[],connections=[]){
        this.name = roomName;
        this.playerLimit = playerLimit;
        this.playersLeft = playersLeft;
        this.playerNames = playerNames;
        this.characters = characters;
        if (connections.length===0){
            this.connections = new Array(this.playerLimit).fill(null);
        } else {
            for (let i = 0; i < playerLimit; i++){
                this.connections[i] = connections[i];
            }
        }
        this.game = new Game();
    }

    addPlayer(newPlayerName,character=null){
         if (this.playerNames.length<this.playerLimit){
             this.playerNames.push(newPlayerName);
             this.playersLeft--;
         }
         if (character){
             this.game.characters.push()
         }
    }
    allPlayersConnected(){
        return this.connections.every(function(i) { return i !== null; })
    }

    start(){
        this.game.setup(this.playerLimit,this.playerNames,this.characters);
        this.game.run();
    }

}

module.exports = Room;
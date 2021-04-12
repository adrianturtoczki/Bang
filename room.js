const Game = require("./game");

class Room {
    constructor(room_name,playerLimit,players_left,playerNames=[],connections=[]){
        this.name = room_name;
        this.playerLimit = playerLimit;
        this.players_left = players_left;
        this.playerNames = playerNames;
        if (connections.length===0){
            this.connections = new Array(this.playerLimit).fill(null);
        } else {
            for (let i = 0; i < playerLimit; i++){
                this.connections[i] = connections[i];
            }
        }
        this.game = new Game();
    }

    addPlayer(new_player_name){
         if (this.playerNames.length<this.playerLimit){
             this.playerNames.push(new_player_name);
         }
    }

}

module.exports = Room;
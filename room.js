const Game = require("./game");

class Room {
    constructor(room_name,player_limit,players_left,player_names=[],connections=[]){
        this.name = room_name;
        this.player_limit = player_limit;
        this.players_left = players_left;
        this.player_names = player_names;
        this.connections = new Array(this.player_limit).fill(null);
        for (let c of connections){
            this.connections.push(c);
        }
        this.game = new Game();
    }
}

module.exports = Room;
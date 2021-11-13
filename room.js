const Player = require('./player');
const Character = require('./character');

class Room {
    constructor(roomName, playerLimit, password, playersLeft = playerLimit, playerNames = [], characters = [], connections = []){
        this.name = roomName;
        this.playerLimit = playerLimit;
        this.playersLeft = playersLeft;
        this.playerNames = playerNames;
        this.characters = characters;
        this.password = password;

        this.started = false;
        this.players = [];
        this.alivePlayers = [];
        this.roles = []; //separated from players so they don't get sent to everyone
        this.end = false;
        this.arrowsLeft = 9;
        this.chat = [];

        this.currentPlayerIndex = 0;

        if (connections.length === 0){
            this.connections = new Array(this.playerLimit).fill(null);
        } else {
            for (let i = 0; i < playerLimit; i++){
                this.connections[i] = connections[i];
            }
        }
    }

    

    addPlayer(newPlayerName, character = null){
         if (this.playerNames.length < this.playerLimit){
             this.playerNames.push(newPlayerName);
             this.playersLeft--;
         }
         if (character){
             this.characters.push()
         }
    }
    allPlayersConnected(){
        return this.connections.every(i => i !== null )
    }

    start(){
        this.setupPlayersAndRoles(this.playerLimit, this.playerNames, this.characters);
        this.started = true;
        let firstPlayer = this.players[0];
        this.chat.push("Új kör: "+firstPlayer.name);
        firstPlayer.curTurn = true;
        console.log(firstPlayer.name+" köre");
    }
    nextPlayer(){
        if (!this.end){
            let lastPlayer = this.alivePlayers[this.currentPlayerIndex]
            console.log(lastPlayer.name+" körének vége!");
            lastPlayer.curTurn = false;
            lastPlayer.turnEnd = false;
            lastPlayer.rolled = false;
            lastPlayer.curDices = [];
            lastPlayer.selections = [];
            if (this.currentPlayerIndex==this.alivePlayerCount-1){
                this.currentPlayerIndex = 0;
            } else {
                this.currentPlayerIndex++;
            }
            console.log("teszt:",this.alivePlayers,this.currentPlayerIndex);
            let currentPlayer = this.alivePlayers[this.currentPlayerIndex];
            this.chat.push("Új kör: "+currentPlayer.name);
            console.log("current player: ", currentPlayer);
            currentPlayer.curTurn = true;
            console.log(currentPlayer.name+" köre");
        } else {
            this.started = false;
        }
    }

    setupPlayersAndRoles(playerNumber, playerNames, characters = []){
        this.players = [];
        let allCharacters = ["paul_regret","el_gringo","jesse_jones","jourdonnais","suzy_lafayette","willy_the_kid","calamity_janet","rose_doolan"];
        let roleAr = ["sheriff","renegade","outlaw","outlaw","deputy","outlaw","deputy","renegade"].slice(0,playerNumber);

        for(var i = 0; i < playerNumber; i++){
            let pRole = roleAr[i];
            this.roles.push(pRole);
            let pChar = characters.length == playerNames.length ? new Character(characters[i]) : new Character(allCharacters.splice(Math.floor(Math.random()*allCharacters.length), 1)[0]); //can use predefined characters or give random
            this.players.push(new Player(playerNames[i], pRole, pChar));
          }
        this.alivePlayerCount = playerNumber;
        this.alivePlayers = Array.from(this.players);
    }

    checkWinConditions(playerNumber){
        let sheriffAlive;
        let deputiesAlive;
        let renegadesAlive;
        let outlawsAlive;
        switch(playerNumber){
            case 4:
                sheriffAlive = 1;
                deputiesAlive = 0;
                renegadesAlive = 1;
                outlawsAlive = 2;
                break;
            case 5:
                sheriffAlive = 1;
                deputiesAlive = 1;
                renegadesAlive = 1;
                outlawsAlive = 2;
                break;
            case 6:
                sheriffAlive = 1;
                deputiesAlive = 1;
                renegadesAlive = 1;
                outlawsAlive = 3;
                break;
            case 7:
                sheriffAlive = 1;
                deputiesAlive = 2;
                renegadesAlive = 1;
                outlawsAlive = 3;
                break;
            case 8:
                sheriffAlive = 1;
                deputiesAlive = 2;
                renegadesAlive = 2;
                outlawsAlive = 3;
                break;
        }
        for (let p of this.players){
            if (p.life <= 0){
                this.alivePlayerCount--;
                switch(this.roles[p.index]){
                    case "sheriff":
                        sheriffAlive--;
                        break;
                    case "deputy":
                        deputiesAlive--;
                        break;
                    case "renegade":
                        renegadesAlive--;
                        break;
                    case "outlaw":
                        outlawsAlive--;
                        break;
                }
            }
        }
        if (sheriffAlive === 1 && renegadesAlive <= 0 && outlawsAlive <= 0){
            this.end = true;
            return "seriff";
        }
        else if (sheriffAlive <= 0 && deputiesAlive <= 0 && outlawsAlive > 0){
            this.end = true;
            return "banditák";
        }
        else if (renegadesAlive > 1 && sheriffAlive <= 0 && deputiesAlive <= 0 && outlawsAlive <= 0){
            this.end = true;
            return "renegát";
        }
        else{
            return
        }

    }

}

module.exports = Room;
const Player = require('./player');
const Character = require('./character');
const {waitFor} = require('./helper');

class Game {
    constructor(){
        this.started = false;
        this.players = [];
        this.roles = []; //separated from players so they don't get sent to everyone
        this.end = false;
        this.roundCount = 1;
        this.turnCount = 0;
        this.arrowsLeft = 9;
        this.log = [];
        this.chat = [];
    }

    async run(){
        this.started = true;
        this.log.push("Game started!");
        while (this.end!=true){
            for (let p of this.players){
                this.log.push("New turn");
                if (p.life>0){
                    p.curTurn = true;
                    console.log(p.name+"'s round");
                    await waitFor(_ => p.turnEnd === true).then(_ => {
                        console.log(p.name+"'s turn over!");
                        console.log(p);
                        p.curTurn = false;
                        p.turnEnd = false;
                        p.rolled = false;
                        p.curDices = [];
                        p.selections = [];
                        console.log(this.turnCount)
                    });
                }
                this.turnCount++;
            }
            this.turnCount = 0;
            this.roundCount++;
        }
        this.started = false;
    }


    setup(playerNumber,playerNames,characters=[]){
        this.players = [];
        let allCharacters = ["paul_regret","el_gringo","jesse_jones","jourdonnais","suzy_lafayette","willy_the_kid","calamity_janet","rose_doolan"];
        let roleAr = ["sheriff","renegade","outlaw","outlaw","deputy","outlaw","deputy","renegade"].slice(0,playerNumber);

        for(var i = 0;i<playerNumber;i++){
            let pRole = roleAr[i];
            this.roles.push(pRole);
            let pChar = characters.length==playerNames.length ? new Character(characters[i]) : new Character(allCharacters.splice(Math.floor(Math.random()*allCharacters.length), 1)[0]); //can use predefined characters or give random
            this.players.push(new Player(playerNames[i],pRole,pChar));
          }
        this.playersAlive = playerNumber;
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
            if (p.life===0){
                this.playersAlive--;
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
        if (sheriffAlive===1&&renegadesAlive<=0&&outlawsAlive<=0){
            this.end = true;
            return "seriff";
        }
        else if (sheriffAlive<=0&&deputiesAlive<=0&&outlawsAlive>0){
            this.end=true;
            return "banditák";
        }
        else if (renegadesAlive>1&&sheriffAlive<=0&&deputiesAlive<=0&&outlawsAlive<=0){
            this.end=true;
            return "renegát";
        }
        else{
            return
        }

    }
}

module.exports = Game;
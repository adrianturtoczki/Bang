const Player = require('./player');

class Game {
    constructor(){
        this.players = [];
        this.end = false;
        this.round_count = 1;
        this.turn_count = 0;
        this.arrows_left = 9;
    }

    waitFor(conditionFunction) {

        const poll = resolve => {
          if(conditionFunction()) resolve();
          else setTimeout(_ => poll(resolve), 500);
        }
      
        return new Promise(poll);
      }

    async run(){
        while (this.end!=true){
            for (let p of this.players){
                p.cur_turn = true;
                //console.log(p);
                if (p.life>0){
                    console.log(p.name+"'s round");
                    await this.waitFor(_ => p.turn_end === true).then(_ => {
                        console.log(p.name+"'s turn over!");
                        console.log(p);
                        p.cur_turn = false;
                        p.turn_end = false;
                        p.rolled = false;
                        this.turn_count++;
                        console.log(this.turn_count)
                    });
                }
            }
            this.turn_count = 0;
            this.round_count++;
        }
    }


    setup(playerNumber){
        this.players = [];
        let player1 = new Player("Player 1",'sheriff',8,"suzy_lafayette");
        let player2 = new Player("Player 2",'renegade',8,"black_jack");
        let player3 = new Player("Player 3",'outlaw',8,"lucky_duke");
        let player4 = new Player("Player 4",'outlaw',8,"willy_the_kid");
        this.players.push(player1);
        this.players.push(player2);
        this.players.push(player3);
        this.players.push(player4);

        this.players_alive = playerNumber;
    }

    check_win_conditions(playerNumber){
        //TODO: only works for 4 players for now
        let sheriff_alive = 1;
        let deputies_alive = 0;
        let renegades_alive = 1;
        let outlaws_alive = 2;
        for (let p of this.players){
            if (p.life===0){
                this.players_alive--;
                switch(p.role){
                    case "sheriff":
                        sheriff_alive--;
                        break;
                    case "deputy":
                        deputies_alive--;
                        break;
                    case "renegade":
                        renegades_alive--;
                        break;
                    case "outlaw":
                        outlaws_alive--;
                        break;
                }
            }
        }
        if (sheriff_alive===1&&renegades_alive===0&&outlaws_alive===0){
            this.end = true;
            return "sheriff";
        }
        else if (sheriff_alive===0&&deputies_alive===0&&outlaws_alive>0){
            this.end=true;
            return "outlaw";
        }
        else if (renegades_alive>1&&sheriff_alive===0&&deputies_alive===0&&outlaws_alive===0){
            this.end=true;
            return "renegade";
        }
        else{
            return
        }

    }
}

//TODO: character class, with life, action

module.exports = Game;
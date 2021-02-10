const Player = require('./player');
const Character = require('./character');

class Game {
    constructor(){
        this.started = false;
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
        this.started = true;
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
                        p.cur_dices = [];
                        p.selections = [];
                        this.turn_count++;
                        console.log(this.turn_count)
                    });
                }
            }
            this.turn_count = 0;
            this.round_count++;
        }
        this.started = false;
    }


    setup(player_number,player_names){
        this.players = [];
        let roles;
        let characters = ["bart_cassidy","paul_regret","black_jack","pedro_ramirez","calamity_janet","rose_doolan","el_gringo","sid_ketchum","jesse_jones","slab_the_killer","jourdonnais","suzy_lafayette","kit_carlson","vulture_sam","lucky_duke","willy_the_kid"];
        switch (player_number){
            case 4:
                roles = ["sheriff","renegade","outlaw","outlaw"];
                break;
            case 5:
                roles = ["sheriff","renegade","outlaw","outlaw","deputy"];
                break;
            case 6:
                roles = ["sheriff","renegade","outlaw","outlaw","outlaw","deputy"];
                break;
            case 7:
                roles = ["sheriff","renegade","outlaw","outlaw","outlaw","deputy","deputy"];
                break;
            case 8:
                roles = ["sheriff","renegade","renegade","outlaw","outlaw","outlaw","deputy","deputy"];
                break;
        }

        for(var i = 0;i<player_number;i++){
            let p_role = roles.splice(Math.floor(Math.random()*roles.length), 1)[0];
            let p_char = new Character(characters.splice(Math.floor(Math.random()*characters.length), 1)[0]);
            this.players.push(new Player(player_names[i],p_role,p_char));
          }
        this.players_alive = player_number;
    }

    check_win_conditions(player_number){
        let sheriff_alive;
        let deputies_alive;
        let renegades_alive;
        let outlaws_alive;
        switch(player_number){
            case 4:
                sheriff_alive = 1;
                deputies_alive = 0;
                renegades_alive = 1;
                outlaws_alive = 2;
                break;
            case 5:
                sheriff_alive = 1;
                deputies_alive = 1;
                renegades_alive = 1;
                outlaws_alive = 2;
                break;
            case 6:
                sheriff_alive = 1;
                deputies_alive = 1;
                renegades_alive = 1;
                outlaws_alive = 3;
                break;
            case 7:
                sheriff_alive = 1;
                deputies_alive = 2;
                renegades_alive = 1;
                outlaws_alive = 3;
                break;
            case 8:
                sheriff_alive = 1;
                deputies_alive = 2;
                renegades_alive = 2;
                outlaws_alive = 3;
                break;
        }
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
        if (sheriff_alive===1&&renegades_alive<=0&&outlaws_alive<=0){
            this.end = true;
            return "sheriff";
        }
        else if (sheriff_alive<=0&&deputies_alive<=0&&outlaws_alive>0){
            this.end=true;
            return "outlaw";
        }
        else if (renegades_alive>1&&sheriff_alive<=0&&deputies_alive<=0&&outlaws_alive<=0){
            this.end=true;
            return "renegade";
        }
        else{
            return
        }

    }
}

module.exports = Game;
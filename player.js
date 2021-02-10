class Player {
    constructor(name,role,character){

        this.index = -1;

        this.name = name;
        this.role = role;
        this.character = character;
        this.life = character.life;
        if (this.role==='sheriff'){
            this.life = this.life+=2;
        }
        this.starting_life = this.life;
        this.arrows = 0;

        this.rolled=false;
        this.cur_dices = [];
        this.selections = [];
        this.cur_turn = false;
        this.turn_end = false;

    }
    roll(){
        return Math.floor(Math.random() * 6);
    }
}

module.exports = Player;
class Player {
    constructor(name,role,character){

        this.index = -1;

        this.name = name;
        this.character = character;
        this.life = character.life;
        if (role==='sheriff'){
            this.role = 'sheriff';
            this.life = this.life+=2;
        } else {
            this.role = '';
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
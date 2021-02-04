class Player {
    constructor(name,role,life,character){

        this.index = -1;

        this.name = name;
        this.role = role;
        this.life = life;
        if (this.role==='sheriff'){
            this.life = life+=2;
        }
        this.character = character;
        this.starting_life = this.life;
        this.arrows = 0;

        this.rolled=false;
        this.cur_turn = false;
        this.turn_end = false;

    }
    roll(){
        return Math.floor(Math.random() * 6);
    }
}

module.exports = Player;
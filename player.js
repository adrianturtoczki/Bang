'use strict';

class Player {
    constructor(name, role, character){

        this.index = -1;

        this.name = name;
        this.character = character;
        this.life = character.life;
        if (role === 'sheriff'){
            this.role = 'sheriff';
            this.life = this.life+=2;
        } else {
            this.role = '';
        }
        this.startingLife = this.life;
        this.arrows = 0;

        this.rolled=false;
        this.curDices = [];
        this.selections = [];
        this.curTurn = false;
        this.turnEnd = false;

    }
}

module.exports = Player;

class Dice {
    constructor(type,index){
        this.type = type;
        this.index = index;
        this.rerolls_left = 2;
        this.ability_activated = false;
    }
  }
  
module.exports = Dice;
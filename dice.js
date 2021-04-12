class Dice {
    constructor(type,index){
        this.type = type;
        this.index = index;
        this.rerollsLeft = 2;
        this.abilityActivated = false;
    }
  }
  
module.exports = Dice;
class Dice {
    constructor(index,type=-1){
        type === -1 ? this.roll() : this.type=type;
        this.index = index;
        this.rerollsLeft = 2;
        this.abilityActivated = false;
    }
    roll(){
      this.type = Math.floor(Math.random() * 6);
  }
  }
  
module.exports = Dice;
class Dice {
    constructor(index,type=-1){
        type === -1 ? this.roll() : this.type=type;
        this.index = index;
        this.rerollsLeft = 2;
        this.abilityActivated = false;
        switch(this.type){
          case 0:
            this.name = "nyílvessző";
            break;
          case 1:
            this.name = "dinamit";
            break;
          case 2:
            this.name = "célkereszt(1)"
            break;
          case 3:
            this.name = "célkereszt(2)";
            break;
          case 4:
            this.name = "sör";
            break;
          case 5:
            this.name = "gatling";
            break;

        }
    }
    roll(){
      this.type = Math.floor(Math.random() * 6);
  }
  }
  
module.exports = Dice;
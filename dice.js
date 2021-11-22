class Dice {
    constructor(index,type=-1){
        type === -1 ? this.roll() : this.type=type;
        this.index = index;
        this.rerollsLeft = 2;
        this.abilityActivated = false;
        this.selection = null;
        this.setData();
    }
    roll(){
      this.type = Math.floor(Math.random() * 6);
      this.setData();
  }
  setData(){
    switch(this.type){
      case 0:
        this.name = "nyílvessző";
        this.image = "images/d0.webp";
        break;
      case 1:
        this.name = "dinamit";
        this.image = "images/d1.webp";
        break;
      case 2:
        this.name = "célkereszt(1)"
        this.image = "images/d2.webp";
        break;
      case 3:
        this.name = "célkereszt(2)";
        this.image = "images/d3.webp";
        break;
      case 4:
        this.name = "sör";
        this.image = "images/d4.webp";
        break;
      case 5:
        this.name = "gatling";
        this.image = "images/d5.webp";
        break;

    }
  }
  }
  
module.exports = Dice;
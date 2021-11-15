class Dice {
    constructor(index,type=-1){
        type === -1 ? this.roll() : this.type=type;
        this.index = index;
        this.rerollsLeft = 2;
        this.abilityActivated = false;
        this.setName(this.type);
        this.setImage(this.type);
    }
    roll(){
      this.type = Math.floor(Math.random() * 6);
      this.setName();
      this.setImage();
  }
  setName(){
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
  setImage(){
    switch(this.type){
      case 0:
        this.image = "images/d0.webp";
        break;
      case 1:
        this.image = "images/d1.webp";
        break;
      case 2:
        this.image = "images/d2.webp";
        break;
      case 3:
        this.image = "images/d3.webp";
        break;
      case 4:
        this.image = "images/d4.webp";
        break;
      case 5:
        this.image = "images/d5.webp";
        break;

    }
  }
  }
  
module.exports = Dice;
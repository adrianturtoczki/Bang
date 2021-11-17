'use strict';

let socket = io();

      var urlParams = new URLSearchParams(window.location.search);
      socket.emit('addSocket',urlParams.get('room'));
      
      //setup
      let d1 = new Image();
      let d2 = new Image();
      let d3 = new Image();
      let d4 = new Image();
      let d5 = new Image();
      let diceElements = [d1, d2, d3, d4, d5];
      document.getElementById('dices').appendChild(d1);
      document.getElementById('dices').appendChild(d2);
      document.getElementById('dices').appendChild(d3);
      document.getElementById('dices').appendChild(d4);
      document.getElementById('dices').appendChild(d5);

      let alivePlayerCount;
      let playersAr = [];
      let playerIndex = -1;
      let playerRole;
      let player;
      let playerSelection = false;
      let selectedDiceIndex = -1;

      socket.on('updatePlayerNumber',updatePlayerNumber);
      socket.on('aPlayerDisconnected',aPlayerDisconnected);
      socket.on('playersDataSetup', playersDataSetup);
      socket.on('playersDataRefresh',playersDataRefresh);
      socket.on('rollResults',rollResults);
      socket.on('gameEnd', gameEnd);
      socket.on('updateChat',updateChat);

      function updatePlayerNumber([current, total]){
        document.getElementById('wait_text').textContent = 'Várás a többi játékosra .. '+total+'/'+current;
      }

      function updateChat(gameChat){
          //printing chat
          let chatId = document.getElementById('chat');
          chatId.innerHTML = '';
          for (let i = gameChat.length-1; i >= 0; i--){
            let p = document.createElement('p');
            p.innerHTML = gameChat[i];
            p.classList.add("chatLogP");
            chatId.appendChild(p);
          }
      }

      function aPlayerDisconnected(){
        alert('Egy játékos  kilépett. Visszalépés a főoldalra.');
        window.location.href = '/';
      }

      function curPlayerData(player) {
        //player data

        if (player.curTurn===true && player.rolled===false){
          document.getElementById('dices').style.display = 'none';
          document.getElementById("roll").style.display = "block";
        } else {
          document.getElementById("roll").style.display = "none";
        }
        if (player.curTurn===true){
          document.getElementById("rollDiv").style.display = "block";
        } else {
          document.getElementById("rollDiv").style.display = "none";
          }
        }

        function createPlayer(p,playerRole){
          let pDiv = document.createElement('div');
            pDiv.classList.add("player_data");
            pDiv.id="player_"+p.name;
            let pDivName = document.createElement('div');
            let pDivLifeArrows_char = document.createElement('div');
            let pDivLifeArrows = document.createElement('div');
            let pName = document.createElement('h3');
            let pLife = document.createElement('p');
            let pArrows = document.createElement('p');
            let pLifeImg = document.createElement('img');
            let pArrowsImg = document.createElement('img');
            let pChar = document.createElement('img');
            pChar.classList.add("charImg");
            let pRole = document.createElement('img');
            pRole.classList.add("roleImg");
            pName.appendChild(document.createTextNode(p.name));
            pLife.appendChild(document.createTextNode(p.life));
            pArrows.appendChild(document.createTextNode(p.arrows));
            pChar.src = 'images/c_'+p.character.name+'.webp';
            pRole.src= 'images/r_'+playerRole+'.webp';
            pArrowsImg.src='images/arrow.webp';
            pLifeImg.src='images/bullet.webp';

            pDivName.appendChild(pName);
            pDivLifeArrows.appendChild(pLife);
            pDivLifeArrows.appendChild(pLifeImg);
            pDivLifeArrows.appendChild(pArrows);
            pDivLifeArrows.appendChild(pArrowsImg);
            pDivLifeArrows.appendChild(pRole);
            pDivLifeArrows.classList.add("bulletsArrowsDiv");
            pDivLifeArrows_char.appendChild(pDivName);
            pDivLifeArrows_char.appendChild(pDivLifeArrows);
            pDivLifeArrows_char.appendChild(pChar);
            pDiv.appendChild(pDivLifeArrows_char);
            return pDiv;
        }

      function playersDataSetup([players, index, role, arrowsLeft]){

        document.getElementById('wait_screen').style.display = 'none';
        document.getElementById('game').classList.toggle('game_wait');

        playerIndex = index;
        playerRole = role;
        player = players[index];

        curPlayerData(player);

        document.getElementById("player").append(createPlayer(player, playerRole));

        document.getElementById('otherPlayers').innerHTML='';
      for (let p of players){
          if (p!=player){
            document.getElementById('otherPlayers').append(createPlayer(p, p.role));
            }
          document.getElementById('arrowsLeft').textContent = 'Maradt '+arrowsLeft+' nyíl';
        }

        if (player.rolled&&player.curDices!=[]){
          drawDices(player.curDices);
        }
      }

      function playersDataRefresh([players, arrowsLeft, pAlive, gameChat]){
        updateChat(gameChat);
        playersAr = players;
        player = playersAr[playerIndex];
        alivePlayerCount = pAlive;
        curPlayerData(players[playerIndex]);

          //other players data
          for (let p of playersAr){
              let pDataDiv = document.getElementById("player_"+p.name);
              pDataDiv.children[0].children[0].children[0].textContent=p.name;
              pDataDiv.children[0].children[1].children[0].textContent=p.life;
              pDataDiv.children[0].children[1].children[2].textContent=p.arrows;
              if (p.life<=0) pDataDiv.children[1].children[0].src= 'images/r_'+p.role+'.webp';
            }
          document.getElementById('arrowsLeft').textContent = 'Maradt '+arrowsLeft+' nyíl';
          
      }

      function rollResults([rollResult, selections]){
        player.curDices = rollResult;
        player.selections = selections;

        drawDices(player.curDices);
        checkSelections(selections, document.getElementById('endTurnButton'));
      }

      function gameEnd(winner){
        alert('Nyert: '+winner);
        window.location.href = '/';
      }


      function checkSelections(selections, endTurnButton){
        if (selections.filter(x=>x!=null).length===5){
          endTurnButton.disabled = false;
        } else {
          endTurnButton.disabled = true;
        }
      }

      function selectTarget(dice, playerToSelect){
        player.selections[dice.index] = [dice.type, playerToSelect.index];
        printSelections(player.selections, document.getElementById('selections'));
        checkSelections(player.selections, document.getElementById('endTurnButton'));

        resetSelection();

      }

      function printSelections(selections, selectionsDiv){
        let prettierSelection = '';
        for (let s of selections){
          if (s!=null && s!=0 && s!=1 && s!=5){
            if (s[0]===2 || s[0]===3){
              prettierSelection+="Célkereszt->";
            } else if (s[0] === 4){
              prettierSelection+="Sör ->";
            }
            prettierSelection+=playersAr[s[1]].name+';';
          }
        }


        selectionsDiv.textContent = 'Választott műveletek: '+prettierSelection;
      }
  
      function diceDropdown(diceIndex) {
        let selectedPlayers = [];
        if (playerSelection){
          playerSelection = false;
          rerollButton.style.display="none";
          document.getElementById('dices').children[selectedDiceIndex].style.removeProperty('filter');
          selectedDiceIndex=-1;
          revertHighlightPlayers();
        } else {
          let dice = player.curDices[diceIndex];
  
          if (dice.type == 1){
            dice.rerollsLeft = 0;
          }
          if (dice.rerollsLeft>0 && dice.type!=1){
            //reroll
            playerSelection = true;
            selectedDiceIndex=diceIndex
            let rerollButton = document.getElementById("rerollButton");
            rerollButton.value = "Újradobás ("+dice.rerollsLeft+" maradt)";
            rerollButton.style.display="block";
          }

            let alivePlayers = playersAr.filter(x=>x.life>0);
  
            //players the player can effect with the dice
            if (dice.type===2 || dice.type===3 || dice.type===4){
              let prevPlayer,nextPlayer;
  
              let aliveIndex = alivePlayers.findIndex(x=>x===player);
  
              let shootingDistances = [];
              if (dice.type === 2 || (dice.type === 3 && alivePlayers.length<=3)){
                shootingDistances.push(1);
                } else if (dice.type === 3){
                  shootingDistances.push(2);
                }
                
              //character check: calamity jane
              if (player.character.name === "calamity_janet"){
                if (shootingDistances[0]==1){
                  shootingDistances.push(2);
                } else{
                  shootingDistances.push(1);
                }
              }
              //character check: rose doolan
              if (player.character.name === "rose_doolan"){
                shootingDistances.push(shootingDistances[0]+1);
              }
  
              if (dice.type === 2 || dice.type === 3){ //gun
                for (let shootingDistance of shootingDistances){
                  if (aliveIndex < shootingDistance){
                    prevPlayer = alivePlayers[aliveIndex-shootingDistance+alivePlayers.length];
                  } else {
                    prevPlayer = alivePlayers[aliveIndex-shootingDistance];
                  }
                  if (aliveIndex >= alivePlayers.length-shootingDistance){
                    nextPlayer = alivePlayers[aliveIndex+shootingDistance-alivePlayers.length];
                  }  else {
                    nextPlayer = alivePlayers[aliveIndex+shootingDistance];
                  }
                  selectedPlayers.push(prevPlayer);
                  selectedPlayers.push(nextPlayer);
    
                }
                } else if (dice.type === 4){ //beer
    
                  for (let p of alivePlayers){
                    selectedPlayers.push(p);
                  }
                }
                for (let p of selectedPlayers){
                  highlightPlayer(dice,p);
                }
              }
        }
        }

        function highlightPlayer(dice, playerToHighlight){
          let playerNameDiv = document.getElementById("player_"+playerToHighlight.name);
          playerNameDiv.classList.add('highlighted');
          playerNameDiv.onclick = () => selectTarget(dice,playerToHighlight);
        }
        function revertHighlightPlayers(){
          let highlightedDivs = document.getElementsByClassName("highlighted");
          while(highlightedDivs.length){ //todo
            highlightedDivs[0].removeAttribute('onclick');
            highlightedDivs[0].classList.remove('highlighted');
          }
        }


      function drawDices(dices){
        document.getElementById('dices').style.display = 'block';
        for (let i = 0; i < 5;i++){
          diceElements[i].src = 'images/d'+(dices[i].type)+'.webp';
          diceElements[i].setAttribute('onclick',`diceDropdown(${i})`);
          if (dices[i].abilityActivated) {
            diceElements[i].classList.add("abilityActivated");
        } else {
          diceElements[i].classList.remove("abilityActivated");
        }
      }
    }

      //event listeners

      document.getElementById('roll').addEventListener('click',function(){
        socket.emit('roll');
      });
      document.getElementById('endTurnButton').addEventListener('click', function(){
        socket.emit('endTurn',player.selections);
        player.selections = [];
        printSelections(player.selections,document.getElementById('selections'));
        player.curDices = [];
        document.getElementById('endTurnButton').disabled = true;
      });
      document.getElementById('resetSelectionsButton').addEventListener('click', function(){
        for (let i = 0; i < player.selections.length; i++){
          if (player.selections[i] != 0 && player.selections[i] != 1 && player.selections[i] != 4 && player.selections[i] != 5){ //add all non-arrows to selections
            player.selections[i] = null;
            }
        }
        printSelections(player.selections, document.getElementById('selections'));
        revertHighlightPlayers();
      });
      document.getElementById('chatInput').addEventListener('submit', function(event){
        event.preventDefault();
        socket.emit("sendMessage", document.getElementById('chatInputText').value);
      });

    rerollButton.addEventListener('click', function(event){
      event.preventDefault();
      let dice = player.curDices[selectedDiceIndex];
      socket.emit('reroll', dice.index);
      player.selections = [];
      printSelections(player.selections, document.getElementById('selections'));
      rerollButton.style.display = "none";
      resetSelection();
      });

      function resetSelection(){
        playerSelection = false;
        if (selectedDiceIndex != -1){
          document.getElementById('dices').children[selectedDiceIndex].style.removeProperty('filter');
          selectedDiceIndex = -1;
        }
        revertHighlightPlayers();
      }
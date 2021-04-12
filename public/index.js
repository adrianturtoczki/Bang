let socket = io();

      var urlParams = new URLSearchParams(window.location.search);
      socket.emit('setup',urlParams.get('room'));
      
      //setup
      let d1 = new Image();
      let d2 = new Image();
      let d3 = new Image();
      let d4 = new Image();
      let d5 = new Image();
      let dice_elements = [d1,d2,d3,d4,d5];
      document.getElementById('dices').appendChild(d1);
      document.getElementById('dices').appendChild(d2);
      document.getElementById('dices').appendChild(d3);
      document.getElementById('dices').appendChild(d4);
      document.getElementById('dices').appendChild(d5);

      let playersAlive;
      let playersAr = [];
      let playerIndex = -1;
      let playerRole;
      let player;

      socket.on('a_player_disconnected',a_player_disconnected);
      socket.on('current_turn',current_turn);
      socket.on('players_data_setup', players_data_setup);
      socket.on('players_data_refresh',players_data_refresh);
      socket.on('rollResults',rollResults);
      socket.on('gameEnd', gameEnd);
      socket.on('update_chat',update_chat);

      function update_chat(game_chat){
          //printing chat
          let chat_id = document.getElementById('chat');
          chat_id.innerHTML = '';
          console.log(game_chat)
          for (let i = game_chat.length-1; i > 0; i--){
            let p = document.createElement('p');
            p.appendChild(document.createTextNode(game_chat[i]));
            chat_id.appendChild(p);
          }
      }

      function a_player_disconnected(){
        alert('Egy játékos  kilépett. Visszalépés a főoldalra.');
        window.location.href = '/';
      }

      function current_turn(turn_name){
        document.getElementById('curTurn').textContent='Jelenlegi kör: '+turn_name;
      }

      function cur_player_data(player) {
        //player data


        //document.getElementById('player_health_number').textContent=player.life;
        //document.getElementById('player_arrow_number').textContent=player.arrows;

        if (player.curTurn===true&&player.rolled===false){
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

        function createPlayer(p,div_to_append,playerRole){
          let p_div = document.createElement('div');
            p_div.classList.add("player_data");
            p_div.id="player_"+p.name;
            let p_div_name = document.createElement('div');
            let p_div_life_arrows_char = document.createElement('div');
            let p_div_life_arrows = document.createElement('div');
            let pRole_div = document.createElement('div');
            let p_name = document.createElement('h3');
            let p_life = document.createElement('p');
            let p_arrows = document.createElement('p');
            let p_life_img = document.createElement('img');
            let p_arrows_img = document.createElement('img');
            let pChar = document.createElement('img');
            pChar.classList.add("char_img");
            let pRole = document.createElement('img');
            pRole.classList.add("role_img");
            p_name.appendChild(document.createTextNode(p.name));
            p_life.appendChild(document.createTextNode(p.life));
            p_arrows.appendChild(document.createTextNode(p.arrows));
            pChar.src = 'images/c_'+p.character.name+'.jpg';
            pRole.src= 'images/r_'+playerRole+'.jpg';
            p_arrows_img.src='images/arrow.png';
            p_arrows_img.style.height="50px";
            p_life_img.src='images/bullet.png';
            p_life_img.style.height=p_arrows_img.style.height;

            p_div_name.appendChild(p_name);
            p_div_life_arrows.appendChild(p_life);
            p_div_life_arrows.appendChild(p_life_img);
            p_div_life_arrows.appendChild(p_arrows);
            p_div_life_arrows.appendChild(p_arrows_img);
            p_div_life_arrows.classList.add("bullets_arrows_div");
            p_div_life_arrows_char.appendChild(p_div_name);
            p_div_life_arrows_char.appendChild(p_div_life_arrows);
            p_div_life_arrows_char.appendChild(pChar);
            p_div.appendChild(p_div_life_arrows_char);
            pRole_div.appendChild(pRole);
            p_div.appendChild(pRole_div);
            div_to_append.appendChild(p_div);
        }

      function players_data_setup([players,index,role,arrowsLeft]){

        document.getElementById('wait_screen').style.display = 'none';
        document.getElementById('game').classList.toggle('game_wait');

        playerIndex = index;
        playerRole = role;
        player = players[index];

        cur_player_data(player);

        console.log(playerRole);
        createPlayer(player,document.getElementById("player"),playerRole);

        document.getElementById('otherPlayers').innerHTML='';
      for (let p of players){
          if (p!=player){
            createPlayer(p,document.getElementById('otherPlayers'),p.role);
            }
          document.getElementById('arrowsLeft').textContent = 'Maradt '+arrowsLeft+' nyíl';
        }

        if (player.rolled&&player.curDices!=[]){
          drawDice(player.curDices);
        }
      }

      function players_data_refresh([players,arrowsLeft,pAlive,game_log]){
        playersAr = players;
        player = playersAr[playerIndex];
        playersAlive = pAlive;
        cur_player_data(players[playerIndex]);

          //other players data
          let p_data_divs = document.getElementById('otherPlayers').children;
          for (let p of playersAr){
            if (p.index!=playerIndex){
              p_data_div = document.getElementById("player_"+p.name);
              p_data_div.children[0].children[0].children[0].textContent=p.name;
              p_data_div.children[0].children[1].children[0].textContent=p.life;
              p_data_div.children[0].children[1].children[2].textContent=p.arrows;
              p_data_div.children[0].children[1].src= 'images/c_'+p.character.name+'.jpg';
              if (p.life<=0) p_data_div.children[0].children[2].src= 'images/r_'+p.role+'.jpg';
              }
            }
          document.getElementById('arrowsLeft').textContent = 'Maradt '+arrowsLeft+' nyíl';

          //printing logs
          let log_id = document.getElementById('log');
          log_id.innerHTML = '';
          console.log(game_log)
          for (let i = game_log.length-1; i > 0; i--){
            let p = document.createElement('p');
            p.appendChild(document.createTextNode(game_log[i]));
            log_id.appendChild(p);
          }
          
      }

      function rollResults([roll_result,selections]){
        player.curDices = roll_result;
        player.selections = selections;


        drawDice(player.curDices);
        checkSelections(selections,document.getElementById('endTurnButton'));
      }

      function gameEnd(winner){
        alert('Nyert: '+winner);
        window.location.href = '/';
      }


      function checkSelections(selections,endTurnButton){
        if (selections.filter(x=>x!=null).length===5){
          endTurnButton.disabled = false;
        } else {
          endTurnButton.disabled = true;
        }
      }

      function selectTarget(diceIndex,playerIndex){
        let dice = player.curDices[diceIndex];
        document.getElementById("resolveDropdown").classList.toggle("show");
        player.selections[dice.index] = [dice.type,playerIndex];
        print_selections(player.selections,document.getElementById('selections'));

        checkSelections(player.selections,document.getElementById('endTurnButton'));
      }

      function print_selections(selections,selectionsDiv){
        console.log(selections);
        console.log(playersAr);
        let prettierSelection = '';
        for (let s of selections){
          if (s!=null&&s!=0&&s!=1&&s!=5){
            if (s[0]===2||s[0]===3){
              prettierSelection+="Célkereszt->";
            } else if (s[0]===4){
              prettierSelection+="Sör ->";
            }
            prettierSelection+=playersAr[s[1]].name+';';
          }
        }


        selectionsDiv.textContent = 'Választott műveletek: '+prettierSelection;
      }
  
      function diceDropdown(diceIndex) {
        let resolveDropdownDiv = document.getElementById('resolveDropdown');
        resolveDropdownDiv.innerHTML='';
        let dice = player.curDices[diceIndex];

        if (dice.type!=1){
          document.getElementById("resolveDropdown").classList.toggle("show");
        }
        if (dice.rerollsLeft>0){
          //reroll
          let reroll_button = document.createElement('p');
          reroll_button.appendChild(document.createTextNode("Újradobás ("+dice.rerollsLeft+" maradt)"));
          reroll_button.addEventListener('click',function(){
            document.getElementById("resolveDropdown").classList.toggle("show");
            console.log("reroll button clicked for "+[dice.type,dice.index]);
            socket.emit('reroll',dice.index);
            player.selections = [];
            print_selections(player.selections,document.getElementById('selections'));
            });
            resolveDropdownDiv.appendChild(reroll_button);
          }

          let alive_players = playersAr.filter(x=>x.life>0);

          //players the player can effect with the dice
          if (dice.type===2||dice.type===3||dice.type===4){
            let prevPlayer,nextPlayer;

            let aliveIndex = alive_players.findIndex(x=>x===player);

            let shootingDistances = [];
            if (dice.type===2||(dice.type===3&&alive_players.length<=3)){
              shootingDistances.push(1);
              } else if (dice.type===3){
                shootingDistances.push(2);
              }
              
            //character check: calamity jane
            if (player.character.name==="calamity_janet"){
              if (shootingDistances[0]==1){
                shootingDistances.push(2);
              } else{
                shootingDistances.push(1);
              }
            }
            //character check: rose doolan
            if (player.character.name==="rose_doolan"){
              shootingDistances.push(shootingDistances[0]+1);
            }

            if (dice.type===2||dice.type===3){ //arrow2
              for (let shootingDistance of shootingDistances){
                let p_name = document.createElement('p');
                let n_name = document.createElement('p');
                console.log(shootingDistances)
                if (aliveIndex < shootingDistance){
                  prevPlayer = alive_players[aliveIndex-shootingDistance+alive_players.length];
                } else {
                  prevPlayer = alive_players[aliveIndex-shootingDistance];
                }
                if (aliveIndex >= alive_players.length-shootingDistance){
                  nextPlayer = alive_players[aliveIndex+shootingDistance-alive_players.length];
                }  else {
                  nextPlayer = alive_players[aliveIndex+shootingDistance];
                }
                p_name.appendChild(document.createTextNode(prevPlayer.name));
                n_name.appendChild(document.createTextNode(nextPlayer.name));
                p_name.setAttribute('onclick','selectTarget('+dice.index+','+prevPlayer.index+')');
                n_name.setAttribute('onclick','selectTarget('+dice.index+','+nextPlayer.index+')'); 
  
                resolveDropdownDiv.appendChild(p_name);
                if (prevPlayer!=nextPlayer){
                  resolveDropdownDiv.appendChild(n_name);
                  }
                }
              } else if (dice.type===4){ //beer
  
                for (let p of alive_players){
                  let b_name = document.createElement('p');
                  b_name.appendChild(document.createTextNode(p.name));
                  b_name.setAttribute('onclick','selectTarget('+dice.index+','+p.index+')');
                  resolveDropdownDiv.appendChild(b_name);
                }
              }
            }
        }


      function drawDice(dices){
        document.getElementById('dices').style.display = 'block';
        for (let i = 0; i < 5;i++){
          dice_elements[i].src = 'images/d'+(dices[i].type)+'.png';
          dice_elements[i].setAttribute('onclick',`diceDropdown(${i})`);
          if (dices[i].abilityActivated) {
            dice_elements[i].style.opacity=0.4;
        } else {
          dice_elements[i].style.opacity=1;
        }
      }
    }

      //event listeners

      document.getElementById('roll').addEventListener('click',function(){
        console.log("roll button clicked");
        socket.emit('roll');
      });
      document.getElementById('endTurnButton').addEventListener('click',function(){
        console.log("end turn button clicked");
        socket.emit('endTurn',player.selections);
        player.selections = [];
        print_selections(player.selections,document.getElementById('selections'));
        player.curDices = [];
        document.getElementById('endTurnButton').disabled = true;
      });
      document.getElementById('resetSelectionsButton').addEventListener('click',function(){
        console.log("reset selections button clicked");
        for (let i = 0; i<player.selections.length;i++){
          if (player.selections[i] != 0 && player.selections[i] != 1 && player.selections[i] != 4 && player.selections[i] != 5){ //add all non-arrows to selections
            player.selections[i] = null;
            }
        }
        print_selections(player.selections,document.getElementById('selections'));
      });
      document.getElementById('chatInput').addEventListener('submit',function(event){
        event.preventDefault();
        socket.emit("send_message",document.getElementById('chatInputText').value);
      });



      //TODO: hide dropdown after clicking outside

      //todo fix: confirm dialog when leaving page
      //window.onbeforeunload = function(){return 'Are you sure you want to quit?'};
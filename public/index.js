let socket = io();

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

      let players_alive;
      let players_ar = [];
      let playerIndex = -1;
      let player_role;
      let player;

      socket.on('all_players_connected',(players)=>{
        document.getElementById('wait_screen').style.display = 'none';
        document.getElementById('game').classList.toggle('game_wait');
        
        players_ar = players;
        players_alive = players_ar.length;
      });

      socket.on('a_player_disconnected',()=>{
        document.getElementById('wait_screen').style.display = 'block';
        document.getElementById('game').classList.toggle('game_wait');
      });

      socket.on('current_turn',(turn_name)=>{
        document.getElementById('cur_turn').textContent='Current turn: '+turn_name;
        });

      function cur_player_data(player) {
        //player data

        document.getElementById('player_health_number').textContent='Your health: '+player.life;
        document.getElementById('player_arrow_number').textContent='Your arrows: '+player.arrows;

        if (player.cur_turn===true&&player.rolled===false){
          document.getElementById('dices').style.display = 'none';
          document.getElementById("roll").style.display = "block";
        } else {
          document.getElementById("roll").style.display = "none";
        }
        if (player.cur_turn===true){
          document.getElementById("roll_div").style.display = "block";
        } else {
          document.getElementById("roll_div").style.display = "none";
          }
        }


      socket.on('players_data_refresh',([players,arrows_left,p_alive])=>{
        players_ar = players;
        player = players_ar[playerIndex];
        players_alive = p_alive;
        cur_player_data(players[playerIndex]);

          //other players data
          let p_data_divs = document.getElementById('other_players').children;
          for (let i = 0; i < p_data_divs.length; i++){
            let p = players[i];
            p.sheriff ? p_data_divs[i].children[0].textContent=p.name+" (sheriff)" : p_data_divs[i].children[0].textContent=p.name;
            p_data_divs[i].children[1].textContent=p.name+"'s life: "+p.life;
            p_data_divs[i].children[2].textContent=p.name+"'s arrows: "+p.arrows;
            }
          document.getElementById('arrows_left').textContent = 'Arrows left: '+arrows_left;
        });

      socket.on('players_data_setup', ([players,index,role,arrows_left]) => {
        playerIndex = index;
        player_role = role;
        player = players[index];

        cur_player_data(player);

        document.getElementById('player_name').textContent='Your name: '+player.name;
        document.getElementById('player_role_image').src = 'images/r_'+player_role+'.jpg';
        document.getElementById('player_character_image').src = 'images/c_'+player.character.name+'.jpg';
        document.getElementById('other_players').innerHTML='';
      for (let p of players){
          let p_div = document.createElement('div');
          p_div.id=p.index;
          let p_name = document.createElement('p');
          let p_life = document.createElement('p');
          let p_arrows = document.createElement('p');
          let p_char = document.createElement('img');
          p.sheriff ? p_name.appendChild(document.createTextNode(p.name+" (sheriff)")) : p_name.appendChild(document.createTextNode(p.name));
          p_life.appendChild(document.createTextNode(p.name+"'s life: "+p.life));
          p_arrows.appendChild(document.createTextNode(p.name+"'s arrows: "+p.arrows));
          p_char.src = 'images/c_'+p.character.name+'.jpg';

          p_div.appendChild(p_name);
          p_div.appendChild(p_life);
          p_div.appendChild(p_arrows);
          p_div.appendChild(p_char);

          document.getElementById('other_players').appendChild(p_div);
          document.getElementById('arrows_left').textContent = 'Arrows left: '+arrows_left;
        }

        if (player.rolled&&player.cur_dices!=[]){
          draw_dice(player.cur_dices);
        }

        });

      socket.on('roll_results', ([roll_result,selections]) => {
        player.cur_dices = roll_result;
        player.selections = selections;


        draw_dice(player.cur_dices);

        check_selections(selections);
        });

      socket.on('game_end', (winner) => {
        alert(winner+'s won!');
        window.location.href = '/';
      });

      function check_selections(selections){
        if (selections.filter(x=>x!=null).length===5){
          document.getElementById('end_turn_button').disabled = false;
        } else {
          document.getElementById('end_turn_button').disabled = true;
        }
      }

      function select_target(dice_index,player_index){
        let dice = player.cur_dices[dice_index];
        document.getElementById("resolve_dropdown").classList.toggle("show");
        player.selections[dice.index] = [dice.type,player_index];
        print_selections(player.selections);

        check_selections(player.selections);
      }

      function print_selections(selections){
        let prettier_selection = '';
        for (let s of selections){
          if (s!=null&&s!=0&&s!=1&&s!=5){
            if (s[0]===2||s[0]===3){
              prettier_selection+="Shoot ";
            } else if (s[0]===4){
              prettier_selection+="Heal ";
            }
            prettier_selection+=players_ar[s[1]].name+';';
          }
        }


        document.getElementById('selections').textContent = 'Your selections: '+prettier_selection;
      }
  
      function dice_dropdown(dice_index) {
        let resolve_dropdown_div = document.getElementById('resolve_dropdown');
        resolve_dropdown_div.innerHTML='';
        let dice = player.cur_dices[dice_index];

        if (dice.type!=1){
          document.getElementById("resolve_dropdown").classList.toggle("show");
        }
        if (dice.rerolls_left>0){
          //reroll
          let reroll_button = document.createElement('p');
          reroll_button.appendChild(document.createTextNode("Reroll ("+dice.rerolls_left+" left)"));
          reroll_button.addEventListener('click',function(){
            document.getElementById("resolve_dropdown").classList.toggle("show");
            console.log("reroll button clicked for "+[dice.type,dice.index]);
            socket.emit('reroll',dice.index);
            player.selections = [];
            print_selections(player.selections);
            });
            resolve_dropdown_div.appendChild(reroll_button);
          }

          let alive_players = players_ar.filter(x=>x.life>0);

          //players the player can effect with the dice
          if (dice.type===2||dice.type===3||dice.type===4){
            let prev_player,next_player;
            let p_name = document.createElement('p');
            let n_name = document.createElement('p');

            let alive_index = alive_players.findIndex(x=>x===player);

            let shooting_distance;
            if (dice.type===2||(dice.type===3&&alive_players.length<=3)){
              shooting_distance = 1;
              } else if (dice.type===3){
                shooting_distance = 2;
              }


            if (dice.type===2||dice.type===3){ //arrow2
              if (alive_index < shooting_distance){
                prev_player = alive_players[alive_index-shooting_distance+alive_players.length];
              } else {
                prev_player = alive_players[alive_index-shooting_distance];
              }
              if (alive_index >= alive_players.length-shooting_distance){
                next_player = alive_players[alive_index+shooting_distance-alive_players.length];
              }  else {
                next_player = alive_players[alive_index+shooting_distance];
              }
              p_name.appendChild(document.createTextNode(prev_player.name));
              n_name.appendChild(document.createTextNode(next_player.name));
              p_name.setAttribute('onclick','select_target('+dice.index+','+prev_player.index+')');
              n_name.setAttribute('onclick','select_target('+dice.index+','+next_player.index+')'); 

              resolve_dropdown_div.appendChild(p_name);
              if (prev_player!=next_player){
                resolve_dropdown_div.appendChild(n_name);
              }

            } else if (dice.type===4){ //beer

              for (let p of alive_players){
                let b_name = document.createElement('p');
                b_name.appendChild(document.createTextNode(p.name));
                b_name.setAttribute('onclick','select_target('+dice.index+','+p.index+')');
                resolve_dropdown_div.appendChild(b_name);
              }
            }
          } //todo maybe gatling?
      }


      function draw_dice(dices){
        document.getElementById('dices').style.display = 'block';
        for (let i = 0; i < 5;i++){
          dice_elements[i].src = 'images/d'+(dices[i].type)+'.png';
          dice_elements[i].setAttribute('onclick',`dice_dropdown(${i})`);
        }
      }

      //event listeners

      document.getElementById('roll').addEventListener('click',function(){
        console.log("roll button clicked");
        socket.emit('roll');
      });
      document.getElementById('end_turn_button').addEventListener('click',function(){
        console.log("end turn button clicked");
        socket.emit('end_turn',player.selections);
        player.selections = [];
        print_selections(player.selections);
        player.cur_dices = [];
        document.getElementById('end_turn_button').disabled = true;
      });
      document.getElementById('reset_selections_button').addEventListener('click',function(){
        console.log("reset selections button clicked");
        for (let i = 0; i<player.selections.length;i++){
          if (player.selections[i] != 0 && player.selections[i] != 1 && player.selections[i] != 4 && player.selections[i] != 5){ //add all non-arrows to selections
            player.selections[i] = null;
            }
        }
        print_selections(player.selections);
      });

      //TODO: hide dropdown after clicking outside
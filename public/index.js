var socket = io();

      //setup
      let d1 = new Image();
      let d2 = new Image();
      let d3 = new Image();
      let d4 = new Image();
      let d5 = new Image();
      document.getElementById('dices').appendChild(d1);
      document.getElementById('dices').appendChild(d2);
      document.getElementById('dices').appendChild(d3);
      document.getElementById('dices').appendChild(d4);
      document.getElementById('dices').appendChild(d5);

      let selections = [];

      let current_dices = [];

      let players_ar = [];

      let players_alive;

      let playerIndex = -1;

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

      socket.on('turn_and_round',([turn_name,round])=>{
        document.getElementById('cur_round').textContent='Current round: '+round;
        document.getElementById('cur_turn').textContent='Current turn: '+turn_name;
        });

      function cur_player_data(player) {
        //player data

        document.getElementById('player_health_number').textContent='Your health: '+player.life;
        document.getElementById('player_arrow_number').textContent='Your arrows: '+player.arrows;
        document.getElementById('roll_count').textContent='Rolls left: '+(player.roll_num);

        if (player.cur_turn===true&&player.roll_num>0){
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
        players_alive = p_alive;
        console.log("data refresh called,"+players);
        cur_player_data(players[playerIndex]);

          //other players data
          let p_data_divs = document.getElementById('other_players').children;
          for (let i = 0; i < p_data_divs.length; i++){
            let p = players[i];
            p_data_divs[i].children[0].textContent=p.name;
            p_data_divs[i].children[1].textContent=p.name+"'s life: "+p.life;
            p_data_divs[i].children[2].textContent=p.name+"'s arrows: "+p.arrows;
            }
          document.getElementById('arrows_left').textContent = 'Arrows left: '+arrows_left;
        });

      socket.on('players_data_setup', ([players,index,arrows_left]) => {
        playerIndex = index;
        player = players[index];
        cur_player_data(player);

        document.getElementById('player_name').textContent='Your name: '+player.name;

        //set image based on role
        switch(player.role){
          case 'sheriff':
            document.getElementById('player_role_image').src = 'images/r_sheriff.jpg';
            break;
          case 'renegade':
            document.getElementById('player_role_image').src = 'images/r_renegade.jpg';
            break;
          case 'outlaw':
            document.getElementById('player_role_image').src = 'images/r_outlaw.jpg';
            break;
          case 'deputy':
            document.getElementById('player_role_image').src = 'images/r_deputy.jpg';
            break;
        }

        //set image based on character
        switch(player.character){
          case 'suzy_lafayette':
            document.getElementById('player_character_image').src = 'images/c_suzy_lafayette.jpg';
            break;
          case 'black_jack':
            document.getElementById('player_character_image').src = 'images/c_black_jack.jpg';
            break;
          case 'lucky_duke':
            document.getElementById('player_character_image').src = 'images/c_lucky_duke.jpg';
            break;
          case 'willy_the_kid':
            document.getElementById('player_character_image').src = 'images/c_willy_the_kid.jpg';
            break;
        }

        document.getElementById('other_players').innerHTML='';
      for (let p of players){
          var p_div = document.createElement('div');
          var p_name = document.createElement('p');
          var p_life = document.createElement('p');
          var p_arrows = document.createElement('p');
          p_name.appendChild(document.createTextNode(p.name));
          p_life.appendChild(document.createTextNode(p.name+"'s life: "+p.life));
          p_arrows.appendChild(document.createTextNode(p.name+"'s arrows: "+p.arrows));

          p_div.appendChild(p_name);
          p_div.appendChild(p_life);
          p_div.appendChild(p_arrows);

          document.getElementById('other_players').appendChild(p_div);

          document.getElementById('arrows_left').textContent = 'Arrows left: '+arrows_left;

        }
        });

      socket.on('roll_results', (roll_results) => {
      draw_dice(roll_results);
        });

      function select_player(dice_type,dice_number,player_index){
        document.getElementById("resolve_dropdown").classList.toggle("show");
        console.log("select_player "+dice_type+","+dice_number+","+player_index);
        selections[dice_number] = [dice_type,player_index];

        print_selections(selections);
      }

      function print_selections(selections){

        let prettier_selection = '';

        console.log(selections);

        for (let s of selections){
          if (s!=null){
            console.log(selections);
            if (s[0]===2||s[0]===3){
              prettier_selection+="Shoot ";
            } else if (s[0]===4){
              prettier_selection+="Heal ";
            }
            prettier_selection+=players_ar[s[1]].name;
            prettier_selection+=';';
          }
        }


        document.getElementById('selections').textContent = 'Your selections: '+prettier_selection; //TODO: make it more aesthetic, like : Shoot Player 1, Heal Player 2
      }
  
      function dice_dropdown(dice_type,dice_number) {
        let resolve_dropdown_div = document.getElementById('resolve_dropdown');
        resolve_dropdown_div.innerHTML='';

        //reroll
        var reroll_button = document.createElement('p');
        if (players_ar[playerIndex].roll_num>0){
          reroll_button.appendChild(document.createTextNode("Reroll ("+players_ar[playerIndex].roll_num+" left)"));
          reroll_button.addEventListener('click',function(){
            console.log("roll button clicked");
            socket.emit('roll');
          });
          resolve_dropdown_div.appendChild(reroll_button);
          }
        //players the player can effect with the dice
        if (dice_type===2||dice_type===3||dice_type===4){
          var p_name = document.createElement('p');
          var n_name = document.createElement('p');

          if (dice_type===2||(dice_type===3&&players_alive<=3)){ //arrow1 if arrow1, or if there are only 2-3 players left with arrow2
            console.log(playerIndex,players_ar.length,players_ar,players_ar[playerIndex+1]);
            var prev_player = playerIndex == 0 ? players_ar[players_ar.length-1] : players_ar[playerIndex-1];
            var next_player = playerIndex == players_ar.length-1 ? players_ar[0] : players_ar[playerIndex+1];

            p_name.appendChild(document.createTextNode(prev_player.name));
            n_name.appendChild(document.createTextNode(next_player.name));

            p_name.setAttribute('onclick','select_player('+dice_type+','+dice_number+','+prev_player.index+')');
            n_name.setAttribute('onclick','select_player('+dice_type+','+dice_number+','+next_player.index+')');

            resolve_dropdown_div.appendChild(n_name);

          } else if (dice_type===3){
            if (playerIndex == 0){
              var prev_player = players_ar[players_ar.length-2];
            } else if (playerIndex == 1){
              var prev_player = players_ar[players_ar.length-1];
            } else {
              var prev_player = players_ar[playerIndex-2];
            }
            if (playerIndex + 1 == players_ar.length-1){
              var next_player = players_ar[0];
            } else if (playerIndex == players_ar.length-1){
              var next_player = players_ar[1];
            } else {
              var next_player = players_ar[playerIndex+2];
            }

            console.log([prev_player,next_player]);

            p_name.appendChild(document.createTextNode(prev_player.name));
            n_name.appendChild(document.createTextNode(next_player.name));

            p_name.setAttribute('onclick','select_player('+dice_type+','+dice_number+','+prev_player.index+')');
            n_name.setAttribute('onclick','select_player('+dice_type+','+dice_number+','+next_player.index+')'); 

            resolve_dropdown_div.appendChild(n_name);

          } else if (dice_type===4){

            for (let p of players_ar){
              var b_name = document.createElement('p');
              b_name.appendChild(document.createTextNode(p.name));
              b_name.setAttribute('onclick','select_player('+dice_type+','+dice_number+','+p.index+')');
              resolve_dropdown_div.appendChild(b_name);
            }

          }
          resolve_dropdown_div.appendChild(p_name);

          document.getElementById("resolve_dropdown").classList.toggle("show");
        }
      }

      function draw_dice(dices){
        d1.src = null;
        d2.src = null;
        d3.src = null;
        d4.src = null;  
        d5.src = null;
        for (let i = 0; i<5;i++){
          switch(i){
            case 0:
              d1.src = 'images/d'+(dices[i]+1)+'.png';
              d1.setAttribute('onclick',`dice_dropdown(${dices[i]},${i})`);
              break;
            case 1:
              d2.src = 'images/d'+(dices[i]+1)+'.png';
              d2.setAttribute('onclick',`dice_dropdown(${dices[i]},${i})`);
              break;
            case 2:
              d3.src = 'images/d'+(dices[i]+1)+'.png';
              d3.setAttribute('onclick',`dice_dropdown(${dices[i]},${i})`);
              break;
            case 3:
              d4.src = 'images/d'+(dices[i]+1)+'.png';
              d4.setAttribute('onclick',`dice_dropdown(${dices[i]},${i})`);
              break;
            case 4:
              d5.src = 'images/d'+(dices[i]+1)+'.png';
              d5.setAttribute('onclick',`dice_dropdown(${dices[i]},${i})`);
              break;
          }
        }
      }

      //event listeners

      document.getElementById('roll').addEventListener('click',function(){
        console.log("roll button clicked");
        socket.emit('roll');
      });
      document.getElementById('resolve_button').addEventListener('click',function(){
        console.log("resolve button clicked");
        socket.emit('resolve',selections);

        selections = [];
        print_selections(selections);
      });
      document.getElementById('end_turn_button').addEventListener('click',function(){
        console.log("end turn button clicked");
        socket.emit('end_turn');
        selections = [];
        print_selections(selections);
      });

      //TODO: fix        ;hides dropdown after clicking outside
      window.onclick = function(event) {
        if (event.target.matches('.dropdown')) {
          console.log("clicking outside dropdown");
        }
      }

    
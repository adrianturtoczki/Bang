let rooms;
let room_div = document.getElementById("rooms");


function get_name(room_name){
    let player_name = prompt();
    if (player_name){
        fetch("/join_room", {
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({player_name:player_name,room_name:room_name})
          }).then(res => res.json()).then(data=>{
              //if room goodc
              console.log(data.accepted);
              if (data.accepted=="true"){
                  console.log("ok");
                  window.location.href="/game?room="+room_name;
              } else {
                  console.log("error: name already in room!");
              }
          });
    }
}

setInterval(x => get_rooms(), 1000);
function get_rooms(){
    fetch('/rooms').then(function(result){
        console.log(result);
        return result.json();
    }).then(function(r){
        rooms = r;
        room_div.innerHTML = "";

        if (rooms.length){
            for (let room of rooms){
                let r_name = document.createElement('p');
                r_name.textContent = room.name;
                let r_player_number = document.createElement('p');
                r_player_number.textContent = room.player_limit; //todo change
                let r_players_left = document.createElement('p');
                r_players_left.textContent = room.players_left //todo change;
                let r_div = document.createElement('div');
                r_div.appendChild(r_name);
                r_div.appendChild(r_player_number);
                r_div.appendChild(r_players_left);
                if (room.players_left>0){
                    let r_join_button = document.createElement('button');
                    r_join_button.textContent = "Join";
                    r_join_button.addEventListener('click',function(){
                        get_name(room.name);
                        });
                    r_div.appendChild(r_join_button);
                }
                room_div.appendChild(r_div);
            }
        } else {
            room_div.innerHTML = "nincs jelenleg szoba."
        }
    
    
    });
}
get_rooms();
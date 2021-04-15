
let rooms = [];
let roomDiv = document.getElementById("rooms");


function getName(roomName){
    let playerName = prompt();
    if (playerName){
        fetch("/join_room", {
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({playerName:playerName,roomName:roomName})
          }).then(res => res.json()).then(data=>{
              //if room good
              console.log(data.accepted);
              if (data.accepted=="true"){
                  console.log("ok");
                  window.location.href="/game?room="+roomName;
              } else {
                  console.log("error: name already in room!");
              }
          });
    }
}

setInterval(x => getRooms(), 2000);
function getRooms(){
    fetch('/rooms').then(function(result){
        console.log(result);
        return result.json();
    }).then(function(r){
        //rooms = r;

        if (r.length){
            for (let room of r){
                if (rooms.some(x=>x.name===room.name)){
                    updateRoomDiv(room);
                } else {
                    createRoomDiv(room);

                }
            }
        } else {
            roomDiv.innerHTML = "nincs jelenleg szoba."
            rooms = [];
        }
    
    
    });
}

function updateRoomDiv(room){
    let rDiv = document.getElementById(room.name);
    rDiv.children[2].textContent = room.playersLeft;
}

function createRoomDiv(room){
    let rName = document.createElement('p');
    rName.textContent = room.name;
    let rPlayerNumber = document.createElement('p');
    rPlayerNumber.textContent = room.playerLimit; //todo change
    let rPlayersLeft = document.createElement('p');
    rPlayersLeft.textContent = room.playersLeft //todo change;
    let rDiv = document.createElement('div');
    rDiv.id=room.name;
    rDiv.appendChild(rName);
    rDiv.appendChild(rPlayerNumber);
    rDiv.appendChild(rPlayersLeft);
    if (room.playersLeft>0){
        let rJoinButton = document.createElement('button');
        rJoinButton.textContent = "Join";
        rJoinButton.addEventListener('click',function(){
            getName(room.name);
            });
        rDiv.appendChild(rJoinButton);
    }
    roomDiv.appendChild(rDiv);
    rooms.push(room);
}
getRooms();
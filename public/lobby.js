const create_room__btn = document.getElementById("create_room__btn");
const join_room__btn = document.getElementById("join_room__btn");
const help__btn = document.getElementById("help__btn");
const join_room_send__btn = document.getElementById("join_room_send__btn");
const join_room__form = document.getElementById("join_room__form");
const modal = document.getElementById("modal");
const closes = document.getElementsByClassName("close");
const selectedRoom = document.getElementById("roomName");

create_room__btn.addEventListener("click",() => create_room__modal.style.display = "block");
join_room__btn.addEventListener("click",() => {
    join_room__modal.style.display = "block";
    getRooms();
});
help__btn.addEventListener("click",() => help__modal.style.display = "block");
join_room__form.addEventListener("submit",(event) => joinRoom(event));

window.addEventListener("click",(event) => {
    if (event.target==create_room__modal){create_room__modal.style.display="none"};
    if (event.target==join_room__modal){
        join_room__modal.style.display="none";
        clearInterval(roomInterval);
    };
    if (event.target==join_room_form__modal){join_room_form__modal.style.display="none"};
    if (event.target==help__modal){help__modal.style.display="none"};
});

for (span of closes){
    span.addEventListener("click",() => {
        if (create_room__modal.style.display="block"){create_room__modal.style.display="none"};
        if (join_room__modal.style.display="block"){
            join_room__modal.style.display="none";
            clearInterval(roomInterval);
        };
        if (join_room_form__modal.style.display="block"){join_room_form__modal.style.display="none"};
        if (help__modal.style.display="block"){help__modal.style.display="none"};
    });
}

function joinRoom(event){
    event.preventDefault();
    console.log(join_room__form.elements);
    
        fetch("/join_room", {
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({playerName:join_room__form.elements["playerName"].value,roomName:join_room__form.elements["roomName"].value,password:join_room__form.elements["password"].value})
          }).then(res => res.json()).then(data=>{
              //if room good
              console.log(data.accepted);
              if (data.accepted=="true"){
                  window.location.href="/game?room="+join_room__form.elements["roomName"].value;
              } else {
                  alert("error!"); //todo separate alert messages for different errors
              }
          });
          
}

let rooms = [];
let roomDiv = document.getElementById("rooms");

roomInterval = setInterval(x => getRooms(), 2000);
function getRooms(){
    fetch('/rooms').then(function(result){
        console.log(result);
        return result.json();
    }).then(function(r){
        if (r.length){
            for (let room of r){
                if (rooms.some(x=>x.name===room.name)){
                    updateRoomDiv(room);
                } else {
                    createRoomDiv(room);

                }
            }
        } else {
            roomDiv.innerHTML = "";
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
    rPlayerNumber.textContent = room.playerLimit;
    let rPlayersLeft = document.createElement('p');
    rPlayersLeft.textContent = room.playersLeft
    let rDiv = document.createElement('div');
    rDiv.id=room.name;
    rDiv.appendChild(rName);
    rDiv.appendChild(rPlayerNumber);
    rDiv.appendChild(rPlayersLeft);
    if (room.playersLeft > 0){
        let rJoinButton = document.createElement('a');
        rJoinButton.textContent = "Csatlakozás";
        rJoinButton.classList.add("submit_button");
        rJoinButton.addEventListener("click", () => {
            join_room_form__modal.style.display = "block";
            selectedRoom.value = room.name;
        });
        rDiv.appendChild(rJoinButton);
    }
    roomDiv.appendChild(rDiv);
    rooms.push(room);
}

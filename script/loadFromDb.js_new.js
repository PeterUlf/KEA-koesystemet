window.addEventListener("load", checkRoomExists);

let deletedIds = [];
let tempId;
let problems = [{}];
let rooms = [{}];
//I have set a localstorrage localStorage.getItem('user');

//let mySuperUserPassword = localStorage.getItem("superuserPassword");
let mySuperUserPassword ="";
let currentQueSuperUserPassword;
let runningProcesses = 0;

//setInterval(dataGet, 10000);

const createRoomDomVars ={};
createRoomDomVars.roomName =document.querySelector("#createroom [data-create=room]");
createRoomDomVars.password = document.querySelector("#createroom  [data-create=room_password]")
createRoomDomVars.button = document.querySelector("#createroom  button");
createRoomDomVars.buttons = document.querySelector("#createroom");

createRoomDomVars.UrlRoom;
createRoomDomVars.que = document.querySelector("#que");



function checkRoomExists() {
    console.log("checkRoomExists");
    // check that createRoomDomVars.roomName is not in database
    fetch(dbUrl + "/rooms", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            rooms = e;
            //ONLY RELEVANT WHEN I RELOAD
            let roomtaken = rooms.filter(room => room.roomname === getUrlVars()["room"]);
            //console.log("roomtaken:", roomtaken);

            if (roomtaken.length > 0) {
                //ROOM EXISTS

                //SETS A VARIABLE
                createRoomDomVars.UrlRoom = getUrlVars()["room"];
                currentQueSuperUserPassword = roomtaken[0].password;

                //currentQueSuperUserPassword 
                if (localStorage.getItem("superuserPassword") === currentQueSuperUserPassword) {
                    //I am superuser SETS A VARIABLE
                    mySuperUserPassword = currentQueSuperUserPassword;
                } else {
                    //i am NOT superuser
                    mySuperUserPassword = "";
                }
                

                //add current url to header
                document.querySelector("#que > table > caption > span").textContent = window.location.href;

                start();

                //console.log("currentQueSuperUserPassword = roomtaken.password", currentQueSuperUserPassword, roomtaken.password);
                //return true;
            } else {
                //ROOM DOSEN'T exists
                createRoomDomVars.UrlRoom ="";
                //return false;
                window.history.pushState(location.pathname + "/index.html", "Title", location.pathname );
                start();


                //go to the frontpage
            }
        })



    //if room exixts write the name with a dash - allready exists and make red
};
function start() {
    console.log('start');
    tempId =1;
    //getUrlVars();
       
    dataGet();
    document.querySelector("#closeDialog").addEventListener("click", closeDialog);
    roomIsSet();
}

function SHOW_problems_addedProblems_deletedIds_SHOW() {
    console.log("SHOW_problems_addedProblems_deletedIds_SHOW");

    //-----------Generates problemsWithoutDeleteditems whitch is problems + addedproblems - deletedproblems
    let problemsWithoutDeleteditems = {};
    problemsWithoutDeleteditems = problems.filter(function (item) {

        return deletedIds.indexOf(item._id) == -1;
    });

    problemsWithoutDeleteditems.sort(function (a, b) {
        var x = a.problem_added.toLowerCase();
        var y = b.problem_added.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    });

    domDeleteRows();
    //show all
    domShowContent(problemsWithoutDeleteditems);
    document.querySelector("#loading").classList.add("hide");

}
function dataGet(justAddedId){
    console.log("dataGet");
    runningProcesses++;

    fetch(dbUrl+"/problems" +"?metafields=true", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            //only get current rooms problems
            problems = e.filter(element => element.room ===  getUrlVars()["room"]);
            
            //hvis userid not in problems
            let myproblem = problems.filter(problem => problem._id == localStorage.getItem('user'))
           // console.log("userid : myproblem", localStorage.getItem('user'), myproblem.length);
            if (myproblem.length < 1) {
                //If I dont have problem in current room
               localStorage.removeItem("user");
            }

            disableInsert();

            runningProcesses--;
         
            if (runningProcesses <= 0) {
                deletedIds = [];
                SHOW_problems_addedProblems_deletedIds_SHOW()
            }
          
        });
}
function dataInsert(body) {
    console.log("dataInsert");
    runningProcesses++;
   
    closeDialog();

    //-----------generate temp object that is a copy of body, but with a id and a timestamp and puts it in addedProblems
    const bodyTemp = JSON.parse(JSON.stringify(body));
    bodyTemp.problem_short = "OPDATERER";
    tempId = tempId + 1;
    bodyTemp._id = tempId;
    const now = new Date();
    bodyTemp.problem_added = now.toISOString();
    //addedProblems.push(bodyTemp);
    problems.push(bodyTemp);
    //-----------SLUT
    
 SHOW_problems_addedProblems_deletedIds_SHOW();


    //inserts the room into the body
    body.room = getUrlVars()["room"];




    fetch(dbUrl + "/problems", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            let addedProblem =e;
            runningProcesses--;

            // dataProblemAddedOpdated will send dataGet()
            dataProblemAddedOpdated(addedProblem._id, addedProblem._created, "insert", bodyTemp._id)

            //set the userID equal to the current problems added
            if (localStorage.getItem('user')==null){
                localStorage.setItem("user", addedProblem._id);
             
                document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);
                document.querySelector("#insertDialogShow").classList.add("disabled");
            } 
           
          
        });
}
function dataUpdate(event, body,  idProblemOwner, idProblemHelper  ){
    console.log("dataUpdate");
    runningProcesses++;

    closeDialog();

    //if i update any other than my own 
    if (idProblemHelper != idProblemOwner) {
        dataDelete(event, idProblemOwner);
        deletedIds.push(idProblemOwner);
    } 
  
    //let updateIndex = problemsWithoutDeleteditems.indexOf(updateId);
    let updateIndex = problems.map(function (e) { return e._id; }).indexOf(idProblemHelper);
   

    problems[updateIndex].problem_owner = body.problem_owner;
    //problems[updateIndex].problem_short = body.problem_short;
    problems[updateIndex].problem_short = "OPDATERER";
    problems[updateIndex].problem_long = body.problem_long;
    problems[updateIndex].problem_added = body.problem_added;
   // problems[updateIndex]._created = "test";

    SHOW_problems_addedProblems_deletedIds_SHOW();

    fetch(dbUrl + "/problems" + "/" + idProblemHelper, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            let addedProblem = e;
            runningProcesses--;
             
            // dataProblemAddedOpdated will send dataGet()
            dataProblemAddedOpdated(addedProblem._id, body._created, "update")
    
            
        });
}
function dataDelete(event, id) {
    console.log("dataDelete" );
    closeDialog();
  
    runningProcesses++;

    //RESETS, now normal users can insert again
    localStorage.removeItem("user");
    //userId = localStorage.getItem('user');
    
    //add id to deleted id's
    deletedIds.push(id);
 
    SHOW_problems_addedProblems_deletedIds_SHOW();

    fetch(dbUrl + "/problems" + "/" + id, {

             method: "delete",
             headers: {
                 "Content-Type": "application/json; charset=utf-8",
                 "x-apikey": apikey,
                 "cache-control": "no-cache"
             }


         }) .then(e => e.json())
            .then(e => {
                runningProcesses--;
                 dataGet();
                    });
         
     
 }
function dataProblemAddedOpdated(id, date, method, addedProblemsId ) {
    console.log("dataProblemAddedOpdated");
  
    //used to update a problem
    //function to keep track of added problems not in problems yet'
    runningProcesses++;

    if (method === "update") {
        //her skirer jeg rækkefølgen
        //Hvis det er en update, skal det nye øverst ellers nederst
    }

    let body = { "problem_added": date };
    fetch(dbUrl + "/problems" + "/" + id + "?metafields=true", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            runningProcesses--;

            if (method === "insert") {
                //with an id, because the just added id should be removed from the local addedProblems
                //this is only when the problem is inserted
                dataGet(addedProblemsId);
            } else {
                dataGet();
            }

        });

}
function dropdownListChosenRow(event, idProblemHelper) {
    console.log("dropdownListChosenRow");
    //This function sets what happens on change of dropdown

    document.querySelector("#problem  [data-content=name]").classList.add("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_short]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_long]").classList.remove("disabled_textfield");

    document.querySelector("#problem  [data-content=name]").disabled = true;
    document.querySelector("#problem  [data-content=problem_short]").disabled = false;
    document.querySelector("#problem  [data-content=problem_long]").disabled = false;

    //update button gets id from helper
    document.querySelector("#updateBtn").dataset.id = idProblemHelper;
    let chosen = problems.filter(problem => problem._id === idProblemHelper);
    //console.log("chosen: ", chosen)

    //content from helper is put in place
    document.querySelector("#problem  [data-content=name]").value = chosen[0].problem_owner;
    document.querySelector("#problem  [data-content=problem_short]").value = chosen[0].problem_short;
    document.querySelector("#problem  [data-content=problem_long]").value = chosen[0].problem_long;

    


}
function format(date) {
    console.log("format");

    




    const hours = date.getHours();
    const minutes = date.getMinutes();

    // if (isNaN(hours)) {
    //     return "OPDATERER";
    // }

   // return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") + " " + ((hours > 11) ? "PM" : "AM");
    return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") ;
}
function getUrlVars() {
    console.log("getUrlVars");
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
function disableInsert() {
    console.log("disableInsert");
    document.querySelector("#insertDialogShow").classList.add("disabled");
    document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);

    if (localStorage.getItem('user') === null || mySuperUserPassword != "") {
        document.querySelector("#insertDialogShow").classList.remove("disabled");
        document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)

    } 
   
}

///------------------------------------DOM funktioner-----------------------------------------------

function closeDialog() {
    console.log("dialogClose");

    document.querySelector("#dialog").classList.add("hide");

    document.querySelector("  [data-content=name]").value = "";
    document.querySelector("  [data-content=problem_short]").value = "";
    document.querySelector(" [data-content=problem_long]").value = "";
}
function buildBodyFromForm() {
    console.log('buildBodyFromForm');
    if (mySuperUserPassword != "") {
        document.querySelector("#insertDialogShow").classList.remove("disabled");
        document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)

    } 

    

    let problem_owner = document.querySelector("#problem  [data-content=name]").value;
    let problem_short = document.querySelector("#problem   [data-content=problem_short]").value;
    let problem_long = document.querySelector("#problem  [data-content=problem_long]").value;
    const now = new Date();
    problem_added = now.toISOString();
    //2 next lines updates my problem
    let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long, "problem_added": problem_added };
   // console.log("buildBodyFromForm :body: ", body)


    dataInsert(body);


}

function enableInsertDialogShow(){
    console.log('enableInsertDialogShow');
    document.querySelector("#problem  [data-content=name]").disabled = false;
    document.querySelector("#problem  [data-content=problem_short]").disabled = false;
    document.querySelector("#problem  [data-content=problem_long]").disabled = false;

    document.querySelector("#problem  [data-content=name]").value = "";
    document.querySelector("#problem  [data-content=problem_short]").value = "";
    document.querySelector("#problem  [data-content=problem_long]").value = "";

    document.querySelector("#problem  [data-content=name]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_short]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_long]").classList.remove("disabled_textfield");

}

function insertDialogShow() {
    console.log('insertDialogShow');

    enableInsertDialogShow()

  
    //SHOW
    document.querySelector("#dialog").classList.remove("hide");
    document.querySelector("#insertBtn").classList.remove("hide");
    document.querySelector("#updateProblem").classList.add("hide");
    document.querySelector("#problem").classList.remove("hide");
   

    //HIDE
    document.querySelector("#delete").classList.add("hide");
    document.querySelector("#updateBtn").classList.add("hide");
    
    //CLICK
    document.querySelector("#insertBtn").addEventListener("click", buildBodyFromForm);

    //DATA old id's deleted
    document.querySelector("#updateBtn").dataset.id = "";
   
}
function domDeleteRows(){
    console.log("domDeleteRows");
  
    document.querySelectorAll("tbody > tr:nth-child(n+2)").forEach(e => e.remove());
    document.querySelectorAll('#selections option:nth-child(n+2)').forEach(e => e.remove());
    
}
function domShowContent(problems) {
    console.log("domShowContent");

    let templateProblem = document.querySelector('#question');
    let templateDropdown = document.querySelector('#solved_by');

    //question list
    let qList = document.querySelector("tbody");
    //solvedby list
    let dropdownList = document.querySelector("#selections");

    let currentProblem = problems.filter(problem => problem._id === localStorage.getItem('user'));
    
        // Loop
        problems.forEach((el, i) => {
        let clone = templateProblem.content.cloneNode(true);
        let clone2 = templateDropdown.content.cloneNode(true);

        clone.querySelector("[data-content=name]").textContent = el.problem_owner;
        clone.querySelector("[data-content=problem_short]").innerHTML = `<strong>${el.problem_short}</strong><br> ${el.problem_long} `;
        const date = new Date(el.problem_added);
        clone.querySelector("[data-content=timeInQue]").textContent = format(date);
        clone.querySelector("[data-content=deleteList]").dataset.id = el._id;

//--------------------------------------Klik på delete/update knap -------------------------------------- 

        clone.querySelector("[data-content=deleteList]").addEventListener("click", deleteDialogShow);
        clone.querySelector("[data-content=updateList]").addEventListener("click", updateDialogShow);
//--------------------------------------Klik på delete/update knap slut -------------------------------------- 


        
       
                clone2.querySelector("option").textContent = el.problem_owner + ": " + el.problem_short;
                clone2.querySelector("option").dataset.id = el._id;
                clone2.querySelector("option").value = el._id;
                 //remove options options if
            if (localStorage.getItem('user') != null && mySuperUserPassword == ""){
                if (el.problem_added < currentProblem[0].problem_added ) {
                        clone2.querySelector("option").remove();
                    }
            }

        //remove buttons
        if (localStorage.getItem('user') != el._id && mySuperUserPassword == "") {
           // clone.querySelector("button.deleteList_1").remove();
            //clone.querySelector("button.updateList_1").remove();
            clone.querySelector("[data-title=Update]").textContent="";
            clone.querySelector("[data-title=Fjern]").textContent="";
           
        }

        

        qList.appendChild(clone);
        dropdownList.appendChild(clone2);





      
        dropdownList.addEventListener("change", dropdownListChosen);
        // CHANGE dropdown SLUT

        function deleteDialogShow() {
            console.log('deleteDialogShow');

            //console.log("HER KOMMER ID", this.dataset.id);
             
            //SHOW

            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#delete").classList.remove("hide");
            

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#updateBtn").classList.add("hide");
            document.querySelector("#problem").classList.add("hide");
            document.querySelector("#updateProblem").classList.add("hide");
          
            
            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);
           
            // Assign the listener callback to a variable, and remove ventlistener. 
            var deleteRow = (event) => {
                //console.log("remove eventlistener fra #removeProblem");
                document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
        
                dataDelete(event, this.dataset.id);
                //console.log("HER KOMMER ID", this.dataset.id);
               // document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
            };
            document.querySelector("#removeProblem").addEventListener('click', deleteRow);

           



      
        }

        function updateDialogShow() {
            console.log('updateDialogShow');

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#delete").classList.add("hide");


            //SHOW
            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#updateBtn").classList.remove("hide");
            document.querySelector("#problem").classList.remove("hide");
            document.querySelector("#updateProblem").classList.remove("hide");

            document.querySelector("#problem  [data-content=name]").classList.add("disabled_textfield");
            document.querySelector("#problem  [data-content=problem_short]").classList.add("disabled_textfield");
            document.querySelector("#problem  [data-content=problem_long]").classList.add("disabled_textfield");

            document.querySelector("#problem  [data-content=name]").disabled = true;
            document.querySelector("#problem  [data-content=problem_short]").disabled = true;
            document.querySelector("#problem  [data-content=problem_long]").disabled = true;

            document.querySelector("#problem  [data-content=name]").value = "";
            document.querySelector("#problem  [data-content=problem_short]").value = "";
            document.querySelector("#problem  [data-content=problem_long]").value = "";

            
           


            //dialogClose();


            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);

           
            //UPDATE parameters are send to updateRow
            var updateRow = (event) => {
                //
                let idProblemHelper = document.querySelector("#updateBtn").dataset.id;
                //console.log("this.dataset.id", this.dataset.id)

                let idProblemOwner = el._id;
                let problemOwnerAdded = el.problem_added;
                let problemHelper = document.querySelector("#problem  [data-content=name]").value;
                let problemHelperShort = document.querySelector(" #problem  [data-content=problem_short]").value;
                let problemHelperLong = document.querySelector("#problem  [data-content=problem_long]").value;

                //2 next lines updates my problem
                let bodyHelper = { "problem_owner": problemHelper, "problem_short": problemHelperShort, "problem_long": problemHelperLong, problem_added: problemOwnerAdded };


                dataUpdate(event, bodyHelper, idProblemOwner, idProblemHelper);
                

                document.querySelector("#updateBtn").removeEventListener('click', updateRow);
            };
            document.querySelector("#updateBtn").addEventListener('click', updateRow);




        }
    });

}
  //CHANGE dropdown with parameters
let dropdownListChosen = (event) => {
    console.log("HVORNÅR MON DENNE BLIVER KALDT?");
    let idProblemHelper = document.querySelector("#selections").value;
    dropdownListChosenRow(event, idProblemHelper);
    //console.log("id og problems: ", idProblemHelper, problems)
};





createRoomDomVars.roomName.addEventListener("click", clearFieldRoom);
createRoomDomVars.roomName.addEventListener("focusout", writeFieldRoom);

function clearFieldRoom() {
    console.log("clearFieldRoom");
    if (createRoomDomVars.roomName.value === "Opret rum") {
        createRoomDomVars.roomName.value = "";
        // createRoom.roomName.removeEventListener("click", clearFieldRoom);   
    }
}
function writeFieldRoom() {
    console.log("writeFieldRoom");
    if (createRoomDomVars.roomName.value === "") {
        createRoomDomVars.roomName.value = "Opret rum";
        //createRoom.roomName.removeEventListener("focusout", clearFieldRoom);
    }
}

createRoomDomVars.password.addEventListener("focusin", clearFieldPassword);
createRoomDomVars.password.addEventListener("focusout", writeFieldPassword);
function clearFieldPassword() {
    console.log("clearFieldPassword");
    if (createRoomDomVars.password.value === "Opret password") {
        createRoomDomVars.password.value = "";
        createRoomDomVars.password.type = "password";
        //createRoom.roomName.removeEventListener("click", clearFieldPassword);
    }
}
function writeFieldPassword() {
    console.log("writeFieldPassword");
    if (createRoomDomVars.password.value === "") {
        createRoomDomVars.password.value = "Opret password";
        //createRoom.roomName.removeEventListener("click", clearFieldPassword);
        createRoomDomVars.password.type = "text";
    }
}
createRoomDomVars.button.addEventListener("click", createRoomCheckBefore);

function createRoomCheckBefore() {
    console.log("createRoomCheckBefore");

    //check that both room and password is filled. Otherwise make them red
    if (createRoomDomVars.password.value === "Opret password" || createRoomDomVars.roomName.value === "Opret rum") {
        //console.log("either or");
        if (createRoomDomVars.password.value === "Opret password") {
            //console.log("password not changed");
            createRoomDomVars.password.classList.add("warning");
        } else {
            createRoomDomVars.password.classList.remove("warning");
        }
        if (createRoomDomVars.roomName.value === "Opret rum") {
           // console.log("room not changed");
            createRoomDomVars.roomName.classList.add("warning");

        } else {
            createRoomDomVars.roomName.classList.remove("warning");
        }

    } else {
        //both room and password is filled.
        //console.log("else");
        createRoomDomVars.roomName.classList.remove("warning");
        createRoomDomVars.password.classList.remove("warning");

        let roomscheck = rooms.filter(room => room.roomname === createRoomDomVars.roomName.value )


        if (roomscheck.length>0) {       //find ud af om rummet existerer
            console.log("RUMMET EXISTERER ALLEREDE");

        } else {
            
            console.log("RUMMET EXISTERER IKKE ALLEREDE");
            //dataCreateRoom();
            
        }

    }

    newUrl();
    newQr();

}


function dataCreateRoom() {
    console.log("dataCreateRoom");
    // check that createRoomDomVars.roomName is not in database
    fetch(dbUrl + "/rooms", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify({
            "roomname": createRoomDomVars.roomName.value,
            "password": createRoomDomVars.password.value
        }),
        json: true
    }).then(e => e.json())
        .then(e => {
            //console.log("room insertet");

            //save superuserpassword in localstorrage
            localStorage.setItem("superuserPassword", createRoomDomVars.password.value);
            //checkRoomExists();



            newUrl();
            newQr();
            roomIsSet();
        })




}



function newUrl() {
    console.log("newUrl");
    //when done set localStorage superuserPassword and redirect to an url *?room=reateRoomDomVars.roomName
    
    

    //næste linielaver ny url
    window.history.pushState("index.html", "Title", location.pathname +"?room=" + createRoomDomVars.roomName.value);
    //insert new url i variable
    createRoomDomVars.UrlRoom = getUrlVars()["room"];
}
function newQr() {//generate qr code
    console.log("newQr");
    document.getElementById("qrcode").textContent = "";

    var qrcode = new QRCode(document.getElementById("qrcode"), {
        text: window.location.href,
        width: 140,
        height: 140,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });}

function roomIsSet() {
    console.log("roomIsSet")
    //newUrlAndQr();
    newQr();

    if (createRoomDomVars.UrlRoom != null) {
        //console.log("roomIsSet room is:", createRoomDomVars.UrlRoom)
        //disable create room
        createRoomDomVars.buttons.classList.add("hide");
        //unhide table
        //console.log("remove hide from que");
        createRoomDomVars.que.classList.remove("hide");
        //hide table
    }
    else {
        //console.log("roomIsSet no room:")
        //enable create room
        setInterval(dataGet, 10000);
         createRoomDomVars.buttons.classList.remove("hide");
        //unhide table
        createRoomDomVars.que.classList.add("hide");
    }


}



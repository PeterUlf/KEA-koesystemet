window.addEventListener("load", checkRoomExists);

let deletedIds = [];
let tempId;
let problems = [{}];
let rooms = [{}];
let aktivtRum;
//I have set a localstorrage localStorage.getItem('user');

//let mySuperUserPassword = localStorage.getItem("superuserPassword");
let mySuperUserPassword = "";
let currentQueSuperUserPassword;
let runningProcesses = 0;

setInterval(dataGet, 4000);

const domData = {};
domData.roomName = document.querySelector("#createroom [data-create=room]");
domData.password = document.querySelector(
  "#createroom  [data-create=room_password]"
);
domData.createRoombuttons = document.querySelector("#createroom");
domData.currentEnter = document.querySelector("#insertDialogShow");

domData.UrlRoom;
domData.tableOfProblems = document.querySelector("#que");

function checkRoomExists() {
  //console.log("checkRoomExists room ");
  // check that createRoomDomVars.roomName is not in database
  fetch(dbUrl + "/rooms", {
    method: "get",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
  })
    .then((e) => e.json())
    .then((e) => {
      rooms = e;

      let myRooms = rooms.map((room) => room.roomname);

      /*initiate the autocomplete function on the "inputRoom" element, and pass along the countries array as possible autocomplete values:*/
      autocomplete(document.getElementById("inputRoom"), myRooms);
      //console.log("rooms.roomname", myRooms);

      let roomtaken = rooms.filter(
        (room) => room.roomname === getUrlVars()["room"]
      );
      aktivtRum = roomtaken;
      ////console.log("roomtaken:", roomtaken);

      if (roomtaken.length > 0) {
        //that is there is a room allready

        //SETS A VARIABLE
        domData.UrlRoom = getUrlVars()["room"];
        currentQueSuperUserPassword = roomtaken[0].room_password;

        //currentQueSuperUserPassword
        if (
          localStorage.getItem("superuserPassword") ===
          currentQueSuperUserPassword
        ) {
          mySuperUserPassword = currentQueSuperUserPassword;
          document.querySelector("#sletRumKnap").classList.remove("hide");
          document
            .querySelector("#sletRumKnap")
            .addEventListener("click", sletRum);
        } else {
          mySuperUserPassword = "";
        }
        start();

        //add current url to header
        document.querySelector("#que > table > caption > span").textContent =
          window.location.href;

        //////console.log("currentQueSuperUserPassword = roomtaken.password", currentQueSuperUserPassword, roomtaken.password);
        //return true;
      } else {
        //return false;
        window.history.pushState(
          location.pathname + "/index.html",
          "Title",
          location.pathname
        );
        start();

        //go to the frontpage
      }
    });

  //if room exixts write the name with a dash - allready exists and make red
}

function sletRum() {
  console.log(aktivtRum);
}

function start() {
  //console.log('start');

  //every time you type in inputRoom box
  document.querySelector("#inputRoom").oninput = sendValue;

  function sendValue(e) {
    checkIfRoomExists(e.target.value);
  }

  //set a temp ID, to be able to delete it later
  tempId = 1;

  dataGet();
  document.querySelector("#closeDialog").addEventListener("click", closeDialog);
  roomIsSet();

  domData.roomName.addEventListener("click", clearFieldRoom);
  domData.roomName.addEventListener("focusout", writeFieldRoom);
  domData.password.addEventListener("focusin", clearFieldPassword);
  domData.password.addEventListener("focusout", writeFieldPassword);

  document.addEventListener("keydown", setEnter);
  // Execute a function when the user releases a key on the keyboard

  //make url on the logo

  document.getElementById("logolink").href = location.pathname;
}

function SHOW_problems_addedProblems_deletedIds_SHOW() {
  //-----------Generates problemsWithoutDeleteditems whitch is problems  - deletedproblems
  let problemsWithoutDeleteditems = {};
  problemsWithoutDeleteditems = problems.filter(function (item) {
    return deletedIds.indexOf(item.id) == -1;
  });

  //sorting problems
  problemsWithoutDeleteditems.sort(function (a, b) {
    var x = a.problem_added.toLowerCase();
    var y = b.problem_added.toLowerCase();
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  });

  let currentProblem = problems.filter(
    (problem) => problem.id == localStorage.getItem("user")
  );

  domClearProblemsTable();
  //show all
  domShowProblemsTable(problemsWithoutDeleteditems);
}

function dataGet(justAddedId) {
  //disableInsert();

  //to find currentQueSuperUserPassword

  runningProcesses++;

  fetch(dbUrl + "/problems?per_page=100", {
    method: "get",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
  })
    .then((e) => e.json())
    .then((e) => {
      //only get current rooms problems

      let before = 1;
      if (problems.length > 0) {
        before = problems[0].id;
      }

      problems = e.filter((element) => element.room === getUrlVars()["room"]);
      //console.table(problems);

      document.querySelector(
        "title"
      ).textContent = ` (${problems.length}) Vejledningskø`;

      let after = 1;
      if (problems.length > 0) {
        after = problems[0].id;
      }

      if (
        before < after &&
        problems.length === 1 &&
        localStorage.getItem("superuserPassword") ===
          currentQueSuperUserPassword
      ) {
        document.querySelector("#new_problem").play();
      }

      document.querySelector("#loading").classList.add("hide");

      //if superuserPassword exixts

      //hvis userid not in problems
      let myproblem = problems.filter(
        (problem) => problem.id == localStorage.getItem("user")
      );
      ////console.log("userid : myproblem", localStorage.getItem('user'), myproblem.length);
      if (myproblem.length < 1) {
        localStorage.removeItem("user");
      }

      disableInsert();

      runningProcesses--;
      ////console.log("problems i dataGet, runningprocess", runningProcesses);
      //console.table(problems);
      if (runningProcesses <= 0) {
        deletedIds = [];
        SHOW_problems_addedProblems_deletedIds_SHOW();
      }
    });
}

function dataInsert(body) {
  //console.log("dataInsert");

  //reset the enter button
  domData.currentEnter = "";
  runningProcesses++;
  closeDialog();

  //-----------generate temp object that is a copy of body, but with a id and a timestamp and puts it in addedProblems
  const bodyTemp = JSON.parse(JSON.stringify(body));
  bodyTemp.problem_short = "OPDATERER...";
  tempId = tempId + 1;
  bodyTemp.id = tempId;

  //generate date and time
  const now = new Date();
  //console.log("tiden nu er ", now.toISOString());
  bodyTemp.problem_added = now.toISOString();
  problems.unshift(bodyTemp);

  //console.log("problems");
  console.table(problems);

  //-----------SLUT

  //show temp local data until real data is fetched
  SHOW_problems_addedProblems_deletedIds_SHOW();

  //inserts the room into the body
  body.room = getUrlVars()["room"];
  body.status = "publish";

  fetch(dbUrl + "/problems", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
    body: JSON.stringify(body),
    json: true,
  })
    .then((e) => e.json())
    .then((e) => {
      let addedProblem = e;
      runningProcesses--;

      // dataProblemAddedOpdated what happens after update.  Will send dataGet()
      dataUpdateAdded(
        addedProblem.id,
        addedProblem.date_gmt,
        "insert",
        bodyTemp.id
      );

      //set the userID equal to the current problems added
      if (localStorage.getItem("user") == null) {
        localStorage.setItem("user", addedProblem.id);

        //disable dialog
        document
          .querySelector("#insertDialogShow")
          .removeEventListener("click", insertDialogShow);
        document.querySelector("#insertDialogShow").classList.add("disabled");
        document.querySelector("#insertDialogShow").disabled = true;

        //disable enter button
        domData.currentEnter = "";
      }
    });
}

function dataUpdate(event, body, idProblemOwner, idProblemHelper) {
  //console.log("dataUpdate")
  runningProcesses++;

  closeDialog();

  //if i update any other than my own, delete the original problem
  if (idProblemHelper != idProblemOwner) {
    dataDelete(event, idProblemOwner);
    deletedIds.push(idProblemOwner);
  }

  //get the ......
  let updateIndex = problems
    .map(function (e) {
      return e.id;
    })
    .indexOf(parseInt(idProblemHelper));

  //update the local problems with the person taking over
  //console.log("body er ", body, "index er ", updateIndex, "problemhelper er ", idProblemHelper);
  problems[updateIndex].problem_owner = body.problem_owner;
  problems[updateIndex].problem_short = "OPDATERER";
  problems[updateIndex].problem_long = body.problem_long;
  problems[updateIndex].problem_added = body.problem_added;

  //display the local problems
  SHOW_problems_addedProblems_deletedIds_SHOW();

  //update in the database
  fetch(dbUrl + "/problems" + "/" + idProblemHelper, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
    body: JSON.stringify(body),
    json: true,
  })
    .then((e) => e.json())
    .then((e) => {
      let addedProblem = e;
      runningProcesses--;

      // dataProblemAddedOpdated will send dataGet(), and send the created date and time
      //dataUpdateAdded(addedProblem.id, body.date, "update")
      dataUpdateAdded(addedProblem.id, body.date_gmt, "update");
    });
}

function dataUpdateAdded(id, date, method, addedProblemsId) {
  //used to update a problem
  //function to keep track of added problems not in problems yet'
  runningProcesses++;

  let body = {
    problem_added: date,
  };
  fetch(dbUrl + "/problems" + "/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
    body: JSON.stringify(body),
    json: true,
  })
    .then((e) => e.json())
    .then((e) => {
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

function dataDelete(event, id) {
  //how enter works
  domData.currentEnter = document.querySelector("#insertDialogShow");
  //console.log("dataDelete");
  closeDialog();

  runningProcesses++;

  //RESETS, now normal users can insert again
  localStorage.removeItem("user");

  //add id to deleted id's
  deletedIds.push(id);

  //display local problems
  SHOW_problems_addedProblems_deletedIds_SHOW();

  fetch(dbUrl + "/problems" + "/" + id, {
    method: "delete",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      //  "cache-control": "no-cache"
    },
  })
    .then((e) => e.json())
    .then((e) => {
      runningProcesses--;
      dataGet();
      //how enter works
      domData.currentEnter = document.querySelector("#insertBtn");
    });
}

function dropdownListChosenRow(event, idProblemHelper) {
  //console.log("dropdownListChosenRow", idProblemHelper);
  //This function sets what happens on change of dropdown

  document
    .querySelector("#problem  [data-content=name]")
    .classList.add("disabled_textfield");
  document
    .querySelector("#problem  [data-content=problem_short]")
    .classList.remove("disabled_textfield");
  document
    .querySelector("#problem  [data-content=problem_long]")
    .classList.remove("disabled_textfield");

  document.querySelector("#problem  [data-content=name]").disabled = true;
  document.querySelector(
    "#problem  [data-content=problem_short]"
  ).disabled = false;
  document.querySelector(
    "#problem  [data-content=problem_long]"
  ).disabled = false;

  //update button gets id from helper
  document.querySelector("#updateBtn").dataset.id = idProblemHelper;
  let chosen = problems.filter((problem) => problem.id == idProblemHelper);

  //content from helper is put in place
  document.querySelector("#problem  [data-content=name]").value =
    chosen[0].problem_owner;
  document.querySelector("#problem  [data-content=problem_short]").value =
    chosen[0].problem_short;
  document.querySelector("#problem  [data-content=problem_long]").value =
    chosen[0].problem_long;
}

function format(date) {
  ////console.log("format", date);

  const unixTimeDb = date.getTime();
  //console.log("unixTimeDb:", date);

  const now = new Date();
  //console.log("now:", now);
  const unixTimeNow = now.getTime();

  const millis = unixTimeNow - unixTimeDb;

  let hours = Math.floor(millis / 1000 / 60 / 60);
  if (hours < 10) {
    hours = "0" + hours;
  }
  let minuts = Math.floor(millis / 1000 / 60 - hours * 60);
  if (minuts < 10) {
    minuts = "0" + minuts;
  }

  return hours + ":" + minuts;

  //     const hours = date.getHours();
  //     const minutes = date.getMinutes();

  //    // return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") + " " + ((hours > 11) ? "PM" : "AM");
  //     return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") ;
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      vars[key] = value;
    }
  );
  return vars;
}

function disableInsert() {
  //domData.currentEnter = "";
  document.querySelector("#insertDialogShow").classList.add("disabled");
  document.querySelector("#insertDialogShow").disabled = true;
  document
    .querySelector("#insertDialogShow")
    .removeEventListener("click", insertDialogShow);

  if (localStorage.getItem("user") === null || mySuperUserPassword != "") {
    document.querySelector("#insertDialogShow").classList.remove("disabled");
    document.querySelector("#insertDialogShow").disabled = false;
    document
      .querySelector("#insertDialogShow")
      .addEventListener("click", insertDialogShow);
    //domData.currentEnter = document.querySelector("#insertDialogShow");
  }
}
///------------------------------------DOM funktioner-----------------------------------------------

function closeDialog() {
  //console.log("closeDialog");

  document.querySelector("#dialog").classList.add("hide");

  document.querySelector("[data-content=name]").value = "";
  document.querySelector("[data-content=problem_short]").value = "";
  document.querySelector("[data-content=problem_long]").value = "";
}

function buildBodyFromForm() {
  ////console.log('buildBodyFromForm');
  if (mySuperUserPassword != "") {
    document.querySelector("#insertDialogShow").classList.remove("disabled");
    document.querySelector("#insertDialogShow").disabled = false;
    document
      .querySelector("#insertDialogShow")
      .addEventListener("click", insertDialogShow);
    domData.currentEnter = document.querySelector("#insertDialogShow");
  }
  let problem_owner = document.querySelector(
    "#problem  [data-content=name]"
  ).value;
  let problem_short = document.querySelector(
    "#problem   [data-content=problem_short]"
  ).value;
  let problem_long = document.querySelector(
    "#problem  [data-content=problem_long]"
  ).value;
  const now = new Date();

  //const now = (new Date()).getTime();
  problem_added = now.toISOString();

  //2 next lines updates my problem
  let body = {
    problem_owner: problem_owner,
    problem_short: problem_short,
    problem_long: problem_long,
    problem_added: problem_added,
  };
  dataInsert(body);
}

function insertDialogShow() {
  //console.log('insertDialogShow');

  insertDialogShowReset();

  //SHOW
  document.querySelector("#dialog").classList.remove("hide");
  document.querySelector("#insertBtn").classList.remove("hide");
  document.querySelector("#updateProblem").classList.add("hide");
  document.querySelector("#problem").classList.remove("hide");

  //HIDE
  document.querySelector("#delete").classList.add("hide");
  document.querySelector("#updateBtn").classList.add("hide");

  //CLICK
  document
    .querySelector("#insertBtn")
    .addEventListener("click", buildBodyFromForm);

  //DATA old id's deleted
  document.querySelector("#updateBtn").dataset.id = "";
}

function insertDialogShowReset() {
  document.querySelector("#problem  [data-content=name]").disabled = false;
  document.querySelector(
    "#problem  [data-content=problem_short]"
  ).disabled = false;
  document.querySelector(
    "#problem  [data-content=problem_long]"
  ).disabled = false;

  document.querySelector("#problem  [data-content=name]").value = "";
  document.querySelector("#problem  [data-content=problem_short]").value = "";
  document.querySelector("#problem  [data-content=problem_long]").value = "";

  document
    .querySelector("#problem  [data-content=name]")
    .classList.remove("disabled_textfield");
  document
    .querySelector("#problem  [data-content=problem_short]")
    .classList.remove("disabled_textfield");
  document
    .querySelector("#problem  [data-content=problem_long]")
    .classList.remove("disabled_textfield");
  domData.currentEnter = document.querySelector("#insertBtn");
}

function domClearProblemsTable() {
  ////console.log("domClearProblemsTable");

  document
    .querySelectorAll("tbody > tr:nth-child(n+2)")
    .forEach((e) => e.remove());
  document
    .querySelectorAll("#selections option:nth-child(n+2)")
    .forEach((e) => e.remove());
}

function domShowProblemsTable(problems) {
  ////console.log("showContent");

  let templateProblem = document.querySelector("#question");
  let templateDropdown = document.querySelector("#solved_by");

  //Problems table
  let qList = document.querySelector("tbody");
  //dropdown list
  let dropdownList = document.querySelector("#selections");

  let currentProblem = problems.filter(
    (problem) => problem.id == localStorage.getItem("user")
  );

  // Loop
  problems.forEach((el, i) => {
    //console.log(el);
    let clone = templateProblem.content.cloneNode(true);
    let clone2 = templateDropdown.content.cloneNode(true);
    clone.querySelector("[data-content=name]").textContent = el.problem_owner;
    clone.querySelector(
      "[data-content=problem_short]"
    ).innerHTML = `<strong>${el.problem_short}</strong><br> ${el.problem_long} `;
    //put a Z at the ned to specifi that it is UTC time
    const date = new Date(el.problem_added + "Z");
    clone.querySelector("[data-content=timeInQue]").textContent = format(date);
    clone.querySelector("[data-content=deleteList]").dataset.id = el.id;

    //hjælp knap
    let helpKnap = clone.querySelector("[data-content=helpList]");
    if (el.is_getting_help == 1) {
      helpKnap.textContent = "Får hjælp";
      helpKnap.style.backgroundColor = "green";
      helpKnap.addEventListener("click", () => updateHelp(el.id, 0));
    } else {
      helpKnap.addEventListener("click", () => updateHelp(el.id, 1));
      helpKnap.style.backgroundColor = "orange";
    }

    //--------------------------------------Klik på delete/update knap --------------------------------------
    clone
      .querySelector("[data-content=deleteList]")
      .addEventListener("click", deleteDialogShow);
    clone
      .querySelector("[data-content=updateList]")
      .addEventListener("click", updateDialogShow);

    //--------------------------------------Klik på delete/update knap slut --------------------------------------

    clone2.querySelector("option").textContent =
      el.problem_owner + ": " + el.problem_short;
    clone2.querySelector("option").dataset.id = el.id;
    clone2.querySelector("option").value = el.id;

    //remove options options if the helper has a better place in que
    if (localStorage.getItem("user") != null && mySuperUserPassword == "") {
      if (el.problem_added < currentProblem[0].problem_added) {
        clone2.querySelector("option").remove();
      }
    }
    //remove buttons
    if (localStorage.getItem("user") != el.id && mySuperUserPassword == "") {
      clone.querySelector("[data-title=Update]").textContent = "";
      clone.querySelector("[data-title=Fjern]").textContent = "";
      clone.querySelector("[data-title=Help]").textContent = "";
    }
    qList.appendChild(clone);
    dropdownList.appendChild(clone2);

    dropdownList.addEventListener("change", dropdownListChosen);
    // CHANGE dropdown SLUT

    function deleteDialogShow() {
      // //console.log('deleteDialogShow');

      domData.currentEnter = document.querySelector("#removeProblem");

      //SHOW
      document.querySelector("#dialog").classList.remove("hide");
      document.querySelector("#delete").classList.remove("hide");

      //HIDE
      document.querySelector("#insertBtn").classList.add("hide");
      document.querySelector("#updateBtn").classList.add("hide");
      document.querySelector("#problem").classList.add("hide");
      document.querySelector("#updateProblem").classList.add("hide");

      // Assign the listener callback to a variable, and remove Eventlistener.
      var deleteRow = (event) => {
        dataDelete(event, this.dataset.id);
        document
          .querySelector("#removeProblem")
          .removeEventListener("click", deleteRow);
      };
      document
        .querySelector("#removeProblem")
        .addEventListener("click", deleteRow);
    }

    function updateDialogShow() {
      //console.log('updateDialogShow');

      //HIDE
      document.querySelector("#insertBtn").classList.add("hide");
      document.querySelector("#delete").classList.add("hide");

      //SHOW
      document.querySelector("#dialog").classList.remove("hide");
      document.querySelector("#updateBtn").classList.remove("hide");
      document.querySelector("#problem").classList.remove("hide");
      document.querySelector("#updateProblem").classList.remove("hide");

      document
        .querySelector("#problem  [data-content=name]")
        .classList.add("disabled_textfield");
      document
        .querySelector("#problem  [data-content=problem_short]")
        .classList.add("disabled_textfield");
      document
        .querySelector("#problem  [data-content=problem_long]")
        .classList.add("disabled_textfield");

      document.querySelector("#problem  [data-content=name]").disabled = true;
      document.querySelector(
        "#problem  [data-content=problem_short]"
      ).disabled = true;
      document.querySelector(
        "#problem  [data-content=problem_long]"
      ).disabled = true;

      document.querySelector("#problem  [data-content=name]").value = "";
      document.querySelector("#problem  [data-content=problem_short]").value =
        "";
      document.querySelector("#problem  [data-content=problem_long]").value =
        "";

      //UPDATE parameters are send to updateRow
      var updateRow = (event) => {
        //
        let idProblemHelper = document.querySelector("#updateBtn").dataset.id;
        ////console.log("this.dataset.id", this.dataset.id)

        let idProblemOwner = el.id;
        let problemOwnerAdded = el.problem_added;
        let problemHelper = document.querySelector(
          "#problem  [data-content=name]"
        ).value;
        let problemHelperShort = document.querySelector(
          " #problem  [data-content=problem_short]"
        ).value;
        let problemHelperLong = document.querySelector(
          "#problem  [data-content=problem_long]"
        ).value;

        //2 next lines updates my problem
        let bodyHelper = {
          problem_owner: problemHelper,
          problem_short: problemHelperShort,
          problem_long: problemHelperLong,
          problem_added: problemOwnerAdded,
        };
        dataUpdate(event, bodyHelper, idProblemOwner, idProblemHelper);

        document
          .querySelector("#updateBtn")
          .removeEventListener("click", updateRow);
      };
      document.querySelector("#updateBtn").addEventListener("click", updateRow);
    }
  });

  document.querySelector("#loading").classList.add("hide");
}

// Updates is_getting_help in DB
function updateHelp(id, bool) {
  if (bool) {
    this.backgroundColor = "orange";
  } else {
    this.backgroundColor = "green";
  }
  let body = {
    is_getting_help: bool,
  };
  fetch(dbUrl + "/problems" + "/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
    },
    body: JSON.stringify(body),
    json: true,
  })
    .then((e) => e.json())
    .then((e) => dataGet());
}

//CHANGE dropdown with parameters
let dropdownListChosen = (event) => {
  //console.log("HVORNÅR MON DENNE BLIVER KALDT?");
  let idProblemHelper = document.querySelector("#selections").value;
  dropdownListChosenRow(event, idProblemHelper);
  ////console.log("id og problems: ", idProblemHelper, problems)
};

function dataCreateRoom() {
  // check that createRoomDomVars.roomName is not in database
  document
    .querySelector("#createRoomBtn")
    .removeEventListener("click", createRoom);
  document.querySelector("#loading").classList.remove("hide");

  fetch(dbUrl + "/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      // "cache-control": "no-cache"
    },
    body: JSON.stringify({
      roomname: encodeURI(domData.roomName.value),
      room_password: domData.password.value,
      status: "publish",
    }),
    json: true,
  })
    .then((e) => e.json())
    .then((e) => {
      ////console.log("room insertet");

      //save superuserpassword in localstorrage
      localStorage.setItem("superuserPassword", domData.password.value);
      checkRoomExists();

      newUrlAndQr();
      roomIsSet();
    });
}

function newUrlAndQr() {
  newUrl();
  newQr();
}

function newUrl() {
  //console.log("newUrl", domData.password.value);
  //when done set localStorage superuserPassword and redirect to an url *?room=reateRoomDomVars.roomName

  //næste linielaver ny url
  window.history.pushState(
    "index.html",
    "Title",
    location.pathname + "?room=" + domData.roomName.value
  );
  //insert new url i variable
  domData.UrlRoom = getUrlVars()["room"];
}

function newQr() {
  //generate qr code

  document.getElementById("qrcode").textContent = "";
  if (getUrlVars()["room"] != undefined) {
    var qrcode = new QRCode(document.getElementById("qrcode"), {
      text: window.location.href,
      width: 140,
      height: 140,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }
}

function roomIsSet() {
  //console.log("roomIsSet")

  newQr();

  if (domData.UrlRoom != null) {
    //disable create room
    domData.createRoombuttons.classList.add("hide");
    //unhide table
    domData.tableOfProblems.classList.remove("hide");
    //hide table
  } else {
    //enable create room
    setInterval(dataGet, 10000);
    domData.createRoombuttons.classList.remove("hide");
    //unhide table
    domData.tableOfProblems.classList.add("hide");
  }
}

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/

          closeAllLists();

          //alert(`${this.getElementsByTagName("input")[0].value}`);
          checkIfRoomExists(this.getElementsByTagName("input")[0].value);
        });
        a.appendChild(b);
      }
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      //and send value

      e.preventDefault();

      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
      checkIfRoomExists(e.target.value);
    }
  });

  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

function checkIfRoomExists(room) {
  //console.log("checkIfRoomExists");
  document.querySelector("#adminRoomBtn").classList.add("disabled");
  document.querySelector("#adminRoomBtn").disabled = true;

  //make array of exixting roomnames
  let currentRooms = rooms.map((room) => room.roomname);

  //check if dropdown of exixting rooms is gone
  if (currentRooms.includes(room)) {
    // we have an exixting room activate goto AND admin

    //if admin clicked activate password with the text enter admin password
    //console.log("existing ROOM");

    document.querySelector("#gotoRoomBtn").classList.remove("disabled");
    document.querySelector("#gotoRoomBtn").disabled = false;
    //if goto is activated goto URL +?room=xxxx
    document.querySelector("#gotoRoomBtn").addEventListener("click", gotoRoom);

    //set witch button to click with enter
    //domData.currentEnter = document.querySelector("#gotoRoomBtn");

    //disable createroom
    document.querySelector("#createRoomBtn").classList.add("disabled");
    document.querySelector("#createRoomBtn").disabled = true;

    //enable admin button
    document.querySelector("#adminRoomBtn").classList.remove("disabled");
    document.querySelector("#adminRoomBtn").disabled = false;
    document
      .querySelector("#adminRoomBtn")
      .addEventListener("click", adminRoom);

    //disable passwordfield
    document
      .querySelector("#room_password")
      .classList.add("disabled_textfield");
    document.querySelector("#room_password").disabled = true;
    document.querySelector("#room_password").value = "";
    document.querySelector("#room_password").placeholder = "";
  } else {
    // room dont exist: activat opret and dactivate others

    //disable gotoRoobBtn
    document.querySelector("#gotoRoomBtn").classList.add("disabled");
    document.querySelector("#gotoRoomBtn").disabled = true;

    //disable adminRoomBtn
    document.querySelector("#adminRoomBtn").classList.add("disabled");
    document.querySelector("#adminRoomBtn").disabled = true;

    // when opret is clicked Activate password with the text "opret admin password"
    document.querySelector("#createRoomBtn").classList.remove("disabled");
    document.querySelector("#createRoomBtn").disabled = false;
    document
      .querySelector("#createRoomBtn")
      .addEventListener("click", createRoom);

    //enable password field
    document
      .querySelector("#room_password")
      .classList.remove("disabled_textfield");
    document.querySelector("#room_password").disabled = false;
    document.querySelector("#room_password").placeholder = "Opret password";

    //set witch button to click with enter
    domData.currentEnter = document.querySelector("#createRoomBtn");
  }
}

function createRoom() {
  document
    .querySelector("#createRoomBtn")
    .removeEventListener("click", createRoom);
  document.querySelector("#room_password").oninput = createRoom;

  if (document.querySelector("#room_password").value != "") {
    document
      .querySelector("#createRoomBtn")
      .addEventListener("click", createRoom);
    document.querySelector("#createRoomBtn").classList.remove("disabled");
    document.querySelector("#createRoomBtn").disabled = false;

    document
      .querySelector("#createRoomBtn")
      .addEventListener("click", dataCreateRoom);
    //dataCreateRoom();
  } else {
    document.querySelector("#room_password").classList.add("warning");
    document.querySelector("#createRoomBtn").classList.add("disabled");
    document.querySelector("#createRoomBtn").disabled = true;
  }
}

function gotoRoom() {
  document.querySelector("#loading").classList.remove("hide");
  //console.log("gotoRoom");

  //nulstill superuser
  localStorage.setItem("superuserPassword", "");

  window.history.pushState(
    "index.html",
    "Title",
    location.pathname + "?room=" + domData.roomName.value
  );
  checkRoomExists();
}

function adminRoom() {
  setEnter(document.querySelector("#adminRoomBtn"));
  let roomtaken = rooms.filter(
    (room) => room.roomname === domData.roomName.value
  );
  currentQueSuperUserPassword = roomtaken[0].room_password;
  //   aktivtRum = roomtaken[0];

  document
    .querySelector("#room_password")
    .classList.remove("disabled_textfield");
  document.querySelector("#room_password").disabled = false;
  document.querySelector("#room_password").placeholder =
    "Intast rummets password";

  if (domData.password.value === currentQueSuperUserPassword) {
    //SETS A VARIABLE
    localStorage.setItem("superuserPassword", domData.password.value);
    document.querySelector("#loading").classList.remove("hide");
    window.history.pushState(
      "index.html",
      "Title",
      location.pathname + "?room=" + domData.roomName.value
    );
    checkRoomExists();
  } else if (domData.password.value != "") {
    document.querySelector("#room_password").classList.add("warning");
    document.querySelector("#room_password").placeholder =
      "FORKERT - prøv igen";
    document.querySelector("#room_password").value = "";
  }

  document.querySelector("#gotoRoomBtn").classList.add("disabled");
  document.querySelector("#gotoRoomBtn").disabled = true;
}

function clearFieldRoom() {
  //console.log("clearFieldRoom");

  if (
    domData.roomName.value.includes("Intast rum") ||
    domData.roomName.value.includes("allerede")
  ) {
    domData.roomName.value = "";
  }
}

function writeFieldRoom() {
  //console.log("writeFieldRoom");
  if (domData.roomName.value === "") {
    domData.roomName.value = "Intast rum";
  }
}

function clearFieldPassword() {
  //console.log("clearFieldPassword");

  domData.password.value = "";
  domData.password.type = "password";
  domData.password.classList.remove("warning");
}

function writeFieldPassword() {
  //console.log("writeFieldPassword");
  if (domData.password.value === "") {
    domData.password.placeholder = "Opret password";
    domData.password.type = "text";
  }
}

function setEnter() {
  //console.log("domNameOfButton");
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click

    domData.currentEnter.click();
  }
  if (event.keyCode === 27) {
    closeDialog();
  }
}

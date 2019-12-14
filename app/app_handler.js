// functionality to handle the dom on the app

const saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", saveInputsToIndexedDB);
// (event) => {
//   const values = getAllInputs();
//   if (values.name === "") {
//     return;
//   }
//   console.debug("[DEBUG] ", values);
//   saveNewEventToDatabase(values);
//   event.preventDefault();
// });

// toggle input row
const toggleImg = document.getElementById("collapse-control");
const container = document.getElementsByClassName("collapseable_container")[0];
const toggleInfo = document.getElementsByClassName("collapse_info")[0];
const displayrow = document.getElementsByClassName("display_row")[0];

// default: minimize img, 3vh container,
container.style.minHeight = "3vh";
container.style.display = "none";
toggleInfo.style.display = "flex";
displayrow.style.height = "75vh";

toggleImg.addEventListener("click", (event) => {
  // hide or show collapseable_container div
  // set min-height for input_row to 15vh if show or 3vh if hide
  // change maximize / minimize img on collapse-control


  // show content
  if (toggleImg.src.includes("Maximize")){
      toggleImg.src = "firefox_icons/Minimize_dark.svg";
      container.style.minHeight = "15vh";
      container.style.display = "flex";
      toggleInfo.style.display = "none";
      displayrow.style.height = "64vh";
  } else {
    toggleImg.src = "firefox_icons/Maximize_dark.svg";
    container.style.minHeight = "3vh";
    container.style.display = "none";
    toggleInfo.style.display = "flex";
    displayrow.style.height = "75vh";
  }
  event.preventDefault();
});


const enterpressables = document.getElementsByClassName("enterpressable");
for (epa of enterpressables){
  epa.addEventListener("keypress", (e) => {
    let key = e.which || e.keyCode;
    if (key === 13){
        saveInputsToIndexedDB(e);
    }
  });
}

/** Obtain all inputs from the input forms
    make sure they are not empty
    then save the data into the indexedDB */
function saveInputsToIndexedDB(event){
  event.preventDefault();
  removeMissingMarkIfPossible();
  let values = getAllInputs();
  // console.log("Pommes:", values);
  // console.log("Ketchup: ", values.dueDate.isValid());
  if (values.name === "" || !(values.dueDate.isValid())){ markMissingInput(); }
  else {
    console.debug("[DEBUG] ", values);
    saveNewEventToDatabase(values);
  }
}

/** find out which input fiels was not filled
    and mark it with a red border */
function markMissingInput(){
  let nameBox = document.getElementById("event_name");
  let dateBox = document.getElementById("event_date");
  let timeBox = document.getElementById("event_time");
  if (nameBox.value === ""){ nameBox.style.backgroundColor = "lightred"; }
  if (dateBox.value === ""){ dateBox.style.backgroundColor = "lightred"; }
  if (timeBox.value === ""){ timeBox.style.backgroundColor = "lightred"; }
}

function removeMissingMarkIfPossible(){
  let nameBox = document.getElementById("event_name");
  let dateBox = document.getElementById("event_date");
  let timeBox = document.getElementById("event_time");
  if (nameBox.value !== ""){ nameBox.style.backgroundColor = "white"; }
  if (dateBox.value !== ""){ dateBox.style.backgroundColor = "white"; }
  if (timeBox.value !== ""){ timeBox.style.backgroundColor = "white"; }
}


function clearAllInputs(){
  document.getElementById("event_name").value = "";
  document.getElementById("event_date").value = "";
  document.getElementById("event_time").value = "";
}

function getAllInputs(){
  // get the user inputs
  const name = document.getElementById("event_name").value;
  const dueDate = document.getElementById("event_date").value;
  const dueTime = document.getElementById("event_time").value;
  const combinedDate = dueDate + "T" + dueTime + ":00";
  // console.log(combinedDate);
  let hashString = name + combinedDate;
  let hashCode = hashString.hashCode();
  // console.log(hashString, hashCode);
  const now = new Date();
  return {
    name: name,
    creationDate: now,
    dueDate: new Date(combinedDate),
    tags: [],
    hash: hashCode
  };
}


function calcDifference(date){
  let oneDay = 1000 * 60 * 60 * 24;
  let oneHour = 1000 * 60 * 60;
  let oneMinute = 1000 * 60;
  let today = new Date().getTime();
  let differenceInMilliSec = Math.abs(today - date.getTime());
  let days = Math.floor(differenceInMilliSec / oneDay);
  let hours = Math.floor((differenceInMilliSec % oneDay) / oneHour);
  let minutes = Math.floor(((differenceInMilliSec % oneDay) % oneHour) / oneMinute);
  let seconds = Math.floor((((differenceInMilliSec % oneDay) % oneHour) % oneMinute) / 1000);
  return { days: days, hours: hours, minutes: minutes, seconds: seconds};
}


/*
  create a new list item containing the information from the database
*/
function displayEntry(obj){
  // create an-off-DOM fragment to append everthing to,
  // then only append the fragment once to the actual DOM
  let fragment = new DocumentFragment();
  let li = document.createElement("li");
  // | daysLeft | name | dueDate | remove |
  let eventContainer = document.createElement("div");
  eventContainer.dataset.hash = obj.hash;
  eventContainer.classList.add("event_container");
  let daysLeft = document.createElement("div");
  daysLeft.classList.add("days_left_div");
  let remain = calcDifference(obj.dueDate);
  daysLeft.innerText = remain.days + "d " + remain.hours + "h " + remain.minutes + "m";
  let name = document.createElement("div");
  name.classList.add("event_name_div");
  name.innerText = obj.name;
  let date = document.createElement("div");
  date.classList.add("event_duedate_div");
  date.innerText = obj.dueDate.toLocaleString();
  let remove = document.createElement("div");
  remove.classList.add("remove_div");
  remove.innerText = "X";
  applyClickListener(remove);
  // append each div to the container
  eventContainer.appendChild(daysLeft);
  eventContainer.appendChild(name);
  eventContainer.appendChild(date);
  eventContainer.appendChild(remove);
  // and the container to the list item
  li.appendChild(eventContainer);
  fragment.appendChild(li);
  // add the OFF-DOM-Fragment to the DOM
  document.getElementById("list-data").appendChild(fragment);
}


function applyClickListener(element){
  element.addEventListener("click", removeElement);
}

function removeElement(e){
  let target = e.target;
  if (target.classList.contains("remove_div")){
    let container = target.parentNode;
    console.debug("[DEBUG] remove request for ", container);
    let content = {
      name: container.childNodes[1].innerText,
      dueDate: container.childNodes[2].innerText,
      hash: container.dataset.hash
    };
    console.debug("[DEBUG] remove content: ", content);
    deleteEventsData(content);
    container.remove(); // delete the DOM element
  }
}

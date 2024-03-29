// functionality to handle the dom on the app

const saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", saveInputsToIndexedDB);


const enterpressables = document.getElementsByClassName("enterpressable");
for (epa of enterpressables){
  epa.addEventListener("keypress", (e) => {
    let key = e.which || e.keyCode;
    if (key === 13){
        saveInputsToIndexedDB(e);
    }
  });
}

/** Set default values for date and time
    Default: next day, 10:00 AM
*/
function setDefaultTimestamp(){
  let date = document.getElementById("event_date");
  let time = document.getElementById("event_time");
  let oneDay = 24 * 60 * 60 * 1000;
  let tomorrow = new Date(new Date().getTime() + oneDay);
  date.value = tomorrow.toISOString().split("T")[0];
  time.value = "10:00";
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
  setDefaultTimestamp();
}

/** find out which input fiels was not filled
    and mark it with a red border */
function markMissingInput(){
  let nameBox = document.getElementById("event_name");
  let dateBox = document.getElementById("event_date");
  let timeBox = document.getElementById("event_time");
  if (nameBox.value === ""){ nameBox.style.border = "2px solid red"; }
  if (dateBox.value === ""){ dateBox.style.border = "2px solid red"; }
  if (timeBox.value === ""){ timeBox.style.border = "2px solid red"; }
}

function removeMissingMarkIfPossible(){
  let nameBox = document.getElementById("event_name");
  let dateBox = document.getElementById("event_date");
  let timeBox = document.getElementById("event_time");
  if (nameBox.value !== ""){ nameBox.style.border = "thin solid #515151"; }
  if (dateBox.value !== ""){ dateBox.style.border = "thin solid #515151"; }
  if (timeBox.value !== ""){ timeBox.style.border = "thin solid #515151"; }
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

/** if there is less than 1 day remaining color the time #ff9900
    if there is less than 1 hour remaining color the time #ff3300 */
function colorTimeLeft(container, timeobject){
  if (timeobject.days <= 0){
    container.getElementsByClassName("days_left_div")[0].style.color = "#ff9900";
    if (timeobject.hours <= 0){
      container.getElementsByClassName("days_left_div")[0].style.color = "#ff3300";
    }
  }
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
  eventContainer.classList.add("d-flex");
  eventContainer.classList.add("flex-row");
  eventContainer.classList.add("justify-content-start");
  eventContainer.classList.add("event_container");
  let daysLeft = document.createElement("div");
  daysLeft.classList.add("flex-grow-1");
  daysLeft.classList.add("col-2");
  daysLeft.classList.add("p-1");
  daysLeft.classList.add("mr-3");
  daysLeft.classList.add("days_left_div");
  let remain = calcDifference(obj.dueDate);
  daysLeft.innerText = remain.days + "d " + remain.hours + "h " + remain.minutes + "m";
  let name = document.createElement("div");
  name.classList.add("event_name_div");
  name.classList.add("flex-grow-1");
  name.classList.add("col-6");
  name.classList.add("p-1");
  name.classList.add("mr-3");
  name.innerText = obj.name;
  let date = document.createElement("div");
  date.classList.add("event_duedate_div");
  date.classList.add("flex-grow-1");
  date.classList.add("col-3");
  date.classList.add("p-1");
  date.classList.add("mr-3");
  date.innerText = obj.dueDate.toLocaleString();
  let remove = document.createElement("div");
  remove.classList.add("remove_div");
  // create new delete image
  let removeImg = document.createElement("img");
  removeImg.src = "firefox_icons/Delete_dark.svg";
  removeImg.classList.add("remove_img");
  removeImg.style.height = "20px";
  removeImg.style.width = "20px";
  remove.appendChild(removeImg);
  applyClickListener(remove);
  // append each div to the container
  eventContainer.appendChild(daysLeft);
  eventContainer.appendChild(name);
  eventContainer.appendChild(date);
  eventContainer.appendChild(remove);
  // and the container to the list item
  li.appendChild(eventContainer);
  li.classList.add("list-group-item");
  // li.classList.add("d-flex");
  li.classList.add("flex-row");
  fragment.appendChild(li);
  colorTimeLeft(eventContainer, remain);
  // add the OFF-DOM-Fragment to the DOM
  document.getElementById("list-data").appendChild(fragment);
}


function applyClickListener(element){
  element.addEventListener("click", removeElement);
}

/** get the information for removal of an event from the container */
function getValuesFromContainer(container){
  console.debug("[DEBUG] remove request for ", container);
  return {
    name: container.childNodes[1].innerText,
    dueDate: container.childNodes[2].innerText,
    hash: container.dataset.hash
  };
}


function removeElement(e){
  let target = e.target;
  if (target.classList.contains("remove_img")){
    let container = target.parentNode.parentNode;
    let content = getValuesFromContainer(container);
    console.debug("[DEBUG] remove content: ", content);
    deleteEventsData(content);
    container.parentNode.remove(); // delete the parent DOM element
  }
}

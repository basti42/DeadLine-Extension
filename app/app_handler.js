// functionality to handle the dom on the app

const saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", (event) => {
  const values = getAllInputs();
  if (values.name === "") {
    return;
  }
  console.debug("[DEBUG] ", values);
  saveNewEventToDatabase(values);
  event.preventDefault();
});

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

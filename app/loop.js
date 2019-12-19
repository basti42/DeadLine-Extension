
function refreshTimeLeft(){
  let cs = document.getElementsByClassName("event_container");
  for (c of cs){
    // make a new date from the date string of the container
    let d = new Date(c.getElementsByClassName("event_duedate_div")[0].innerText);
    // then get the new time difference
    let diff = calcDifference(d);
    c.getElementsByClassName("days_left_div")[0].innerText = diff.days + "d " + diff.hours + "h " + diff.minutes + "m";
    // color the time left wen certain threshold are passed
    colorTimeLeft(c, diff);
    // remove data from the objectstore
    if (dateHasPassed(d)){
      let content = getValuesFromContainer(c);
      console.debug("[DEBUG] automatically expiring an event!");
      deleteEventsData(content);
      c.parentNode.remove(); // delete the parent DOM element
      // TODO notification to the user
    }
  }
}

function dateHasPassed(date){
  let difference = date.getTime() - new Date().getTime();
  return (difference >= 0) ? false : true;
}

document.addEventListener("DOMContentLoaded", () => {
  console.debug("[DEBUG] Starting the interval for time left recalculation");
  setInterval(refreshTimeLeft, 30000);
});

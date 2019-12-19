const databaseName = "DeadlineDatabase";
const databaseVersion = 2;
var db;

/* HELPER */
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash); // has to be string to be imutable for indexeddb access
};

Date.prototype.isValid = function () {
    // An invalid date object returns NaN for getTime() and NaN is the only
    // object not strictly equal to itself.
    return this.getTime() === this.getTime();
};



var eventsdata = [
    {name: "Exam", creationDate: "date-string", dueDate: "date-string", tags: ["t1", "t2", "t3"], hash: undefined},
    {name: "Doctors appointment", creationDate: "date-string", dueDate: "date-string", tags: ["t7"], hash: undefined }
];

/*
  wrapper to get the indexedDB
*/
async function getDBPromise(){
  return new Promise((resolve, reject) => {
    let request = window.indexedDB.open(databaseName, databaseVersion);
    // request handlers
    request.onerror = function(event){
      const msg = "Error retrieving database: " + String(event.target.errorCode);
      console.error(msg);
      // reject(msg);
    };

    request.onsuccess = function(event){
      console.log("[INFO] Database request successful");
      let osNames = this.result.objectStoreNames;
      resolve(this.result);
    };

    // upgrad function updating the database
    request.onupgradeneeded = function(event){
      console.debug("[DEBUG] database upgrade ...");
      db = this.result;

      if (!db.objectStoreNames.contains("events")){
        console.debug("[DEBUG] creating initial objectstore 'events'");
        var objectstore = db.createObjectStore("events", {keyPath: "hash", autoincrement: true} );
        // create an index for the objectStore
        objectstore.createIndex("hash", "hash", {unique: true});
        objectstore.createIndex("name", "name", {unique: false});
        objectstore.createIndex("creationDate", "creationDate", {unique:false});
        objectstore.createIndex("dueDate", "dueDate", {unique:false});

        // objectstore.transaction.oncomplete = function(event){
        //   var eventObjectStore = db.transaction("events", "readwrite").objectStore("events");
        //     eventsdata.forEach( (evt) => {
        //       eventObjectStore.add(evt);
        //     });
        // };
      } else {
        console.debug("[DEBUG] object store 'events' already created.");
      }

      /*
        create new objectstores here
      */
      if (!db.objectStoreNames.contains("expiredEvents")){
        console.debug("[DEBUG] creating initial objectstore 'expiredEvents'");
        let objstore = db.createObjectStore("expiredEvents", {keyPath: "hash", autoincrement: true });
        objstore.createIndex("hash", "hash", {unique: true});
        objstore.createIndex("name", "name", {unique: false});
      } else {
        console.debug("[DEBUG] object store 'expiredEvents' already created");
      }

      // resolve the db promise request
      return resolve(this.result);
    };
  });
}


/*
  check if the database and the object store exist
*/
function initializeDatabase() {
  // check if indexedDB is available at all
  window.indexedDB = window.indexedDB;
  if (!window.indexedDB){
    // const msg = "IndexedDB unavailable!";
    // console.log(msg);
    // document.getElementById("message").innerText = msg;
    window.location.href = "sorry.html";
  }

  let promise = getDBPromise();
  promise
    .then((dbp)=>{
      console.log("[INFO] Database successfully initialized.");
    })
    .catch((e) => {
      console.error("[ERROR] ", e);
    });
};

/*
  save new data to the database
  values has to be in the expected form of the objecstore
*/
function saveNewEventToDatabase(values){
  let promise = getDBPromise();
  promise.then( (database) => {
      db = database;

      var transaction = db.transaction(["events"], "readwrite");
      transaction.oncomplete = function(evt){
        console.log("All done with transactions!");
      };
      transaction.onerror = function(err){
        console.log("Error occured during adding values: ", err.target.errorCode);
      };

      var objs = transaction.objectStore("events");
      var req = objs.add(values);
      req.onsuccess = function(event){
        console.log("[INFO] New Data successfully added");
      };
    })
    .then( ()=>{
      console.debug("[DEBUG] After new data was added.");
      // refresh the page and clear the user input
      clearAllInputs();
      window.location.reload();
    });
};

function saveToExpiredEvents(values){
  let promise = getDBPromise();
  promise.then( (database) => {
    db = database;
    let transaction = db.transaction(["expiredEvents"], "readwrite");
    transaction.oncomplete = function(evt){
      console.log("Done with transaction for 'expiredEvents'");
    };
    transaction.onerror = function(err){
      console.error("[Error] while adding object to 'expiredEvents':", err.target.errorCode);
    };
    let objs = transaction.objectStore("expiredEvents");
    let req = objs.add(values);
    req.onsuccess = function(event){
      console.log("[INFO] Expired event successfully added");
    };
  })
  .then( ()=> {
    // TODO do something
  });
}

/*
  retrieve all the data from the objectStore
*/
function loadEventsData(){
  let promise = getDBPromise();
  promise.then( (database) => {
      db = database;

      let everything = db.transaction("events").objectStore("events").getAll();
      everything.onsuccess = function(event){
        console.log("Retrival: ", event.target.result);
          let results = event.target.result;
          // sort the results by dueDate in ascending order
          results.sort((a, b) => {
            let t1 = a.dueDate.getTime();
            let t2 = b.dueDate.getTime();
            if (t1 < t2) return -1;
            else if (t1 === t2) return 0;
            else return 1;
          });
          console.debug("[DEBUG] ascendingly sorted: ", results);
          for (obj of results){
            displayEntry(obj);
          }
        };

      // var objs = db.transaction("events").objectStore("events");
      // objs.openCursor().onsuccess = function(event){
      //   var cursor = event.target.result;
      //   if (cursor){
      //     displayEntry(cursor.value); // pass the values to a function handling the display
      //     cursor.continue();
      //   }
      //   else {
      //     console.debug("[DEBUG] No more entries");
      //   }
      // };

    })
    .catch((e) => {
      console.error("[ERROR] ", e);
    });
};


function deleteEventsData(content){
  console.log("Removing ", content);
  let promise = getDBPromise();
  promise.then( (database)=> {
    db = database;
    let request = db.transaction("events", "readwrite")
                    .objectStore("events")
                    .delete(content.hash);
    request.onsuccess = function(event){
      console.log(event);
      console.log("[INFO] object removed from objectstore!");
    };
    request.onerror = function(error){
      console.log("[ERROR] object with name: " + content.name + " could not be deleted from objectstore.");
    };
  })
  .then( ()=> {
    console.debug("[DEBUG] refreshing after deleting event");
    // clear all inputs from the input forms
    // clearAllInputs();
  });

}



// Start methods after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeDatabase();
  loadEventsData();
}
, false);

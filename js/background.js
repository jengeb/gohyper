'use strict';

// initialize database for first use
var request = window.indexedDB.open("GoHyper");

request.onupgradeneeded = function(event) {
  var db = event.target.result;
  // create an objectStore for this database
  var objStore = db.createObjectStore("quotes", {keyPath: "id", autoIncrement: true});
  objStore.createIndex("by_title", "title", {unique: false});
  objStore.createIndex("by_current_url", "currentUrl", {unique: false});
  objStore.createIndex("by_create_timestamp", "createTimestamp", {unique: true});
  objStore.createIndex("by_update_timestamp", "updateTimestamp", {unique: true});
};

function updateBadge() {
  // get active tab on current window
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    var tab = arrayOfTabs[0];
    // get url of active tab
    var currentUrl = tab.url;

    // search and show how many quotes exist on active tab and update badge
    // get database connection
    var request  = indexedDB.open("GoHyper");
    request.onsuccess = function() {
      var db = request.result;
      var store = db.transaction("quotes", "readonly").objectStore("quotes");

      var index = store.index("by_current_url");
      var singleKeyRange = IDBKeyRange.only(currentUrl);

      // count all quotes on active tab
      var quotes = [];
      index.openCursor(singleKeyRange).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          quotes.push(cursor.value);
          cursor.continue();
        } else {
          // update badge text
          if (quotes.length) {
            chrome.browserAction.setBadgeText({
              text: quotes.length.toString()
            });
          } else {
            chrome.browserAction.setBadgeText({
              text: ''
            });
          }
        }
      };

    };
  });
}

// fires when tab is updated
chrome.tabs.onUpdated.addListener(updateBadge);

// fires when active tab changes
chrome.tabs.onActivated.addListener(updateBadge);

chrome.browserAction.setBadgeBackgroundColor({
  color: '#000'
});

// set up context menu at install time
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    "title": 'Add "%s" to GoHyper',
    "contexts": ["selection"],
    "id": "GoHyper1"
  });
});

chrome.contextMenus.onClicked.addListener(function(info) {
  if (info.menuItemId === "GoHyper1") {
    var quote = info.selectionText;
    var currentUrl = info.currentUrl;
    // TODO
  }
});

// is called onload in the popup code
function getPageDetails(callback) {
  // injects content script into current page
  chrome.tabs.executeScript(null, { file: 'js/content.js' });
  // perform the callback when a message is received from the content script
  chrome.runtime.onMessage.addListener(function(message) {
    callback(message);
  });
};

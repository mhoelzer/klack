const userList = document.getElementById("users");
const messagesDiv = document.getElementById("messageslist");
const textarea = document.getElementById("newmessage");
const ding = new Audio("typewriter_ding.m4a"); // WHY, GOD???

// this will be the list of all messages displayed on the client
let messages = [{ timestamp: 0 }];

let name = window.prompt("Enter your name"); // rest of code doesn't run until you hit OK
// if they didn't type anything at the prompt, make up a random name
if (name.length === 0) name = "Anon-" + Math.floor(Math.random() * 1000);

// add the sender and text of one new message to the bottom of the message list
function appendMessage(msg) {
  messages.push(msg);
  // makes the username bold
  messagesDiv.innerHTML += `<div class="message"><strong>${
    msg.sender
  }</strong><br>${msg.message}</div>`;
}

// redraw the entire list of users, indicating active/inactive
function listUsers(users) {
  let userStrings = users.map(
    user =>
    // if user active, display cyan circle next to name, if not use empty circle
      user.active
        ? `<span class="active"><span class="cyan">&#9679;</span> ${
            user.name
          }</span>`
        : `<span class="inactive">&#9675; ${user.name}</span>`
  );
  userList.innerHTML = userStrings.join("<br>"); // puts each username on its own line
}

// true if the messages div is already scrolled down to the latest message
function scrolledToBottom() {
  return messagesDiv.scrollTop + 600 >= messagesDiv.scrollHeight; // adding 600px to the scrollTop; checking whether or not you are scrolled to the latest message
}

// force the messages div to scroll to the latest message
function scrollMessages() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // scrollTop and scrollHeight are DOM elements
}

function fetchMessages() {
  fetch("/messages?for=" + encodeURIComponent(name)) // ? helps between client and server; client fetches messages, send to that url with parameter for that equals the username is requesting this; eUC replaces weird characters to be readable and usable for a url (spaces are bad)     // encodeURI allows for normally unusable symbols to be used
    .then(response => response.json())
    .then(data => {
      // "data" is the data sent by the server
      // if already scrolled to bottom, do so again after adding messages
      const shouldScroll = scrolledToBottom();
      var shouldDing = false;

      // redraw the user list
      listUsers(data.users);

      // examine all received messages, add those newer than the last one shown
      for (let i = 0; i < data.messages.length; i++) {
        let msg = data.messages[i];
        // looking for the newest message
        if (msg.timestamp > messages[messages.length - 1].timestamp) {
          appendMessage(msg);
          shouldDing = true;
        }
      }
      if (shouldScroll && shouldDing) scrollMessages();
      if (shouldDing) ding.play();

      // poll again after waiting 5 seconds
      setTimeout(fetchMessages, 5000);
    });
}

document.getElementById("newmessage").addEventListener("keypress", event => {
  // if the key pressed was enter (and not shift enter), post the message.
  if (event.keyCode === 13 && !event.shiftKey) {  // #13 = the enter key /// shift + enter = line break
    textarea.disabled = true;
    const postRequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sender: name, message: textarea.value })
    };
    fetch("/messages", postRequestOptions)
      .then(response => response.json())
      .then(msg => {
        appendMessage(msg);
        scrollMessages();

        // reset the textarea
        textarea.value = "";
        textarea.disabled = false;
        textarea.focus();
      });
  }
});

// call on startup to populate the messages and start the polling loop
fetchMessages();

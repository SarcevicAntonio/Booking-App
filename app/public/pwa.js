// src https://developers.google.com/web/fundamentals/codelabs/push-notifications#subscribe_the_user

const applicationServerPublicKey =
  "BKgiAzrxr5QRwi2PDvaQxZbIOma06qTVt5ECBxoiNP-JsA3toLXTj_wnjjtkryevXEiQqA3loeIlpoVFLXj0Goc";

let swRegistration;
let pushButton;

/** Register Service Worker and save registration */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((swReg) => {
      swRegistration = swReg;
      pushButton = document.getElementById("push-button");
      initializeUI();
    })
    .catch((error) => {
      console.error("Service Worker Error", error);
    });
}

/** Initalizes push nofification handling */
function initializeUI() {
  pushButton.addEventListener("click", () => {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });

  // Set the initial subscription value
  swRegistration.pushManager.getSubscription().then((subscription) => {
    isSubscribed = !(subscription === null);
    updateSubscriptionOnServer(subscription);
    if (isSubscribed) {
      console.log("User IS subscribed.");
    } else {
      console.log("User is NOT subscribed.");
    }
    updateBtn();
  });
}

/** Handles UI Button */
function updateBtn() {
  if (Notification.permission === "denied") {
    pushButton.textContent = "Push Messaging Blocked.";
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }
  if (isSubscribed) {
    pushButton.textContent = "Disable Push Messaging";
  } else {
    pushButton.textContent = "Enable Push Messaging";
  }
  pushButton.disabled = false;
}

/** Handles user subscription */
function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager
    .subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    })
    .then((subscription) => {
      console.log("User is subscribed.");
      updateSubscriptionOnServer(subscription);
      isSubscribed = true;
      updateBtn();
    })
    .catch((err) => {
      console.log("Failed to subscribe the user: ", err);
      updateBtn();
    });
}

/** Mock function used to get subscription for codelab push companion */
function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server
  if (subscription) {
    console.log("### SUBSCRIPTION JSON ###");
    console.log(JSON.stringify(subscription));
  }
}

/** string magic */
function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function unsubscribeUser() {
  swRegistration.pushManager
    .getSubscription()
    .then(function (subscription) {
      if (subscription) {
        return subscription.unsubscribe();
      }
    })
    .catch(function (error) {
      console.log("Error unsubscribing", error);
    })
    .then(function () {
      updateSubscriptionOnServer(null);

      console.log("User is unsubscribed.");
      isSubscribed = false;

      updateBtn();
    });
}

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBGqVvM_yXxKQNd9aJL_WFlkGxAvCPx-zs",
    authDomain: "clickbait-detector.firebaseapp.com",
    databaseURL: "https://clickbait-detector.firebaseio.com",
    projectId: "clickbait-detector",
    storageBucket: "clickbait-detector.appspot.com",
    messagingSenderId: "1015683819357"
};
firebase.initializeApp(config);

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
    // Listen for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;
            // [START_EXCLUDE]
            document.getElementById('quickstart-button').textContent = 'Sign out';
            document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
            document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
            // [END_EXCLUDE]
        } else {
            // Let's try to get a Google auth token programmatically.
            // [START_EXCLUDE]
            document.getElementById('quickstart-button').textContent = 'Sign-in with Google';
            document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
            document.getElementById('quickstart-account-details').textContent = 'null';
            // [END_EXCLUDE]
        }
        document.getElementById('quickstart-button').disabled = false;
    });
    // [END authstatelistener]


    document.getElementById('quickstart-button').addEventListener('click', startSignIn, false);
    document.getElementById('report-clickbait-button').addEventListener('click', writeClickbaitData, false);
}

function writeClickbaitData() {
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {

        var pageUrl = tabs[0].url;
        var pageTitle = tabs[0].title;
        var docUrl = document.URL;
        var docTitle = document.title;
        sendPageData(pageUrl, pageTitle);
    });
}

function sendPageData(pageUrl, pageTitle) {
    var newKey = firebase.database().ref().child('baits').push().key;

    firebase.database().ref('baits/' + newKey).set({
        url: pageUrl,
        title: pageTitle
    });
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function (token) {
        if (chrome.runtime.lastError && !interactive) {
            console.log('It was not possible to get a token programmatically.');
        } else if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        } else if (token) {
            // Authorize Firebase with the OAuth Access Token.
            var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            firebase.auth().signInWithCredential(credential).catch(function (error) {
                // The OAuth token might have been invalidated. Lets' remove it from cache.
                if (error.code === 'auth/invalid-credential') {
                    chrome.identity.removeCachedAuthToken({token: token}, function () {
                        startAuth(interactive);
                    });
                }
            });
        } else {
            console.error('The OAuth Token was null');
        }
    });
}

/**
 * Starts the sign-in process.
 */
function startSignIn() {
    document.getElementById('quickstart-button').disabled = true;
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    } else {
        startAuth(true);
    }
}

window.onload = function () {
    initApp();
};
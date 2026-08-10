/* ============================================================================
   MindAICode — Firebase configuration
   ----------------------------------------------------------------------------
   The site works completely WITHOUT this. If ENABLED stays false, everything
   runs exactly as it does today: progress saves in the browser, no sign-in
   button appears, nothing is sent anywhere. Fill this in only when you are
   ready to turn on cross-device sync.

   HOW TO FILL IT IN
   -----------------
   1. Go to  https://console.firebase.google.com  and create a project.
   2. Inside the project: Build -> Authentication -> Sign-in method
        -> enable "Google".
   3. Build -> Firestore Database -> Create database -> Production mode.
   4. Project settings (gear icon) -> scroll to "Your apps" -> click the
        web icon  </>  -> register the app -> copy the firebaseConfig values
        into FIREBASE below.
   5. Authentication -> Settings -> Authorized domains -> Add domain
        -> add  crsdevadmin.github.io   (and localhost for testing).
   6. Set ENABLED to true.

   FIRESTORE SECURITY RULES — paste these in Firestore -> Rules.
   Without them anyone could read every student's record.

     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /students/{uid} {
           allow read, write: if request.auth != null && request.auth.uid == uid;
         }
       }
     }

   These say: a signed-in student may read and write ONLY their own document,
   and nobody can read anyone else's. You can still see everything yourself
   from the Firebase console.
   ============================================================================ */

const MINDAICODE_FIREBASE = {
  /* Flip to true once the values below are real. */
  ENABLED: false,

  FIREBASE: {
    apiKey: 'PASTE_YOUR_API_KEY',
    authDomain: 'PASTE_YOUR_PROJECT.firebaseapp.com',
    projectId: 'PASTE_YOUR_PROJECT_ID',
    storageBucket: 'PASTE_YOUR_PROJECT.appspot.com',
    messagingSenderId: 'PASTE_SENDER_ID',
    appId: 'PASTE_APP_ID',
  },

  /* ---------------------------------------------------------------- profile */
  /* A phone number is NOT needed to sync progress across devices — Google
     already gives us a verified email. Collecting phone numbers from students,
     many of whom are under 18, carries extra obligations under India's DPDP
     Act 2023 (including verifiable parental consent). It is left optional on
     purpose. Set this to true only if you genuinely need to call or SMS them,
     and make sure your privacy notice says so. */
  REQUIRE_PHONE: false,

  /* Ask what they are studying. Useful for understanding your cohort. */
  ASK_STUDY: true,

  /* Shown on the sign-in card. Point this at a real page before collecting
     anything from minors. */
  PRIVACY_NOTE: 'We store your name, email and course only to save your progress across devices. We never sell it or show ads. You can delete your account and all of its data at any time from the profile menu.',

  STUDY_OPTIONS: [
    'School — Class 9 or 10',
    'School — Class 11 or 12',
    'Diploma / Polytechnic',
    'Engineering — 1st year',
    'Engineering — 2nd year',
    'Engineering — 3rd year',
    'Engineering — final year',
    'BSc / BCA / other degree',
    'Postgraduate',
    'Working professional',
    'Self-learner',
  ],
};

if (typeof module !== 'undefined' && module.exports) module.exports = MINDAICODE_FIREBASE;

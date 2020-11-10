# Personal Peloton Live Ride Calendar
A Google Apps Script that updates a personal Google Calendar with specified Peloton classes


## Setup Instructions
1. Click on the PelotonApiClient.gs file to view the code
2. Click on the "Raw" button near the top of the file to view the raw code
3. Copy all of the code (shortcuts: CTRL + A, then CTRL + C)
4. Go to https://script.google.com/home (You may need to sign into Google if you aren't already signed in.)
5. Click on New Project
6. Name the project whatever you'd like
7. Click into the code.gs file and delete all of the sample code in it
8. Paste the code you copied in step 3 (CTRL + V)
9. Save the file (File > Save)
10. Enable the Google Calendar API:
* Go to Resources > Advanced Google services
* Scroll down to "Calendar API" and toggle the "off" switch to "on"
* Click OK
11. Follow the instructions in the code to a) add your custom filters and b) set up the trigger
12. To test your filters, run the file manually once. To run manually:
* Select "updateCalendar" from the select function dropdown (to the right of the bug icon)
* Click the play button (triangle icon) to run the "updateCalendar" function
* You will be prompted to authorize the script to access your calendar. Click on Review Permissions and choose your account.
* You will see a security warning because Google has not verified this script. To bypass this warning, click on Advanced and then "Go to [whatever you named your project] (unsafe)"
** Note: There is not a way around this at this point in time. If you are uncomfortable granting access to your calendar for an unverified script, please do not proceeed. As with any script, it's a good idea to review the code before running anything so you know what it does. 
* Click Allow
13. Now that the script has permissions to run, check that "updateCalendar" is the selected function and click the play button again
14. The script should run in under 10 seconds, unless you have lots of filters (creating events via Google Apps Scripts takes time).

## Troubleshooting
If you have any red errors that pop up when you run the script, it generally means that you have a typo. Check your filter against the provided example.

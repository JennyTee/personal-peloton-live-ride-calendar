/* 
Personal Peloton Live Ride Calendar Script
Version 1.1.0

DISCLAIMER: this script is provided as-is, and the author is not responsible for any issues that arise from 
using it. As with any open-source software script, it's a good idea to read through the code and know what it 
does before granting it access to modify your calendar.


***************************************************************************************************************
                                              INSTRUCTIONS                                                    
***************************************************************************************************************

Step 1. Set Up Filters

Category options: ALL, Cycling, Strength, Yoga, Meditation, Cardio, Stretching, Outdoor, Running, Walking,
                  Bootcamp, Bike_Bootcamp

Instructor options: ALL, Aditi Shah, Adrian Williams, Anna Greenberg, Alex Toussaint, Ally Love, Andy Speer,
                    Becs Gentry, Ben Alldis, Chase Tucker, Chelsea Jackson Roberts, Christine D\'Ercole,
                    Cliff Dwenger, Cody Rigsby, Denis Morton, Emma Lovewell, Erik Jäger, Hannah Corbin, 
                    Hannah Frankson, Irène Scholz, Jenn Sherman, Jess Sims, Jess King, Kendall Toole, 
                    Kristin McGee, Leanne Hainsby, Matt Wilpers, Matty Maggiacomo, Mayla Wedekind, 
                    Olivia Amato, Rebecca Kennedy, Robin Arzón, Ross Rayburn, Sam Yo, Selena Samuela, 
                    Tunde Oyeneyin, Christian Vande Velde
                          
When setting up your filters, you must copy/paste the filter options exactly as listed above. As shown below,
you will put square brackets around the entire list of filters. Each filter must be surrounded by curly braces 
and separated with commas. Inside of the filter, the selected option must be surrounded by single quotes and 
separated with commas.

Note: you need to update your filter before moving on to step 2. You may update your filter at any time.

This example will filter for Christine's cycling classes, Adrian's strength classes, Jess Sims' bike bootcamp 
classes, all yoga classes, and all classes taught by Denis:

var filters = [
  {
    category: 'Cycling',
    instructor: 'Christine D\'Ercole'
  },
  {
    category:'Strength',
    instructor:'Adrian Williams'
  },
  {
    category:'Bike_Bootcamp',
    instructor:'Jess Sims'
  },
  { 
    category: 'Yoga',
    instructor: 'ALL'
  },
  { 
    category: 'ALL',
    instructor: 'Denis Morton'
  }
]

Enter YOUR filters below (as many as you want)! Save the code (Click on File > Save) before moving on.
*/

var filters = [
  
]


/*

Step 2. 
Test the script to make sure your filter is working as-expected.

To run the script, select the "updateCalendar" function in the dropdown menu to the right of the bug icon near
the top of this page. (It should be the first one in the list.) Then click Run (triangle icon) to the
left of the debug (bug) icon.

You will see a yellow banner that says "Running function runScript..." This will disappear once the function is 
finished running. (It may take 10-20 seconds.) If the filter above is configured correctly, you should see any
matching classes added to your Google Calendar after the function finishes running.

Note: if you have lots of classes in your filter, it's possible that Google will limit the number of events 
ths script creates for you. If you think all of the matching events weren't created, you can just re-run the script.
You should see events created between now and approximately 2 weeks in the future.


Step 3.
Set up a trigger to update your calendar once per hour!

Select the "createHourlyTrigger" function in the dropdown menu, then click the play button (just like you did in 
Step 2). 

When run, the createHourlyTrigger function will create a trigger that will run this script on your calendar 
once per hour. This ensures your calendar stays up-to-date. Whenever classes matching your filter are added, 
updated, or removed, your calendar will be updated accordingly.

Only run this function once! (If you accidentally run it more than once, you can go to 
https://script.google.com/home/triggers to delete any duplicate triggers created.)

*/

/***************************************************************************************************************
                    END INSTRUCTIONS - DO NOT EDIT BELOW THIS LINE (unless you want to!)                                               
***************************************************************************************************************/


var data;
var instructorList;
var instructorHashMap;
var instructorNameHashMap;
var classList;
var classMetadata;
var addedClassCount = 0;
var removedClassCount = 0;
var updatedClassCount = 0;
var calendarId = 'primary';

// If you don't round the queryStartTime, the API only returns about half of the results
var queryStartTime = Math.round(Date.now() / 1000);
// Get end time 13 days in future - the API is finnicky about start/end times passed in and will
// not return all results if it gets unexpected start/end dates
var queryEndTime = queryStartTime + 1213199;
var url = `https://api.onepeloton.com/api/v3/ride/live?exclude_complete=true&content_provider=`
  + `studio&exclude_live_in_studio_only=true&start=${queryStartTime}&end=${queryEndTime}`;

function updateCalendar() {
  // Need to track processed classes since Peloton API sometimes returns duplicate objects
  let existingEvents = getUpcomingPelotonCalendarEvents();
  let existingEventCount = existingEvents.size;
  let response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
  let json = response.getContentText();
  data = JSON.parse(json);
  
  instructorList = data.instructors;
  instructorHashMap = new Map(instructorList.map(i => [i.id, i]));
  instructorNameHashMap = new Map(instructorList.map(i => [`${i.first_name} ${i.last_name}`, i.id]));
  
  classList = data.rides;  
  
  classMetadata = data.data;
  let pelotonClassCount = classMetadata.length;
    
  for (let i = 0; i < classMetadata.length; i++) {
    let pelotonClassMetadata = classMetadata[i];
    let rideId = pelotonClassMetadata.ride_id;
    let metadataId = pelotonClassMetadata.id;
    
    let classInfoIndex = classList.findIndex(c => c.id === rideId);
    let classInfo = classList.splice(classInfoIndex, 1)[0];
    
    // The actual class start time is located inside of the Data object
    let actualStartTime = pelotonClassMetadata.scheduled_start_time;

    let meetsFilterCriteria = getMeetsFilterCriteria(classInfo);
    let hasMatchingCalendarEvent = existingEvents.has(metadataId);
    
    if (meetsFilterCriteria && hasMatchingCalendarEvent) {
      let existingEvent = existingEvents.get(metadataId);
      checkForEventUpdates(classInfo, existingEvent, actualStartTime, pelotonClassMetadata.is_encore, metadataId);
      existingEvents.delete(metadataId);
    } else if (meetsFilterCriteria) {
      let createdEvent = createEvent(classInfo, actualStartTime, pelotonClassMetadata.is_encore, metadataId);
      addedClassCount++;
      logCreatedEvent(createdEvent);
    }    
  }
  
  if (existingEvents.size > 0) {
    let eventsToRemove = existingEvents.values();
    
    for (let i = 0; i < existingEvents.size; i++) {
      let eventToRemove = eventsToRemove.next().value;
      deleteEventById(eventToRemove.id);
      removedClassCount++;
      logDeletedEvent(eventToRemove);
    }
  } 
  
  logScriptRun(existingEventCount, pelotonClassCount, addedClassCount, removedClassCount, updatedClassCount);
}

function createHourlyTrigger() {
  ScriptApp.newTrigger('updateCalendar')
  .timeBased()
  .everyHours(1)
  .atHour(5)
  .create();
}

function getMeetsFilterCriteria(classInfo) {
  let wildcard = 'all';
  for (let i = 0; i < filters.length; i++) {
    let filter = filters[i];
    if ((classInfo.fitness_discipline_display_name.toLowerCase() === filter.category.toLowerCase()
              || filter.category.toLowerCase() === 'all') &&
        (classInfo.instructor_id === instructorNameHashMap.get(filter.instructor) 
              || filter.instructor.toLowerCase() === 'all')) {
      return true;
    }
  }
  
  return false;
}

function getInstructorName(instructorId) {
  let instructor = instructorHashMap.get(instructorId);
  if (!!instructor) {
    if (!!instructor.last_name) {
      return `${instructor.first_name} ${instructor.last_name}`;
    } else {
    return `${instructor.first_name}`;
    }
  }
  return '';
}

function createEvent(ride, actualStartTime, isEncore, rideMetadataId) {
  let startTime = actualStartTime * 1000;
  let endTime = startTime + (ride.duration * 1000);
  
  let summary = buildEventSummary(ride, actualStartTime, isEncore);
  
  let event = {
    summary: summary,
    location: getInstructorName(ride.instructor_id),
    description: ride.description,
    start: {
      dateTime: new Date(startTime).toISOString()
    },
    end: {
      dateTime: new Date(endTime).toISOString()
    },
    colorId: isEncore ? 3 : 2,
    // Extended properties are not currently displayed in created calendar events. They are just metadata tags.
    extendedProperties: {
      shared: {
        classLength: ride.duration / 60,
        classId: ride.id,
        classType: ride.fitness_discipline_display_name,
        hasClosedCaptions: ride.has_closed_captions,
        instructor: getInstructorName(ride.instructor_id),
        metadataId: rideMetadataId
      }
    }
  };
  event = Calendar.Events.insert(event, calendarId);
  return event;
}

function buildEventSummary(ride, actualStartTime, isEncore) {
  let foreignLanguageIndicator = '';
  // If rides are offered in other languages someday, this will need to be updated.
  if (ride.origin_locale == 'de-DE') {
    foreignLanguageIndicator = ' [German]';
  }
  let encoreIndicator = !!isEncore ? ' [Encore]' : '';
  let eventSummary = `${ride.title}${foreignLanguageIndicator}${encoreIndicator}`;
  return eventSummary;
}

function getUpcomingPelotonCalendarEvents() {
  let existingEvents = new Map();
  let now = new Date();
  let events = Calendar.Events.list(calendarId, {
    timeMin: now.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500
  });
  if (events.items && events.items.length > 0) {
    for (let i = 0; i < events.items.length; i++) {
      let event = events.items[i];
      let extendedProperties = event.getExtendedProperties()
      if (!extendedProperties) { 
        continue;
      }
      let sharedExtendedProperties = extendedProperties.getShared();
      if (!!sharedExtendedProperties && sharedExtendedProperties.metadataId != null) {
        existingEvents.set(sharedExtendedProperties.metadataId, event);
      }
    }
  }
  return existingEvents;
}

function deleteEventById(eventId) {
  try {
    let event = CalendarApp.getCalendarById(calendarId).getEventById(eventId);
    event.deleteEvent();
  } catch(e) {
    logError(e);
  }
}

function checkForEventUpdates(pelotonClass, existingEvent, actualStartTime, isEncore, metadataId) {
  // Extended properties are not currently checked for differences, as they are hidden to the end user.
  let titleUpdated = false;
  let titleUpdate = null;
  let instructorUpdated = false;
  let instructorUpdate = null;
  let descriptionUpdated = false;
  let descriptionUpdate = null;
  let startTimeUpdated = false;
  let startTimeUpdate = null;
  let endTimeUpdated = false;
  let endTimeUpdate = null;
  
  // Remove "[Encore]" and "[German]" from existing event titles before comparing ride names
  let existingEventTitle = existingEvent.summary.replace(/ \[Encore]| \[German]/gi, '');
  if (pelotonClass.title != existingEventTitle) {
    titleUpdated = true;
    titleUpdate = {
      previousTitle: existingEvent.summary,
      newTitle: pelotonClass.title
    };
  } else {
    titleUpdate = {
      unchangedTitle: existingEvent.summary
    }
  }
  
  let instructorName = getInstructorName(pelotonClass.instructor_id);
  if (instructorName !== existingEvent.location) {
    instructorUpdated = true;
    instructorUpdate = {
      previousInstructor: existingEvent.location,
      newInstructor: instructorName
    };
  } else {
    instructorUpdate = {
      unchangedInstructor: existingEvent.location
    }
  }
  
  if (pelotonClass.description != existingEvent.description) {
    descriptionUpdated = true;
    descriptionUpdate = {
      previousDescription: existingEvent.description,
      newDescription: pelotonClass.description
    }
  } else {
    descriptionUpdate = {
      unchangedDescription: existingEvent.description
    }
  }
  
  let startTimeEpochTime = actualStartTime * 1000;
  let endTimeEpochTime = startTimeEpochTime + (pelotonClass.duration * 1000);
  
  let existingStartTime = existingEvent.getStart().getDateTime();
  let existingStartTimeEpochTime = Date.parse(existingStartTime);
  let existingEndTime = existingEvent.getEnd().getDateTime();
  let existingEndTimeEpochTime = Date.parse(existingEndTime);

  if (startTimeEpochTime != existingStartTimeEpochTime) {
    startTimeUpdated = true;
    startTimeUpdate = {
      previousStartTime: existingStartTime,
      newStartTime: new Date(startTimeEpochTime).toISOString()
    }
  } else {
    startTimeUpdate = {
      unchangedStartTime: existingStartTime
    }
  }

  if (endTimeEpochTime != existingEndTimeEpochTime) {
    endTimeUpdated = true;
    endTimeUpdate = {
      previousEndTime: existingEndTime,
      newEndTime: new Date(endTimeEpochTime).toISOString()
    }
  } else {
    endTimeUpdate = {
      unchangedEndTime: existingEndTime
    }
  }
  
  if (titleUpdated || instructorUpdated || descriptionUpdated || startTimeUpdated || endTimeUpdated) {
    let eventUpdates = {
      titleUpdate: titleUpdate,
      instructorUpdate: instructorUpdate,
      descriptionUpdate: descriptionUpdate,
      startTimeUpdate: startTimeUpdate,
      endTimeUpdate: endTimeUpdate
    }

    deleteEventById(existingEvent.id);
    createEvent(pelotonClass, actualStartTime, isEncore, metadataId);
    updatedClassCount++;
    logUpdatedEvent(existingEvent, eventUpdates);
  }
}

function logCreatedEvent(event) {
  let logEntry = new LogEntry('Class added', event.getSummary(), event);
  Logger.log(logEntry);
}

function logDeletedEvent(event) {
  let logEntry = new LogEntry('Class deleted', event.getSummary(), event);
  Logger.log(logEntry);
}

function logUpdatedEvent(event, eventUpdates) {
  let logEntry = new LogEntry('Class updated', event.getSummary(), eventUpdates);
  Logger.log(logEntry);
}

function logScriptRun(existingCalendarEventCount, pelotonClassCount, addedClassCount, removedClassCount, updatedClassCount) {
  let summary = 'Script run completed ' + new Date();
  let details = {
    existingClassesInCalendar: existingCalendarEventCount.toFixed(),
    classesFromPelotonApi: pelotonClassCount.toFixed(),
    classesAdded: addedClassCount.toFixed(),
    classesRemoved: removedClassCount.toFixed(),
    classesUpdated: updatedClassCount.toFixed()
  };
  let logEntry = new LogEntry('Script run', summary, details);
  Logger.log(logEntry);
}

function logError(exception) {
  let logEntry = new LogEntry('Script error', exception, 'No event details available.');
  Logger.log(logEntry);
}
    
class LogEntry {
  constructor(logType, summary, eventDetails) {
    this.logType = logType;
    this.summary = summary;
    this.eventDetails = eventDetails
  }
}
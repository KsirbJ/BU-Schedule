// ==UserScript==
// @name         BU-Schedule
// @namespace    https://jakebri.sk/
// @version      0.1
// @description  Exports your BU class schedule to a .ics file to import into Google Calander.
// @author       Jake Brisk
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js
// @match        https://ssb.cc.binghamton.edu/banner/bwskfshd.P_CrseSchdDetl
// @run-at       document-end
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[
/* jshint ignore:end */
    /* jshint esnext: false */
    /* jshint esversion: 6 */

    $(function(){
		// add the export button
        $(".pageheaderlinks").prepend('<a href="#" id="export_btn">Export to Calender</a>');
		
		/**
		 *	This class is used to create events in the iCalendar spec
		 */
		class Cal_Event {
			// constructor
			constructor(tbegin, tend, dbegin, dend, dow, sum, loc, desc){
				this.tbegin = tbegin;
				this.tend = tend;
				this.dbegin = dbegin;
				this.dend = dend;
				this.dow = dow;
				this.sum = sum;
				this.loc = loc;
				this.desc = desc;	
			}	

			/**
			 *	Takes in a weekday and time and returns a calender ready time element
			 * 	
			 *	@param {string} weekday
			 *	@param {string} time as hh:mm xx
			 *	@return {string} weekday and time as YYYYMMDDTHHMMSS
			 */
			time_to_stamp(weekday, time){
				
				time = time.trim();

				let t = moment(time, ['h:mm A']).day(weekday);//.hour(Number(time.split(":")[0])).minute(Number(time.split(":")[1].split(" ")[0]));
				return t.format("YYYYMMDD[T]HHmmss");
			}

			/** 
			 *	Converts a letter to its corresponding weekday
			 *
			 *	@param {char} letter
			 *	@return {string} weekday 
			 */
			letter_to_weekday(letter){
				switch(letter){
					case 'M':
						return "Monday";
					case 'T':
						return "Tuesday";
					case 'W':
						return "Wednesday";
					case 'R':
						return "Thursday";
					case 'F':
						return "Friday";
					case 'S':
						return "Saturday";
					default:
						return "Not a day";
				}
			}

			/**
			 *	Convert the event to an ics ready event
			 *
			 *	@return {string} the iCal spec compliant event
			 */
			to_ics_event(){
				let event = (`BEGIN:VEVENT\n
							UID:${moment().format("YYYYMMDD[T]HHmmss")}-${this.get_uid()}@binghamton.edu\n
							DTSTAMP:${moment().format("YYYYMMDD[T]HHmmss")}\n
							DTSTART:${this.time_to_stamp(this.letter_to_weekday(this.dow), this.tbegin)}\n
							DTEND:${this.time_to_stamp(this.letter_to_weekday(this.dow), this.tend)}\n
							SUMMARY:${this.sum}\n
							LOCATION:${this.loc}\n
							RRULE:FREQ=WEEKLY;UNTIL=${moment(new Date(this.dend)).format("YYYYMMDD")}T000000\n
							TRANSP:OPAQUE\n
							BEGIN:VALARM\n
							ACTION:DISPLAY\n
							DESCRIPTION:This is an event reminder\n
							TRIGGER:-P0DT0H30M0S\n
							END:VALARM\n
							END:VEVENT\n`).replace(/^							/gm, '');
				return event;
			}
			/**
			 *	generate a unique-ish random UID 
			 *	(https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
			 *
			 *	@return {string} uid
			 */
			get_uid() {
			    let S4 = function() {
			       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
			    };
			    return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			}
		}
        
        /** 
         *	Main function, extracts the class info from the page and prompts 
         *	the user to download a .ics file containing the class times as events
         */
        function main(){

	        let class_table = [];
			let table_index = 0;
			
			// find all classes in the table
			$(".datadisplaytable[summary='This table lists the scheduled meeting times and assigned instructors for this class..']").each(function(i){
				
				// find the cells containing the class info
				let cells = $(this).find("tr").eq(1).find("td:lt(5):gt(0)");
			
				// make a new event for each day of week
				let dow = $(cells.get(1)).text();

				for(let x = 0; x < dow.length; ++x){
			
					class_table[table_index++] = new Cal_Event($(cells.get(0)).text().split("-")[0], $(cells.get(0)).text().split("-")[1], 
								$(cells.get(3)).text().split("-")[0], $(cells.get(3)).text().split("-")[1], dow[x], "Class", 
								$(cells.get(2)).text(), "");		
				}
				
				
			});

			// convert the classes to calendar ready events
			let event_list = '';
			class_table.forEach((el, i, arr) => {
				event_list += arr[i].to_ics_event();
			});

			// add the calendar heading
			let calendar = `BEGIN:VCALENDAR\n
PRODID:-//Jake Brisk//BU Calendar//EN\n
VERSION:2.0\n
CALSCALE:GREGORIAN\n
METHOD:PUBLISH\n
X-WR-CALNAME:bu-schedule@binghamton.edu\n
X-WR-TIMEZONE:America/New_York\n
${event_list}
END:VCALENDAR\n`;
			
			// prompt to download the file
			let element = document.createElement('a');
			element.setAttribute('href', 'data:text/calendar,' + encodeURIComponent(calendar));
			element.setAttribute('download', 'test.ics');

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		}

		//get_file();

		$(document).on('click', '#export_btn', (e) => {
			main();
			e.preventDefault();
			e.stopPropagation();
		});



    });

/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */
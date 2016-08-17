/* =========================================================
 * bootstrap-datedisplay.js
 * =========================================================
 * Orignal project and code by Stefan Petre, and improved by Andrew Rowls
 * Created by Stefano Borghi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


	function UTCDate(){
		return new Date(Date.UTC.apply(Date, arguments));
	}
	
	// define DateDisplay object
	var DateDisplay = function (element, options) {
		
		this.element = $(element);
		this.language = "en";
		this.format = ddDOM.parseFormat(options.format || this.element.data('date-format') || 'mm/dd/yyyy');
		
		//associate DOM object
		this.DD = $(ddDOM.template).appendTo('body');
		
		//add events
		// this.element.on({
		// 		mouseenter: $.proxy(this.show, this),
		// 		mouseleave: $.proxy(this.hide, this)
		// 	});
		
		//apply style
		this.DD.addClass('datedisplay-dropdown dropdown-menu');
		this.todayHighlight = options.todayHighlight || false;
		this.calendarWeeks = options.calendarWeeks || false;
		if (this.calendarWeeks) {
			this.DD.find('.datedisplay-days .datedisplay-switch, thead .datedisplay-title')
				.attr('colspan', function (i, val) {
					return Number(val) + 1;
				});
		}
		this.weekStart = ((options.weekStart || this.element.data('date-weekstart') || 0) % 7);
		this.weekEnd = ((this.weekStart + 6) % 7);
		
		return this;
	};
	
	//Define methods
	DateDisplay.prototype = {
		
		//show calendar
		show: function(e) {
			this.DD.show();
			this.height = this.element.outerHeight();
			this.setCalendar();
			this.place();
			$(window).on('resize', $.proxy(this.place, this));
			if (e ) {
				e.stopPropagation();
				e.preventDefault();
			}
		},
		
		//remove object and DOM elements
		remove: function() {
			this.DD.remove();
			delete this.element.data().datedisplay; // needed??
		},

		//set css to place the calendar close to the element
		place: function(){
			var zIndex = parseInt(this.element.parents().filter(function() {
							return $(this).css('z-index') != 'auto';
						}).first().css('z-index'))+10;
			var offset = this.element.offset();
			var height = this.element.outerHeight(true);
			this.DD.css({
				top: offset.top + height,
				left: offset.left,
				zIndex: zIndex
			});
		},
		
		//create calendar
		setCalendar: function(){
			//set date from element html content
			var d = this.element.html();
			this.date = ddDOM.parseDate(d, this.format, this.language);
			if (this.date < this.startDate) {
				this.viewDate = new Date(this.startDate);
			} else if (this.date > this.endDate) {
				this.viewDate = new Date(this.endDate);
			} else {
				this.viewDate = new Date(this.date);
			}
			this.fill();
		},

		//set days of the week
		fillDow: function(){
			var dowCnt = this.weekStart,
			html = '<tr>';
			if (this.calendarWeeks) {
				html += '<th class="cw">&#35;</th>';
			}
			while (dowCnt < this.weekStart + 7) {
				html += '<th class="dow">'+dates[this.language].daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.DD.find('.datedisplay-days thead').append(html);
		},
		
		//fill calendar based on the date
		fill: function() {
			this.fillDow();
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				currentDate = this.date && this.date.valueOf(),
				today = new Date();
			this.DD.find('.datedisplay-days thead th:eq(1)')
						.text(dates[this.language].months[month]+' '+year);
			this.DD.find('tfoot th.today')
						.text(dates[this.language].today)
						.toggle(false);
			var prevMonth = UTCDate(year, month-1, 28,0,0,0,0),
				day = ddDOM.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var weekDay, clsName;
			
			while (prevMonth.valueOf() < nextMonth ) {
				weekDay = prevMonth.getUTCDay();
				if (weekDay === this.weekStart) {
					html.push('<tr>');
					if (this.calendarWeeks) {
						
						// ISO 8601: First week contains first thursday.
						// ISO also states week starts on Monday, but we can be more abstract here.
						var
							// Start of current week: based on weekstart/current date
							ws = new Date(+prevMonth + (this.weekStart - weekDay - 7) % 7 * 864e5),
							// Thursday of this week
							th = new Date(Number(ws) + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
							// First Thursday of year, year from thursday
							yth = new Date(Number(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
							// Calendar week: ms between thursdays, div ms per day, div 7 days
							calWeek = (th - yth) / 864e5 / 7 + 1;
						html.push('<td class="cw">' + calWeek + '</td>');
					}
				}
				
				clsName = '';
				if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month)) {
					clsName += ' old';
				} else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month)) {
					clsName += ' new';
				}
				// Compare internal UTC date with local today, not UTC today
				if (this.todayHighlight &&
					prevMonth.getUTCFullYear() == today.getFullYear() &&
					prevMonth.getUTCMonth() == today.getMonth() &&
					prevMonth.getUTCDate() == today.getDate()) {
					clsName += ' today';
				}
				if (currentDate && prevMonth.valueOf() == currentDate) {
					clsName += ' active';
				}
				if (prevMonth.valueOf() < this.startDate || prevMonth.valueOf() > this.endDate ||
					$.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1) {
					clsName += ' disabled';
				}
				html.push('<td class="day'+clsName+'">'+prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() == this.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate()+1);
			}
			this.DD.find('.datedisplay-days tbody').empty().append(html.join(''));
		}
		
	};

	//new languages can go here
	var dates = {
		en: {
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		}
	};

	var ddDOM = {
		isLeapYear: function (year) {
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
		},
		getDaysInMonth: function (year, month) {
			return [31, (ddDOM.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function(format){
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
				parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0){
				throw new Error("Invalid date format.");
			}
			return {separators: separators, parts: parts};
		},
		parseDate: function(date, format, language) {
			if (date instanceof Date) { return date; }
			
			var part;

			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
				var part_re = /([\-+]\d+)([dmwy])/;
				var partsMatch = date.match(/([\-+]\d+)([dmwy])/g);
				var dir;
				date = new Date();
				for (var i=0; i< partsMatch.length; i++) {
					part = part_re.exec(partsMatch[i]);
					dir = parseInt(part[1]);
					switch(part[2]){
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = DateDisplay.prototype.moveMonth.call(DateDisplay.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = DateDisplay.prototype.moveYear.call(DateDisplay.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
			}
			var parts = date && date.match(this.nonpunctuation) || [];
			date = new Date();
			var parsed = {};
			var setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'];
			var setters_map = {
					yyyy: function(d,v){ return d.setUTCFullYear(v); },
					yy: function(d,v){ return d.setUTCFullYear(2000+v); },
					m: function(d,v){
						v -= 1;
						while (v<0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() != v)
							d.setUTCDate(d.getUTCDate()-1);
						return d;
					},
					d: function(d,v){ return d.setUTCDate(v); }
				};
			var val;
			var filtered;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length != fparts.length) {
				fparts = $(fparts).filter(function(i,p){
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			if (parts.length == fparts.length) {
				for (var i=0, cnt = fparts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)) {
						switch(part) {
							case 'MM':
								filtered = $(dates[language].months).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				for (var i=0, s; i<setters_order.length; i++){
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s]))
						setters_map[s](date, parsed[s]);
				}
			}
			return date;
		},
		formatDate: function(date, format, language){
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			var dateArr = [];
			var seps = $.extend([], format.separators);
			for (var i=0, cnt = format.parts.length; i < cnt; i++) {
				if (seps.length)
					dateArr.push(seps.shift());
				dateArr.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		template: '<div class="datedisplay">' +
							'<div class="datedisplay-days">' +
								'<table class=" table-condensed">' +
									'<thead>'+
										'<tr>'+
										'<th></th>'+
										'<th colspan="5" class="switch"></th>'+
										'<th></th>'+
										'</tr>'+
									'</thead>' +
									'<tbody></tbody>' +
								'</table>' +
							'</div>' +
						'</div>'
	};


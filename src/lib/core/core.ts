/**
 * This class holds core program data and associated parsing methods from processed CSV files.
 * Separate parsing classes for movement, conversation, and code CSV files test parsed data from PapaParse
 * results and generate different data structures
 * These data structures are integrated into a Path object which is the central data structure for the IGS
 * Original data from each CSV file is stored within each parsing class for re-processing as new data is loaded
 * Each time CSV file is successfully loaded and parsed, domController is called to update GUI elements
 *
 */
import Papa from 'papaparse'; // Import this if it's not globally available

import { CoreUtils } from './core-utils.js';
import { ParseMovement } from './parse-movement.js';
import { ParseConversation } from './parse-conversation.js';
import { ParseCodes } from './parse-codes.js';

import { DataPoint } from '../../models/dataPoint.js';
import { User } from '../../models/user.js';
// import type { DataPoint } from '../../models/dataPoint.js';
// import type { User } from '../../models/user.js';
import type p5 from 'p5';
import UserStore from '../../stores/userStore';
import * as Constants from '../constants/index.js';

export class Core {
	sketch: p5;
	coreUtils: CoreUtils;
	parseMovement: ParseMovement;
	parseConversation: ParseConversation;
	parseCodes: ParseCodes;
	userList: User[];
	totalTimeInSeconds: number;
	COLORGRAY: string;
	COLOR_LIST: string[];

	constructor(sketch: p5) {
		this.sketch = sketch;
		this.coreUtils = new CoreUtils(); // utilities for testing CSV files
		this.parseMovement = new ParseMovement(this.sketch, this.coreUtils);
		this.parseConversation = new ParseConversation(this.sketch, this.coreUtils);
		this.parseCodes = new ParseCodes(this.sketch, this.coreUtils);
		this.userList = [];
		this.totalTimeInSeconds = 0; // Time value in seconds that all displayed data is set to, set dynamically when updating movement data
		this.COLORGRAY = '#A9A9A9'; // should match representation of data in GUI
		this.COLOR_LIST = [
			'#6a3d9a',
			'#ff7f00',
			'#33a02c',
			'#1f78b4',
			'#e31a1c',
			'#b15928',
			'#cab2d6',
			'#fdbf6f',
			'#b2df8a',
			'#a6cee3',
			'#fb9a99',
			'#ffed6f'
		]; // 12 Class Paired: (Dark) purple, orange, green, blue, red, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed, yellow
	}

	// update global total time, make sure to floor value as integer
	setTotalTime(timeValue: number) {
		if (this.totalTimeInSeconds < timeValue) this.totalTimeInSeconds = timeValue;
	}

	getTotalTimeInSeconds() {
		return this.totalTimeInSeconds;
	}

	clearAll() {
		this.parseMovement.clear();
		this.parseConversation.clear();
		this.parseCodes.clear();
		this.userList = [];
		this.totalTimeInSeconds = 0;
	}

	handleFileSelect = (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files ? input.files[0] : null;
		const fileName = file ? file.name : '';

		if (file) {
			Papa.parse(file, {
				header: true,
				dynamicTyping: true,
				skipEmptyLines: 'greedy',
				transformHeader: (h) => {
					return h.trim().toLowerCase();
				},
				complete: (results: any, file: any) => {
					this.convertFileToUsers(results, fileName);
				},
				error: (error, file) => {
					alert(
						'Parsing error with one of your CSV files. Please make sure your file is formatted correctly as a .CSV'
					);
				}
			});
		}
	};

	handleExampleDropdown = async (event: any) => {
		// TODO: Need to adjust p5 typescript defintion to expose
		// custom attributes & functions
		this.sketch.core.totalTimeInSeconds = 0;

		UserStore.update(() => {
			return [];
		});

		const selectedValue = event.target.value;
		await this.loadFloorplanImage(selectedValue);
		await this.loadCSVData(`data/${selectedValue}/conversation.csv`);

		switch (selectedValue) {
			case 'example-1':
				await this.loadCSVData(`data/${selectedValue}/jordan.csv`);
				// await loadCSVData(`data/${selectedValue}/possession.csv`);
				break;
			case 'example-2':
				await this.loadCSVData(`data/${selectedValue}/adhir.csv`);
				await this.loadCSVData(`data/${selectedValue}/blake.csv`);
				await this.loadCSVData(`data/${selectedValue}/jeans.csv`);
				await this.loadCSVData(`data/${selectedValue}/lily.csv`);
				await this.loadCSVData(`data/${selectedValue}/mae.csv`);
				break;
			case 'example-3':
				await this.loadCSVData(`data/${selectedValue}/teacher.csv`);
				break;
			case 'example-4':
				await this.loadCSVData(`data/${selectedValue}/cassandra.csv`);
				await this.loadCSVData(`data/${selectedValue}/mei.csv`);
				await this.loadCSVData(`data/${selectedValue}/nathan.csv`);
				await this.loadCSVData(`data/${selectedValue}/sean.csv`);
				await this.loadCSVData(`data/${selectedValue}/teacher.csv`);
				break;
		}

		// This sorts each user's dataTrail by time
		UserStore.subscribe((currentUsers) => {
			currentUsers.map((user) => {
				user.dataTrail.sort((a, b) => {
					if (a.time === null) return 1;
					if (b.time === null) return -1;
					return a.time - b.time;
				});
			});
		});

		console.log(this.totalTimeInSeconds);
		console.log('THIS is the total time sec AFTER ^======');

		// Flashing bad data once, and then looping again to fix it.
		this.sketch.loop();
	};

	loadCSVData = async (path: string) => {
		const csvResponse = await fetch(`${path}`);
		const csvText = await csvResponse.text();
		Papa.parse(csvText, {
			dynamicTyping: true,
			skipEmptyLines: 'greedy',
			header: true,
			transformHeader: (h) => {
				return h.trim().toLowerCase();
			},
			complete: (results: any, file: any) => {
				this.convertFileToUsers(results, path);
			}
		});
	};

	loadFloorplanImage = (selectedValue: string) => {
		// Determine the path based on the selected value
		const path = `data/${selectedValue}/floorplan.png`;

		// Load the image into p5.js
		// Add logic so that typescript does not complain about
		// null possibiltiy
		this.sketch.loadImage(path, (img) => {
			this.sketch.floorPlan.img = img;
			this.sketch.floorPlan.width = img.width;
			this.sketch.floorPlan.height = img.height;
			this.sketch.loop();
		});
	};

	convertFileToUsers = (results: any, fileName: string) => {
		let csvData = results.data;

		// TODO: add additional data tests/checks
		if (this.testMovement(results)) {
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users

				// TODO: Filter out data in for each.
				csvData.forEach((row: any) => {
					let user = null;
					// Movement Files
					const userName = fileName.split('/')[2].slice(0, -4);
					user = users.find((user) => user.name === userName.toLowerCase());

					if (!user) {
						user = new User(
							[],
							Constants.PATH_COLORS[users.length],
							[],
							true,
							userName.toLowerCase()
						);
						users.push(user);
					}

					const existingDataPoint = user.dataTrail.find((dp) => dp.time === row.time);
					if (existingDataPoint) {
						existingDataPoint.x = row.x;
						existingDataPoint.y = row.y;
					} else {
						user.dataTrail.push(new DataPoint('', row.time, row.x, row.y));
					}

					this.sketch.core.setTotalTime(row.time);
					// if (this.sketch) {
					//   this.sketch.core.setTotalTime(row.time);
					// } else {
					//   console.log("this.sketch doesn't exist yet!");
					// }
				});

				return users;
			});

			//  Multicode should be tested before singlecode because it has same headers with one additional header
		} else if (this.testSingleCode(results) || this.testMulticode(results)) {
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users
				csvData.forEach((row: any) => {
					users.forEach((user) => user.segments.push(row.code));
				});

				return users;
			});
		} else if (this.testConversation(results)) {
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users
				csvData.forEach((row: any) => {
					let user = users.find((user) => user.name === row.speaker.toLowerCase());

					if (!user) {
						user = new User(
							[],
							Constants.PATH_COLORS[users.length],
							[],
							true,
							row.speaker.toLowerCase()
						);
						users.push(user);
					}

					// TODO: Datapoint is not being pushed into the right location
					// Neeed to follow up and push into the right place in the future.
					user.dataTrail.push(new DataPoint(row.talk, row.time));
				});

				return users;
			});
		} else {
			alert(
				'Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers'
			);
		}
	};

	testMovement = (results: any): boolean => {
		return this.coreUtils.testPapaParseResults(
			results,
			this.coreUtils.headersMovement,
			this.coreUtils.movementRowForType
		);
	};

	testConversation = (results: any): boolean => {
		return this.coreUtils.testPapaParseResults(
			results,
			this.coreUtils.headersConversation,
			this.coreUtils.conversationRowForType
		);
	};

	testSingleCode = (results: any): boolean => {
		return this.coreUtils.testPapaParseResults(
			results,
			this.coreUtils.headersSingleCodes,
			this.coreUtils.codeRowForType
		);
	};

	testMulticode = (results: any): boolean => {
		return this.coreUtils.testPapaParseResults(
			results,
			this.coreUtils.headersMultiCodes,
			this.coreUtils.multiCodeRowForType
		);
	};
	handleCheckboxChange = () => {
		if (this.sketch) {
			this.sketch.loop();
		}
	};

	/**
	 * Method to update movement program data and GUI
	 * NOTE: order is critical
	 * @param  {Char} pathName First character letter of filename
	 * @param  {Array} movementPointArray
	 * @param  {Array} conversationPointArray
	 */
	// updateMovement(movementPointArray: DataPoint[]) {
	//     // const dataTrail = new Map();
	//     // movementPointArray.forEach((point, index) => {
	//     //     dataTrail.set(index, new DataPoint("", point.x, point.y)); // Assuming x and y properties are present in the point
	//     // });
	//     // this.userList.push(new User(true, pathName, this.getNextColorInList(this.userList.length), dataTrail));
	//     // this.userList = this.sortByName(this.userList);
	//     this.setTotalTime(movementPointArray);
	//     //this.parseCodes.resetCounters();
	//     // this.sk.domController.updateCheckboxes("movement");
	//     this.sk.loop();
	// }

	/**
	 * NOTE: method follows same format as updateMovement with a few minor differences
	 * @param  {PapaParse results Array} parsedConversationFileArray
	 */
	// updateConversation(parsedConversationFileArray: string[]) {
	//     this.setSpeakerList(parsedConversationFileArray);
	//     this.speakerList = this.sortByName(this.speakerList);
	//     this.parseMovement.reProcessAllPointArrays(); // must reprocess movement
	//     // this.sk.domController.updateCheckboxes("talk");
	//     this.sk.loop();
	// }

	// updateCodes(codeName: string) {
	//     this.codeList.push(this.createDisplayData(codeName, false, this.COLORGRAY, this.getNextColorInList(this.codeList.length)));
	//     this.clearMovement();
	//     this.parseMovement.reProcessAllPointArrays();
	//     // this.sk.domController.updateCheckboxes("codes");
	//     this.sk.loop();
	// }

	// setTotalTime(movementPointArray) {
	//     const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
	//     if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
	// }

	// setTotalTime(movementPointArray) {
	//     const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
	//     if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
	// }

	// setSpeakerList(parsedConversationFileArray) {
	//     for (const curRow of parsedConversationFileArray) {
	//         let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
	//         for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
	//         // If row is good data, test if core.speakerList already has speaker and if not add speaker
	//         if (this.coreUtils.conversationRowForType(curRow)) {
	//             const speaker = this.coreUtils.cleanFileName(curRow[this.coreUtils.headersConversation[1]]); // get cleaned speaker character
	//             if (!tempSpeakerList.includes(speaker)) this.speakerList.push(this.createDisplayData(speaker, true, this.getNextColorInList(this.speakerList.length), this.COLORGRAY));
	//         }
	//     }
	// }

	// createPath(name, movementPointArray, conversationPointArray) {
	//     const path = this.createDisplayData(name, true, this.getPathModeColor(name), this.COLORGRAY);
	//     return {
	//         name: path.name, // string name
	//         enabled: path.enabled, // boolean used to indicate if speaker showing in GUI
	//         color: path.color,
	//         movement: movementPointArray,
	//         conversation: conversationPointArray
	//     }
	// }

	// createDisplayData(name, enabled, colorPathMode, colorCodeMode) {
	//     return {
	//         name, // string name
	//         enabled, // toggle display in GUI
	//         color: this.createColorDisplayObject(colorPathMode, colorCodeMode) //
	//     }
	// }

	// createColorDisplayObject(pathMode, codeMode) {
	//     return {
	//         pathMode,
	//         codeMode
	//     }
	// }

	/**
	 * Organizes retrieval of path color depending on whether conversation file has been loaded
	 * @param  {Char} name
	 */
	// getPathModeColor(name) {
	//     if (this.sk.arrayIsLoaded(this.speakerList)) return this.setPathModeColorBySpeaker(name);
	//     else return this.getNextColorInList(this.pathList.length);
	// }

	/**
	 * If path has corresponding speaker, returns color that matches speaker
	 * Otherwise returns color from colorList based on num of speakers + numOfPaths that do not have corresponding speaker
	 * @param  {char} pathName
	 */
	// setPathModeColorBySpeaker(pathName) {
	//     if (this.speakerList.some(e => e.name === pathName)) {
	//         const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
	//         return this.speakerList[this.speakerList.findIndex(hasSameName)].color.pathMode; // returns first index that satisfies condition/index of speaker that matches pathName
	//     } else return this.getNextColorInList(this.speakerList.length + this.getNumPathsWithNoSpeaker());
	// }

	/**
	 * Returns number of movement Paths that do not have corresponding speaker
	 */
	// getNumPathsWithNoSpeaker() {
	//     let count = 0;
	//     for (const path of this.pathList) {
	//         if (!this.speakerList.some(e => e.name === path.name)) count++;
	//     }
	//     return count;
	// }

	// getNextColorInList(number) {
	//     return this.COLOR_LIST[number % this.COLOR_LIST.length];
	// }

	// sortByName(list) {
	//     return list.sort((a, b) => (a.name > b.name) ? 1 : -1);
	// }

	// clearMovement() {
	//     this.pathList = [];
	//     this.totalTimeInSeconds = 0;
	// }

	// clearConversation() {
	//     this.pathList = [];
	//     this.speakerList = [];
	// }

	// clearCodes() {
	//     this.pathList = [];
	//     this.codeList = [];
	// }
}

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
		];
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
		// this.totalTimeInSeconds = 0;
	}

	handleFileSelect = async (event: Event) => {
		this.sketch.core.totalTimeInSeconds = 0;

		UserStore.update(() => {
			return [];
		});

		const input = event.target as HTMLInputElement;

		for (let i = 0; i < input.files.length; i++) {
			const file = input.files ? input.files[i] : null;
			const fileName = file ? file.name : '';

			// TODO: This is where we can control and add video files
			// or other types of files.
			if (fileName.includes('png')) {
				this.loadFloorplanImage(URL.createObjectURL(file));
			} else {
				this.loadCSVData(file);
			}

			// Sorts each user's data trail by time
			UserStore.subscribe((currentUsers) => {
				currentUsers.map((user) => {
					user.dataTrail.sort((a, b) => {
						if (a.time === null) return 1;
						if (b.time === null) return -1;
						return a.time - b.time;
					});
				});
			});
		}
	};

	async loadLocalFile(folder: string, fileName: string) {
		try {
			const response = await fetch(folder + fileName);
			const buffer = await response.arrayBuffer();
			const file = new File([buffer], fileName, {
				type: 'text/csv'
			});
			this.loadCSVData(file);
		} catch (error) {
			alert('Error loading CSV file. Please make sure you have a good internet connection');
			console.log(error);
		}
	}

	handle3D = () => {
		this.sketch.handle3D.update();
	};

	handleExampleDropdown = async (event: any) => {
		// TODO: Need to adjust p5 typescript defintion to expose
		// custom attributes & functions
		this.sketch.core.totalTimeInSeconds = 0;

		UserStore.update(() => {
			return [];
		});

		const selectedValue = event.target.value;
		await this.loadFloorplanImage(`data/${selectedValue}/floorplan.png`);
		await this.loadLocalFile(`data/${selectedValue}/`, `conversation.csv`);

		switch (selectedValue) {
			case 'example-1':
				await this.loadLocalFile(`data/${selectedValue}/`, 'jordan.csv');
				// await loadLocalFile(`data/${selectedValue}`, `possession.csv`);
				break;
			case 'example-2':
				await this.loadLocalFile(`data/${selectedValue}/`, `adhir.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `blake.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `jeans.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `lily.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `mae.csv`);
				break;
			case 'example-3':
				await this.loadLocalFile(`data/${selectedValue}/`, `teacher.csv`);
				break;
			case 'example-4':
				await this.loadLocalFile(`data/${selectedValue}/`, `cassandra.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `mei.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `nathan.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `sean.csv`);
				await this.loadLocalFile(`data/${selectedValue}/`, `teacher.csv`);
				break;
		}

		UserStore.subscribe((currentUsers) => {
			currentUsers.map((user) => {
				user.dataTrail.sort((a, b) => {
					if (a.time === null) return 1;
					if (b.time === null) return -1;
					return a.time - b.time;
				});
			});
		});
		// Flashing bad data once, and then looping again to fix it.
		this.sketch.loop();
	};

	loadCSVData = async (file: File) => {
		Papa.parse(file, {
			dynamicTyping: true,
			skipEmptyLines: 'greedy',
			header: true,
			transformHeader: (h) => {
				return h.trim().toLowerCase();
			},
			complete: (results: any, file: any) => {
				this.convertFileToUsers(results, file.name);
			}
		});
	};

	loadFloorplanImage = (path: string) => {
		this.sketch.loadImage(path, (img) => {
			this.sketch.floorPlan.img = img;
			this.sketch.floorPlan.width = img.width;
			this.sketch.floorPlan.height = img.height;
			this.sketch.loop();
		});
	};

	// NOTE: multicode should be processed before single code file as headers of multicode have one additional column
	convertFileToUsers = (results: any, fileName: string) => {
		let csvData = results.data;
		if (this.testMovement(results)) {
			this.updateUsersForMovement(csvData, fileName);
		} else if (this.testMulticode(results)) {
			this.updateUsersForMultiCodes(csvData, fileName);
		} else if (this.testSingleCode(results)) {
			this.updateUsersForSingleCodes(csvData, fileName);
		} else if (this.testConversation(results)) {
			this.updateUsersForConversation(csvData, fileName);
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

	// TODO: this method will be removed in future
	handleCheckboxChange = () => {
		if (this.sketch) {
			this.sketch.loop();
		}
	};

	updateUsersForMovement = (csvData: any, fileName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers]; // clone the current users

			// TODO: Filter out data in for each.
			csvData.forEach((row: any) => {
				let user = null;
				let userName: string = '';

				if (fileName.includes('/')) {
					userName = fileName.split('/')[2].slice(0, -4);
				} else {
					userName = fileName.slice(0, -4);
				}
				// Movement Files
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
			});
			return users;
		});
	};

	updateUsersForMultiCodes = (csvData: any, fileName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers]; // clone the current users
			csvData.forEach((row: any) => {
				users.forEach((user) => user.segments.push(row.code));
			});
			return users;
		});
	};

	updateUsersForSingleCodes = (csvData: any, fileName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers]; // clone the current users
			csvData.forEach((row: any) => {
				users.forEach((user) => user.segments.push(row.code));
			});
			return users;
		});
	};

	updateUsersForConversation = (csvData: any, fileName: string) => {
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
	};
}

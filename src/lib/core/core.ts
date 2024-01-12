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
import { ParseCodes } from './parse-codes.js';
import { DataPoint } from '../../models/dataPoint.js';
import { User } from '../../models/user.js';
import type p5 from 'p5';
import UserStore from '../../stores/userStore';
import * as Constants from '../constants/index.js';

export class Core {
	sketch: p5;
	coreUtils: CoreUtils;
	parseCodes: ParseCodes;
	userList: User[];
	totalTimeInSeconds: number;
	maxStopLength: number;
	COLORGRAY: string;
	COLOR_LIST: string[];

	constructor(sketch: p5) {
		this.sketch = sketch;
		this.coreUtils = new CoreUtils(); // utilities for testing CSV files
		this.parseCodes = new ParseCodes(this.sketch, this.coreUtils);
		this.userList = [];
		this.totalTimeInSeconds = 0; // Time value in seconds that all displayed data is set to, set dynamically when updating movement data
		this.maxStopLength = 0; // Longest stop length in seconds, set dynamically when updating movement data
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

	// TODO: should this move elsewhere?
	handle3D = () => {
		this.sketch.handle3D.update();
	};

	// update global total time, make sure to floor value as integer
	setTotalTime(timeValue: number) {
		if (this.totalTimeInSeconds < timeValue) this.totalTimeInSeconds = timeValue;
	}

	getTotalTimeInSeconds() {
		return this.totalTimeInSeconds;
	}

	clearAll() {
		this.parseCodes.clear();
		this.userList = [];
		// this.totalTimeInSeconds = 0;
	}

	handleUserLoadedFiles = async (event: Event) => {
		this.sketch.core.totalTimeInSeconds = 0;

		UserStore.update(() => {
			return [];
		});

		const input = event.target as HTMLInputElement;

		for (let i = 0; i < input.files.length; i++) {
			const file = input.files ? input.files[i] : null;
			this.testFileTypeForProcessing(file);
		}
	};

	testFileTypeForProcessing(file: File) {
		const fileName = file ? file.name.toLowerCase() : '';
		if (fileName.endsWith('.csv') || file.type === 'text/csv') this.loadCSVData(file);
		else if (
			fileName.endsWith('.png') ||
			fileName.endsWith('.jpg') ||
			fileName.endsWith('.jpeg') ||
			file.type === 'image/png' ||
			file.type === 'image/jpg' ||
			file.type === 'image/jpeg'
		)
			this.loadFloorplanImage(URL.createObjectURL(file));
		// else if (fileName.endsWith(".mp4") || file.type === "video/mp4") this.prepVideoFromFile(URL.createObjectURL(file));
		else alert('Error loading file. Please make sure your file is an accepted format'); // this should not be possible due to HTML5 accept for file inputs, but in case
	}

	async loadLocalExampleDataFile(folder: string, fileName: string) {
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

	handleExampleDropdown = async (event: any) => {
		// TODO: Need to adjust p5 typescript defintion to expose
		// custom attributes & functions
		this.sketch.core.totalTimeInSeconds = 0;

		UserStore.update(() => {
			return [];
		});

		const selectedValue = event.target.value;
		await this.loadFloorplanImage(`data/${selectedValue}/floorplan.png`);
		await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `conversation.csv`);

		switch (selectedValue) {
			case 'example-1':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, 'jordan.csv');
				// await loadLocalExampleDataFile(`data/${selectedValue}`, `possession.csv`);
				break;
			case 'example-2':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `adhir.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `blake.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `jeans.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `lily.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `mae.csv`);
				break;
			case 'example-3':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `teacher.csv`);
				break;
			case 'example-4':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `cassandra.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `mei.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `nathan.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `sean.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `teacher.csv`);
				break;
		}
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
				this.processResultsData(results, this.coreUtils.cleanFileName(file.name));
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
	processResultsData = (results: any, fileName: string) => {
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

	updateUsersForMovement = (csvData: any, userName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers]; // clone the current users
			let user = null;
			user = users.find((user) => user.name === userName);
			if (!user) {
				user = new User([], Constants.PATH_COLORS[users.length], [], true, userName);
				users.push(user);
			}
			for (let i = 1; i < csvData.length; i++) {
				const row = csvData[i];
				const priorRow = csvData[i - 1];
				if (
					this.coreUtils.movementRowForType(row) &&
					this.coreUtils.curTimeIsLarger(row, priorRow)
				) {
					user.dataTrail.push(new DataPoint('', row.time, row.x, row.y, false));
					this.sketch.core.setTotalTime(row.time);
				}
			}
			this.updateStopValues(user.dataTrail);
			return users;
		});
	};

	// TODO: this could be moved to main classes to dynamically update, would neat to reset isStopped values in data
	// Allows dynamic updating of what constitute stop values/intervals in the program
	updateStopValues(data) {
		//const stopFloor = this.sk.domController.getStopSliderValue();
		const stopFloor = 1; // the interval that constitutes a stop in seconds
		for (let i = 0; i < data.length; i++) {
			let cumulativeTime = 0;
			let j = i;
			// Check and update cumulative time if consecutive points have the same x and y values
			while (j < data.length && data[j].x === data[i].x && data[j].y === data[i].y) {
				cumulativeTime = data[j].time - data[i].time;
				j++;
			}
			// If cumulativeTime is greater than stopFloor, set stop values for the sequence
			if (cumulativeTime >= stopFloor) {
				if (cumulativeTime > this.maxStopLength) this.maxStopLength = cumulativeTime;
				for (let k = i; k < j; k++) {
					data[k].isStopped = true;
					//if (k === j - 1) data[k].stopLength = cumulativeTime;
					data[k].stopLength = data[k].time - data[i].time;
				}
			}
			i = j - 1; // Update i to skip the sequence just processed
		}
	}

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
				this.addDataPointClosestByTimeInSeconds(user.dataTrail, new DataPoint(row.talk, row.time));
			});

			return users;
		});
	};

	addDataPointClosestByTimeInSeconds(dataPoints, newDataPoint) {
		if (dataPoints.length === 0) {
			dataPoints.push(newDataPoint);
			return;
		}
		// Find the index of the data point with the closest time in seconds
		const closestIndex = dataPoints.reduce((closest, current, index) => {
			return Math.abs(current.time - newDataPoint.time) <
				Math.abs(dataPoints[closest].time - newDataPoint.time)
				? index
				: closest;
		}, 0);

		// Decide where to insert - before or after the closest time
		if (dataPoints[closestIndex].time < newDataPoint.time) {
			dataPoints.splice(closestIndex, 0, newDataPoint);
		} else {
			dataPoints.splice(closestIndex + 1, 0, newDataPoint);
		}
	}
}
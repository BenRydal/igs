/**
 * This class holds core program data and associated parsing methods from processed CSV files.
 * Separate parsing classes for movement, conversation, and code CSV files test parsed data from PapaParse
 * results and generate different data structures
 * These data structures are integrated into a Path object which is the central data structure for the IGS
 * Original data from each CSV file is stored within each parsing class for re-processing as new data is loaded
 * Each time CSV file is successfully loaded and parsed, domController is called to update GUI elements
 *
 */
import type p5 from 'p5';
import Papa from 'papaparse';

import { CoreUtils } from './core-utils.js';
import { ParseCodes } from './parse-codes.js';

import { DataPoint } from '../../models/dataPoint.js';
import { User } from '../../models/user.js';
import { USER_COLORS } from '../constants/index.js';

import UserStore from '../../stores/userStore';
import TimelineStore from '../../stores/timelineStore';
let timeline;
TimelineStore.subscribe((data) => {
	timeline = data;
});

export class Core {
	sketch: p5;
	coreUtils: CoreUtils;
	//parseCodes: ParseCodes;

	constructor(sketch: p5) {
		this.sketch = sketch;
		this.coreUtils = new CoreUtils(); // utilities for testing CSV files
		//this.parseCodes = new ParseCodes(this.sketch, this.coreUtils);
	}

	handleUserLoadedFiles = async (event: Event) => {
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
		else if (fileName.endsWith('.mp4') || file.type === 'video/mp4') this.prepVideoFromFile(URL.createObjectURL(file));
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

	/**
	 * @param  {MP4 File} input
	 */
	prepVideoFromFile(fileLocation) {
		this.sketch.videoController.createVideoPlayer('File', {
			fileName: fileLocation
		});
	}

	handleExampleDropdown = async (event: any) => {
		// TODO: Need to adjust p5 typescript defintion to expose
		// custom attributes & functions
		this.sketch.videoController.clear();

		UserStore.update(() => {
			return [];
		});

		const selectedValue = event.target.value;
		await this.loadFloorplanImage(`data/${selectedValue}/floorplan.png`);
		await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `conversation.csv`);

		switch (selectedValue) {
			case 'example-1':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, 'jordan.csv');
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, 'possession.csv');
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'iiMjfVOj8po' });
				break;
			case 'example-2':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `adhir.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `blake.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `jeans.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `lily.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `mae.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'pWJ3xNk1Zpg' });
				break;
			case 'example-3':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `teacher.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'Iu0rxb-xkMk' });
				break;
			case 'example-4':
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `cassandra.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `mei.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `nathan.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `sean.csv`);
				await this.loadLocalExampleDataFile(`data/${selectedValue}/`, `teacher.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'OJSZCK4GPQY' });
				break;
		}
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
				this.sketch.loop();
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
		const csvData = results.data;
		if (this.coreUtils.testMovement(results)) {
			this.updateUsersForMovement(csvData, fileName);
		} else if (this.coreUtils.testMulticode(results)) {
			this.updateUsersForMultiCodes(csvData, fileName);
		} else if (this.coreUtils.testSingleCode(results)) {
			this.updateUsersForSingleCodes(csvData, fileName);
		} else if (this.coreUtils.testConversation(results)) {
			this.updateUsersForConversation(csvData, fileName);
		} else {
			alert('Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers');
		}
	};

	updateUsersForMovement = (csvData: any, userName: string) => {
		let endTime = 0;

		UserStore.update((currentUsers) => {
			let users = [...currentUsers];
			let user = users.find((user) => user.name === userName);
			if (!user) {
				user = this.createNewUser(users, userName);
				users.push(user);
			}
			// Assuming the first column is 'time' and it's sorted in ascending order
			//const startTime = csvData[0]?.time; // The time in the first row
			//const endTime = csvData[csvData.length - 1]?.time; // The time in the last row
			if (endTime < csvData[csvData.length - 1]?.time) endTime = csvData[csvData.length - 1]?.time;

			for (let i = 1; i < csvData.length; i++) {
				const row = csvData[i];
				const priorRow = csvData[i - 1];
				if (this.coreUtils.movementRowForType(row) && this.coreUtils.curTimeIsLarger(row, priorRow)) {
					user.dataTrail.push(new DataPoint('', row.time, row.x, row.y, false));
				}
			}
			this.updateStopValues(user.dataTrail);

			return users;
		});

		TimelineStore.update((timeline) => {
			timeline.setCurrTime(0);
			timeline.setStartTime(0);
			timeline.setEndTime(endTime);
			timeline.setLeftMarker(0);
			timeline.setRightMarker(endTime);
			return timeline;
		});
	};

	updateUsersForConversation = (csvData: any, fileName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers];
			csvData.forEach((row: any) => {
				let user = users.find((user) => user.name === row.speaker.toLowerCase());
				if (!user) {
					user = this.createNewUser(users, row.speaker.toLowerCase());
					users.push(user);
				}
				this.addDataPointClosestByTimeInSeconds(user.dataTrail, new DataPoint(row.talk, row.time));
			});
			return users;
		});
	};

	createNewUser(users: User[], userName: string) {
		const availableColors = USER_COLORS.filter((color) => !users.some((u) => u.color === color));
		const userColor = availableColors.length > 0 ? availableColors[0] : '#000000'; // Default to black if no more unique colors available
		return new User([], userColor, [], true, userName);
	}

	// // TODO: this could be moved to main classes to dynamically update, would neat to reset isStopped values in data
	// // Allows dynamic updating of what constitute stop values/intervals in the program
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
				if (cumulativeTime > this.sketch.sketchController.getMaxStopLength()) this.sketch.sketchController.setMaxStopLength(cumulativeTime);
				for (let k = i + 1; k < j; k++) {
					data[k].isStopped = true;
					data[k].stopLength = cumulativeTime; // TODO: can't seem to get the below to work to increment stopLegnth for each stop to show correclty in draw methods drawStopCircle
					// //if (k === j - 1) data[k].stopLength = cumulativeTime;
					// data[k].stopLength = data[k].time - data[i].time;
					// console.log(data[k].stopLength);
				}
			}
			i = j - 1; // Update i to skip the sequence just processed
		}
	}

	updateUsersForMultiCodes = (csvData: any, fileName: string) => {
		UserStore.update((currentUsers) => {
			let users = [...currentUsers]; // clone the current users
			const usedColors = new Set();

			// For each row in the Code CSV
			csvData.forEach((row: any) => {
				const code = row.code;
				const startTime = parseFloat(row.start);
				const endTime = parseFloat(row.end);

				// Find an available color for the code
				let color = USER_COLORS.find((c) => !usedColors.has(c));
				if (!color) {
					// If no more unique colors available, default to black
					color = '#000000';
				}
				usedColors.add(color);

				// For each user in the users array
				users.forEach((user) => {
					// Update datapoints FROM the start and TO the end time to include the code
					user.dataTrail.forEach((dataPoint) => {
						if (dataPoint.time !== null && dataPoint.time >= startTime && dataPoint.time <= endTime) {
							dataPoint.codes[code] = color;
						}
					});
				});
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

	addDataPointClosestByTimeInSeconds(dataPoints, newDataPoint) {
		if (dataPoints.length === 0) {
			dataPoints.push(newDataPoint);
			return;
		}
		// Find the index of the data point with the closest time in seconds
		const closestIndex = dataPoints.reduce((closest, current, index) => {
			return Math.abs(current.time - newDataPoint.time) < Math.abs(dataPoints[closest].time - newDataPoint.time) ? index : closest;
		}, 0);

		// Decide where to insert - before or after the closest time
		if (dataPoints[closestIndex].time < newDataPoint.time) {
			dataPoints.splice(closestIndex, 0, newDataPoint);
		} else {
			dataPoints.splice(closestIndex + 1, 0, newDataPoint);
		}
	}
}

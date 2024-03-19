/**
 * This class holds core program data and associated parsing methods from processed CSV files.
 * Separate parsing classes for movement, conversation, and code CSV files test parsed data from PapaParse
 * results and generate different data structures.
 * These data structures are integrated into a Path object which is the central data structure for the IGS.
 * Original data from each CSV file is stored within each parsing class for re-processing as new data is loaded.
 * Each time a CSV file is successfully loaded and parsed, domController is called to update GUI elements.
 */
import type p5 from 'p5';
import Papa from 'papaparse';

import { CoreUtils } from './core-utils.js';
import { ParseCodes } from './parse-codes.js';

import { DataPoint } from '../../models/dataPoint.js';
import { User } from '../../models/user.js';
import { Timeline } from '../../models/timeline';
import * as Constants from '../constants/index.js';

import UserStore from '../../stores/userStore';
import TimelineStore from '../../stores/timelineStore';

export class Core {
  sketch: p5;
  coreUtils: CoreUtils;
  parseCodes: ParseCodes;
  userList: User[];
  totalTimeInSeconds: number;
  maxStopLength: number;
  COLORGRAY: string;
  COLOR_LIST: string[];
  leftMarker: number;
  rightMarker: number;
  startTime: number;
  endTime: number;
  currTime: number;

  constructor(sketch: p5) {
    this.sketch = sketch;
    this.coreUtils = new CoreUtils();
    this.parseCodes = new ParseCodes(this.sketch, this.coreUtils);
    this.userList = [];
    this.totalTimeInSeconds = 0;
    this.maxStopLength = 0;
    this.COLORGRAY = '#A9A9A9';
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
    this.leftMarker = 0;
    this.rightMarker = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.currTime = 0;
  }

  /**
   * Handles 3D functionality.
   */
  handle3D = () => {
    this.sketch.handle3D.update();
  };

  /**
   * Updates the global total time.
   * @param timeValue The time value to set.
   */
  setTotalTime(timeValue: number) {
    if (this.totalTimeInSeconds < timeValue) {
      this.totalTimeInSeconds = timeValue;
    }
  }

  /**
   * Returns the total time in seconds.
   * @returns The total time in seconds.
   */
  getTotalTimeInSeconds() {
    return this.totalTimeInSeconds;
  }

  /**
   * Clears all data.
   */
  clearAll() {
    this.parseCodes.clear();
    this.userList = [];
  }

  /**
   * Handles user-loaded files.
   * @param event The file input change event.
   */
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

  /**
   * Tests the file type and processes the file accordingly.
   * @param file The file to process.
   */
  testFileTypeForProcessing(file: File) {
    const fileName = file ? file.name.toLowerCase() : '';
    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      this.loadCSVData(file);
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'image/jpeg'
    ) {
      this.loadFloorplanImage(URL.createObjectURL(file));
    } else {
      alert('Error loading file. Please make sure your file is an accepted format');
    }
  }

  /**
   * Loads local example data file.
   * @param folder The folder containing the file.
   * @param fileName The name of the file.
   */
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
   * Handles the selection of an example from the dropdown.
   * @param event The change event of the dropdown.
   */
  handleExampleDropdown = async (event: any) => {
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
  };

  /**
   * Loads CSV data from a file.
   * @param file The CSV file to load.
   */
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

  /**
   * Loads the floorplan image.
   * @param path The path to the floorplan image.
   */
  loadFloorplanImage = (path: string) => {
    this.sketch.loadImage(path, (img) => {
      this.sketch.floorPlan.img = img;
      this.sketch.floorPlan.width = img.width;
      this.sketch.floorPlan.height = img.height;
      this.sketch.loop();
    });
  };

  /**
   * Processes the results data based on the file type.
   * @param results The parsed CSV results.
   * @param fileName The name of the file.
   */
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
      alert('Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers');
    }
  };

  /**
   * Tests if the results data is movement data.
   * @param results The parsed CSV results.
   * @returns True if the results are movement data, false otherwise.
   */
  testMovement = (results: any): boolean => {
    return this.coreUtils.testPapaParseResults(results, this.coreUtils.headersMovement, this.coreUtils.movementRowForType);
  };

  /**
   * Tests if the results data is conversation data.
   * @param results The parsed CSV results.
   * @returns True if the results are conversation data, false otherwise.
   */
  testConversation = (results: any): boolean => {
    return this.coreUtils.testPapaParseResults(results, this.coreUtils.headersConversation, this.coreUtils.conversationRowForType);
  };

  /**
   * Tests if the results data is single code data.
   * @param results The parsed CSV results.
   * @returns True if the results are single code data, false otherwise.
   */
  testSingleCode = (results: any): boolean => {
    return this.coreUtils.testPapaParseResults(results, this.coreUtils.headersSingleCodes, this.coreUtils.codeRowForType);
  };

  /**
   * Tests if the results data is multicode data.
   * @param results The parsed CSV results.
   * @returns True if the results are multicode data, false otherwise.
   */
  testMulticode = (results: any): boolean => {
    return this.coreUtils.testPapaParseResults(results, this.coreUtils.headersMultiCodes, this.coreUtils.multiCodeRowForType);
  };

  /**
   * Updates the users based on movement data.
   * @param csvData The movement CSV data.
   * @param userName The name of the user.
   */
  updateUsersForMovement = (csvData: any, userName: string) => {
    let endTime = 0;

    UserStore.update((currentUsers) => {
      let users = [...currentUsers];
      let user = null;
      user = users.find((user) => user.name === userName);
      if (!user) {
        user = new User([], Constants.PATH_COLORS[users.length], [], true, userName);
        users.push(user);
      }

      if (endTime < csvData[csvData.length - 1]?.time) {
        endTime = csvData[csvData.length - 1]?.time;
      }

      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        const priorRow = csvData[i - 1];
        if (this.coreUtils.movementRowForType(row) && this.coreUtils.curTimeIsLarger(row, priorRow)) {
          user.dataTrail.push(new DataPoint('', row.time, row.x, row.y, false));
          this.sketch.core.setTotalTime(row.time);
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

  /**
   * Updates the stop values for the given data trail.
   * @param data The data trail to update stop values for.
   */
  updateStopValues(data: DataPoint[]) {
    const stopFloor = 1;
    for (let i = 0; i < data.length; i++) {
      let cumulativeTime = 0;
      let j = i;
      while (j < data.length && data[j].x === data[i].x && data[j].y === data[i].y) {
        cumulativeTime = data[j].time - data[i].time;
        j++;
      }
      if (cumulativeTime >= stopFloor) {
        if (cumulativeTime > this.maxStopLength) {
          this.maxStopLength = cumulativeTime;
        }
        for (let k = i; k < j; k++) {
          data[k].isStopped = true;
          data[k].stopLength = data[k].time - data[i].time;
        }
      }
      i = j - 1;
    }
  }

  /**
   * Updates the users based on multicode data.
   * @param csvData The multicode CSV data.
   * @param fileName The name of the file.
   */
  updateUsersForMultiCodes = (csvData: any, fileName: string) => {
    UserStore.update((currentUsers) => {
      let users = [...currentUsers];
      csvData.forEach((row: any) => {
        users.forEach((user) => user.segments.push(row.code));
      });
      return users;
    });
  };

  /**
   * Updates the users based on single code data.
   * @param csvData The single code CSV data.
   * @param fileName The name of the file.
   */
  updateUsersForSingleCodes = (csvData: any, fileName: string) => {
    UserStore.update((currentUsers) => {
      let users = [...currentUsers];
      csvData.forEach((row: any) => {
        users.forEach((user) => user.segments.push(row.code));
      });
      return users;
    });
  };

  /**
   * Updates the users based on conversation data.
   * @param csvData The conversation CSV data.
   * @param fileName The name of the file.
   */
  updateUsersForConversation = (csvData: any, fileName: string) => {
    UserStore.update((currentUsers) => {
      let users = [...currentUsers];
      csvData.forEach((row: any) => {
        let user = users.find((user) => user.name === row.speaker.toLowerCase());

        if (!user) {
          user = new User([], Constants.PATH_COLORS[users.length], [], true, row.speaker.toLowerCase());
          users.push(user);
        }
        this.addDataPointClosestByTimeInSeconds(user.dataTrail, new DataPoint(row.talk, row.time));
      });

      return users;
    });
  };

  /**
   * Adds a data point to the closest time in seconds in the given data points array.
   * @param dataPoints The array of data points.
   * @param newDataPoint The new data point to add.
   */
	addDataPointClosestByTimeInSeconds(dataPoints: DataPoint[], newDataPoint: DataPoint) {
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
      dataPoints.splice(closestIndex + 1, 0, newDataPoint);
    } else {
      dataPoints.splice(closestIndex, 0, newDataPoint);
    }
  }
}
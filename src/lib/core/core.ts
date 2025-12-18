import type p5 from 'p5'
import Papa from 'papaparse'
import { get } from 'svelte/store'

import { CoreUtils } from './core-utils'
import { getExampleDataset } from './example-datasets'
import type {
  MovementRow,
  ConversationRow,
  SingleCodeRow,
  MultiCodeRow,
  CsvRow,
  PapaParseResult,
  MovementDataFile,
  CodeEntry,
  ExampleId,
  ExampleConfig,
  ExampleSelectEvent,
} from './types.js'

import { DataPoint } from '../../models/dataPoint.js'
import { User } from '../../models/user.js'
import { USER_COLORS } from '../constants/index.js'

import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore.js'
import TimelineStore from '../../stores/timelineStore'
import ConfigStore from '../../stores/configStore.js'
import VideoStore, { loadVideo, reset as resetVideo } from '../../stores/videoStore'
import { toastStore } from '../../stores/toastStore'

export class Core {
  sketch: p5
  coreUtils: CoreUtils
  codeData: CodeEntry[] = []
  conversationData: ConversationRow[] | null = null
  movementData: MovementDataFile[] = []

  constructor(sketch: p5) {
    this.sketch = sketch
    this.coreUtils = new CoreUtils()
  }

  /**
   * Handles file upload events and processes multiple files
   * Supports CSV (movement/conversation/codes), PNG/JPG (floorplan), and MP4 (video)
   *
   * @param event - File input change event from an <input type="file"> element
   * @throws Shows toast notification if file format is not supported
   * @example
   * ```typescript
   * <input type="file" on:change={core.handleUserLoadedFiles} multiple />
   * ```
   */
  handleUserLoadedFiles = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i]
      if (file) {
        this.testFileTypeForProcessing(file)
      }
    }
    input.value = '' // reset input value so you can load same file(s) again in browser
  }

  /**
   * Determines file type and routes to appropriate processing method
   * Validates file extensions and MIME types for CSV, image, and video files
   *
   * @param file - File object to validate and process
   * @throws Shows toast error if file format is not recognized
   * @example
   * ```typescript
   * const file = new File(['data'], 'movement.csv', { type: 'text/csv' });
   * core.testFileTypeForProcessing(file);
   * ```
   */
  testFileTypeForProcessing(file: File): void {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv') || file.type === 'text/csv') this.loadCSVData(file)
    else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'image/jpeg'
    )
      this.loadFloorplanImage(URL.createObjectURL(file))
    else if (fileName.endsWith('.mp4') || file.type === 'video/mp4')
      this.prepVideoFromFile(URL.createObjectURL(file))
    else toastStore.error('Error loading file. Please make sure your file is an accepted format') // this should not be possible due to HTML5 accept for file inputs, but in case
  }

  /**
   * Async version of testFileTypeForProcessing that waits for CSV files to complete
   * Used by import dialog to ensure files are processed in correct order
   *
   * @param file - File object to validate and process
   * @returns Promise that resolves when file processing is complete
   */
  async testFileTypeForProcessingAsync(file: File): Promise<void> {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      await this.loadCSVData(file)
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'image/jpeg'
    ) {
      this.loadFloorplanImage(URL.createObjectURL(file))
    } else if (fileName.endsWith('.mp4') || file.type === 'video/mp4') {
      this.prepVideoFromFile(URL.createObjectURL(file))
    } else {
      toastStore.error('Error loading file. Please make sure your file is an accepted format')
    }
  }

  async loadLocalExampleDataFile(folder: string, fileName: string) {
    try {
      const response = await fetch(`${folder}${fileName}`)
      const buffer = await response.arrayBuffer()
      const file = new File([buffer], fileName, { type: 'text/csv' })
      this.loadCSVData(file)
    } catch (error) {
      toastStore.error(
        'Error loading CSV file. Please make sure you have a good internet connection'
      )
      console.log(error)
    }
  }

  /**
   * Initializes video player from a file URL
   * Clears any existing video and stops animation before loading new video
   *
   * @param fileLocation - Object URL pointing to the video file (typically from URL.createObjectURL)
   * @example
   * ```typescript
   * const videoUrl = URL.createObjectURL(videoFile);
   * core.prepVideoFromFile(videoUrl);
   * ```
   */
  prepVideoFromFile(fileLocation: string): void {
    const timeline = get(TimelineStore)
    resetVideo() // clear previous video
    timeline.setIsAnimating(false) // stop animation if it was running
    loadVideo({ type: 'file', fileUrl: fileLocation })
  }

  /**
   * Loads a pre-configured example dataset from the examples dropdown
   * Resets stop length config and loads floorplan, CSV files, and optional YouTube video
   *
   * @param event - Select element change event containing the example ID as value
   * @throws Shows toast error if network request fails or file loading encounters issues
   * @example
   * ```typescript
   * <select on:change={core.handleExampleDropdown}>
   *   <option value="example-1">Basketball Example</option>
   * </select>
   * ```
   */
  handleExampleDropdown = async (event: ExampleSelectEvent): Promise<void> => {
    ConfigStore.update((store) => ({ ...store, maxStopLength: 0 }))
    resetVideo() // Always clear previous video state when switching datasets
    const selectedValue = event.target.value as ExampleId
    const selectedExample = getExampleDataset(selectedValue)
    if (selectedExample) {
      const { files, videoId } = selectedExample
      await this.loadFloorplanImage(`/data/${selectedValue}/floorplan.png`)
      for (const file of files) {
        await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, file)
      }
      if (videoId) {
        loadVideo({ type: 'youtube', videoId })
      }
    }
  }

  /**
   * Parses and loads CSV file data using Papa Parse library
   * Automatically detects CSV type (movement, conversation, or codes) and processes accordingly
   * Converts headers to lowercase and trims whitespace for consistency
   *
   * @param file - CSV File object to parse
   * @returns Promise that resolves when parsing and processing is complete
   * @example
   * ```typescript
   * const csvFile = new File(['time,x,y\n0,100,200'], 'movement.csv', { type: 'text/csv' });
   * await core.loadCSVData(csvFile);
   * ```
   */
  loadCSVData = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        header: true,
        transformHeader: (h) => {
          return h.trim().toLowerCase()
        },
        complete: (results: PapaParseResult<CsvRow>, parsedFile: File) => {
          this.processResultsData(results, this.coreUtils.cleanFileName(parsedFile.name))
          this.sketch.loop()
          resolve()
        },
      })
    })
  }

  loadFloorplanImage = (path: string) => {
    this.sketch.loadImage(path, (img) => {
      this.sketch.floorPlan.img = img
      this.sketch.floorPlan.width = img.width
      this.sketch.floorPlan.height = img.height
      this.sketch.loop()
    })
  }

  /**
   * Processes parsed CSV data and routes to appropriate handler based on data type
   * Detects and handles movement, conversation, single-code, or multi-code CSV files
   * After processing, sorts data trails by time and updates stop/code values for all users
   *
   * @param results - Papa Parse results object containing parsed CSV data
   * @param fileName - Cleaned file name used for user identification in movement data
   * @throws Shows toast error if CSV format doesn't match any expected type
   * @remarks Multicode files must be processed before single code files due to header structure
   */
  // NOTE: multicode should be processed before single code file as headers of multicode have one additional column
  processResultsData = (results: PapaParseResult<CsvRow>, fileName: string): void => {
    const csvData = results.data
    if (this.coreUtils.testMovement(results)) {
      this.movementData.push({ fileName, csvData: csvData as unknown as MovementRow[] })
      this.reProcessAllMovementData()
    } else if (this.coreUtils.testMulticode(results)) {
      this.updateUsersForMultiCodes(csvData as unknown as MultiCodeRow[])
    } else if (this.coreUtils.testSingleCode(results)) {
      this.updateUsersForSingleCodes(csvData as unknown as SingleCodeRow[], fileName)
    } else if (this.coreUtils.testConversation(results)) {
      this.conversationData = csvData as unknown as ConversationRow[]
      if (this.conversationData)
        this.updateUsersForConversation(csvData as unknown as ConversationRow[])
    } else {
      toastStore.error(
        'Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers'
      )
    }

    UserStore.update((currentUsers) => {
      const users = [...currentUsers]
      users.forEach((user) => {
        user.dataTrail.sort((a, b) => ((a.time ?? 0) > (b.time ?? 0) ? 1 : -1))
        this.updateStopValues(user.dataTrail)
        this.updateCodeValues(user.dataTrail)
      })
      return users
    })
  }

  /**
   * Reprocesses all loaded movement data files
   * Adjusts stop slider value based on dataset size and reapplies conversation data if present
   * Called when new movement data is loaded to ensure all data is consistently processed
   *
   * @remarks Sets stopSliderValue to 1 for small datasets, 5 for larger ones based on smallDataThreshold
   */
  reProcessAllMovementData() {
    const { smallDataThreshold } = get(ConfigStore)
    const anySmallFile = this.movementData.some((file) => file.csvData.length <= smallDataThreshold)

    this.movementData.forEach((file) => {
      this.updateUsersForMovement(file.csvData, file.fileName)
    })

    ConfigStore.update((store) => ({
      ...store,
      stopSliderValue: anySmallFile ? 1 : 5,
    }))

    if (this.conversationData) {
      this.updateUsersForConversation(this.conversationData)
    }
  }

  /**
   * Processes movement CSV data and creates/updates user data trails
   * Applies sampling for large datasets or includes all points for small datasets
   * Creates new user if not found, otherwise resets existing user's data trail
   *
   * @param csvData - Array of movement rows containing time, x, y coordinates
   * @param userName - Name identifier for the user (typically from filename)
   * @remarks For datasets larger than smallDataThreshold, samples points based on samplingInterval
   * @example
   * ```typescript
   * const movementData: MovementRow[] = [
   *   { time: 0, x: 100, y: 200 },
   *   { time: 1, x: 105, y: 205 }
   * ];
   * core.updateUsersForMovement(movementData, 'student1');
   * ```
   */
  updateUsersForMovement = (csvData: MovementRow[], userName: string): void => {
    const { smallDataThreshold, samplingInterval } = get(ConfigStore)
    let endTime = 0

    UserStore.update((currentUsers) => {
      let users = [...currentUsers]
      let user = users.find((user) => user.name === userName)

      if (!user) {
        user = this.createNewUser(users, userName)
        users.push(user)
      } else user.dataTrail = [] // reset to overwrite user with new data if same user is loaded again
      user.movementIsLoaded = true
      const lastTime = csvData[csvData.length - 1]?.time
      if (endTime < lastTime) endTime = lastTime

      if (csvData.length <= smallDataThreshold) {
        csvData.forEach((row) => {
          if (!this.coreUtils.movementRowForType(row)) return
          user.dataTrail.push(new DataPoint('', row.time, row.x, row.y))
        })
      } else {
        let lastSampledTime = csvData[0]?.time
        csvData.forEach((row) => {
          if (!this.coreUtils.movementRowForType(row)) return
          if (row.time - lastSampledTime >= samplingInterval) {
            user.dataTrail.push(new DataPoint('', row.time, row.x, row.y))
            lastSampledTime = row.time
          }
        })
      }
      return users
    })
    this.updateTimelineValues(endTime)
  }

  /**
   * Processes conversation CSV data and adds conversation turns to user data trails
   * Matches speakers to existing users or creates new ones, and assigns coordinates based on time
   * Updates maxTurnLength config to track longest conversation turn for visualization
   *
   * @param csvData - Array of conversation rows containing speaker, time, and talk text
   * @remarks If speaker has movement data, uses their own trail for coordinates; otherwise uses all users' movement data
   * @example
   * ```typescript
   * const conversationData: ConversationRow[] = [
   *   { speaker: 'Teacher', time: 5, talk: 'Good morning class' },
   *   { speaker: 'Student1', time: 10, talk: 'Hello' }
   * ];
   * core.updateUsersForConversation(conversationData);
   * ```
   */
  updateUsersForConversation = (csvData: ConversationRow[]): void => {
    UserStore.update((currentUsers) => {
      const users = [...currentUsers]
      const allUsersMovementData = this.getAllUsersMovementData(users)
      let curMaxTurnLength = 0
      csvData.forEach((row) => {
        if (!this.coreUtils.conversationRowForType(row)) return

        let curUser = users.find((curUser) => curUser.name === row.speaker.toLowerCase())
        if (!curUser) {
          curUser = this.createNewUser(users, row.speaker.toLowerCase())
          users.push(curUser)
        }
        curUser.conversationIsLoaded = true

        // If the current conversation turn has movement loaded, use that dataTrail to get coordinate data and add the DataPoint
        // Or else, use allUsersMovementData to get coordinate data and then add the DataPoint to the current user's dataTrail
        const talkString = String(row.talk)
        if (curUser.movementIsLoaded) {
          this.addDataPointClosestByTimeInSeconds(
            curUser.dataTrail,
            new DataPoint(talkString, row.time),
            curUser.dataTrail
          )
        } else {
          this.addDataPointClosestByTimeInSeconds(
            curUser.dataTrail,
            new DataPoint(talkString, row.time),
            allUsersMovementData
          )
        }
        const len = row.talk ? row.talk.toString().length : 0
        if (len > curMaxTurnLength) curMaxTurnLength = len
      })
      ConfigStore.update((store) => ({
        ...store,
        maxTurnLength: curMaxTurnLength,
      }))
      return users
    })
  }

  // Collect valid data points with x and y coordinates across all users' dataTrails to process conversation data
  getAllUsersMovementData = (users: User[]): DataPoint[] => {
    const validPoints: DataPoint[] = []
    users.forEach((user) => {
      user.dataTrail.forEach((point) => {
        if (point.x != null && point.y != null) {
          validPoints.push(point)
        }
      })
    })
    return validPoints.sort((a, b) => a.time! - b.time!) // Ensure it's sorted by time for binary search later
  }

  addDataPointClosestByTimeInSeconds(
    dataTrail: DataPoint[],
    newDataPoint: DataPoint,
    validPointsWithCoordinates: DataPoint[]
  ): void {
    this.addMissingCoordinates(newDataPoint, validPointsWithCoordinates)

    // Find the correct position to insert the new point to maintain time order
    const newTime = newDataPoint.time ?? 0
    const insertIndex = dataTrail.findIndex((point) => (point.time ?? 0) > newTime)
    if (insertIndex === -1) {
      // If no point has a later time, append the new point to the end
      dataTrail.push(newDataPoint)
    } else {
      // Insert the new point at the correct index to maintain time order
      dataTrail.splice(insertIndex, 0, newDataPoint)
    }
  }

  addMissingCoordinates(newDataPoint: DataPoint, validPointsWithCoordinates: DataPoint[]): void {
    const closestDataPoint = this.findClosestPoint(newDataPoint, validPointsWithCoordinates)
    if (closestDataPoint) {
      this.copyDataPointAttributes(closestDataPoint, newDataPoint)
    } else {
      newDataPoint.x = 0
      newDataPoint.y = 0
      console.log('No valid data points with x and y found to copy')
    }
  }

  // Implementation of binary search
  findClosestPoint(dataPoint: DataPoint, validPoints: DataPoint[]): DataPoint | null {
    const targetTime = dataPoint.time ?? 0
    if (validPoints.length === 0) {
      console.log('Valid data points array empty')
      return null
    }

    let left = 0,
      right = validPoints.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midTime = validPoints[mid].time ?? 0
      if (midTime === targetTime) return validPoints[mid]
      midTime < targetTime ? (left = mid + 1) : (right = mid - 1)
    }

    // Handle out-of-bounds cases
    if (left >= validPoints.length) return validPoints[right]
    if (right < 0) return validPoints[left]

    // Return the closest of the two
    const leftTime = validPoints[left].time ?? 0
    const rightTime = validPoints[right].time ?? 0
    return Math.abs(leftTime - targetTime) < Math.abs(rightTime - targetTime)
      ? validPoints[left]
      : validPoints[right]
  }

  copyDataPointAttributes = (sourceDataPoint: DataPoint, targetDataPoint: DataPoint) => {
    targetDataPoint.x = sourceDataPoint.x
    targetDataPoint.y = sourceDataPoint.y
    targetDataPoint.stopLength = sourceDataPoint.stopLength
    targetDataPoint.codes = [...sourceDataPoint.codes] // Ensure codes array is copied properly
  }

  createNewUser(users: User[], userName: string) {
    const availableColors = USER_COLORS.filter((color) => !users.some((u) => u.color === color))
    const userColor = availableColors.length > 0 ? availableColors[0] : '#000000' // Default to black if no more unique colors available
    return new User([], userColor, true, userName)
  }

  updateStopValues(data: DataPoint[]): void {
    let curMaxStopLength = 0 // holds length of stop for each calculated stop segment

    for (let i = 0; i < data.length; i++) {
      let cumulativeTime = 0
      let j = i
      while (
        j < data.length &&
        (data[j].x ?? 0) === (data[i].x ?? 0) &&
        (data[j].y ?? 0) === (data[i].y ?? 0)
      ) {
        cumulativeTime = (data[j].time ?? 0) - (data[i].time ?? 0)
        j++
      }

      if (cumulativeTime > curMaxStopLength) {
        curMaxStopLength = cumulativeTime
      }

      for (let k = i + 1; k < j; k++) {
        data[k].stopLength = cumulativeTime
      }
      i = j - 1
    }
    ConfigStore.update((store) => ({
      ...store,
      maxStopLength: Math.max(store.maxStopLength, curMaxStopLength),
    }))
  }

  updateUsersForSingleCodes = (csvData: SingleCodeRow[], fileName: string): void => {
    const codeName = fileName.replace(/\.[^/.]+$/, '').toLowerCase()
    const uniqueCodes = [codeName]

    csvData.forEach((row) => {
      const startTime = parseFloat(row.start.toString())
      const endTime = parseFloat(row.end.toString())
      this.codeData.push({ code: codeName, startTime, endTime })
    })

    this.updateCodeStore(uniqueCodes)
  }

  updateUsersForMultiCodes = (csvData: MultiCodeRow[]): void => {
    const uniqueCodes: string[] = []

    csvData.forEach((row) => {
      const code = row.code.toLowerCase()
      if (!uniqueCodes.includes(code)) uniqueCodes.push(code)
      const startTime = parseFloat(row.start.toString())
      const endTime = parseFloat(row.end.toString())
      this.codeData.push({ code, startTime, endTime })
    })
    this.updateCodeStore(uniqueCodes)
  }

  updateTimelineValues = (endTime: number) => {
    TimelineStore.update((timeline) => {
      timeline.setCurrTime(0)
      timeline.setStartTime(0)
      timeline.setEndTime(endTime)
      timeline.setLeftMarker(0)
      timeline.setRightMarker(endTime)
      return timeline
    })
  }

  updateCodeValues = (dataPoints: DataPoint[]) => {
    dataPoints.forEach((dataPoint) => {
      dataPoint.codes = []
    })

    this.codeData.forEach((codeEntry) => {
      const { code, startTime, endTime } = codeEntry
      this.updateDataTrailSegmentsWithCodes(dataPoints, code, startTime, endTime)
    })
  }

  updateDataTrailSegmentsWithCodes = (
    dataPoints: DataPoint[],
    code: string,
    startTime: number,
    endTime: number
  ) => {
    // Find the first data point with time >= startTime
    const startIndex = dataPoints.findIndex(
      (dataPoint) => dataPoint.time !== null && dataPoint.time >= startTime
    )

    // Find the last data point with time <= endTime
    const endIndex = dataPoints.findLastIndex(
      (dataPoint) => dataPoint.time !== null && dataPoint.time <= endTime
    )

    if (startIndex === -1 || endIndex === -1) return

    // Update datapoints FROM the start and TO the end time to include the code
    for (let i = startIndex; i <= endIndex; i++) {
      if (!dataPoints[i].codes.includes(code)) {
        dataPoints[i].codes.push(code)
      }
    }
  }

  updateCodeStore = (uniqueCodes: string[]) => {
    CodeStore.update((currentEntries) => {
      if (!currentEntries.some((entry) => entry.code === 'no codes')) {
        currentEntries.unshift({ code: 'no codes', color: '#808080', enabled: true })
      }

      const existingCodes = currentEntries.map((entry) => entry.code)
      const newEntries = uniqueCodes
        .filter((code) => !existingCodes.includes(code))
        .map((code, index) => ({
          code,
          color: USER_COLORS[(index + currentEntries.length) % USER_COLORS.length],
          enabled: true,
        }))

      return [...currentEntries, ...newEntries]
    })

    ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: true }))
  }
}

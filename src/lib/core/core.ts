import type p5 from 'p5'
import Papa from 'papaparse'
import { get } from 'svelte/store'

import { CoreUtils } from './core-utils'
import { getExampleDataset } from './example-datasets'
import { TimeParser, type TimeParseOutput } from './time-parser'
import type {
  MovementRow,
  GPSMovementRow,
  ConversationRow,
  SingleCodeRow,
  MultiCodeRow,
  CsvRow,
  PapaParseResult,
  MovementDataFile,
  CodeEntry,
  ExampleId,
  ExampleSelectEvent,
} from './types.js'

import { DataPoint } from '../../models/dataPoint.js'
import { User } from '../../models/user.js'
import { USER_COLORS } from '../constants/index.js'

import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore.js'
import { timelineV2Store } from '../timeline/store'
import ConfigStore from '../../stores/configStore.js'
import VideoStore, { loadVideo, reset as resetVideo } from '../../stores/videoStore'
import { pause as pausePlayback } from '../../stores/playbackStore'
import { toastStore } from '../../stores/toastStore'
import { setGPSMode, setBounds, resetGPS, getGPSState } from '../../stores/gpsStore'
import { GPSTransformer, GPS_NORMALIZED_SIZE } from '../gps/gps-transformer'
import { loadMapAsFloorPlan, isMapboxConfigured } from '../gps/mapbox-service'
import { validateGPSData } from '../gps/gps-validation'
import { GPXParser } from '../gps/gpx-parser'
import { KMLParser } from '../gps/kml-parser'

export class Core {
  sketch: p5
  coreUtils: CoreUtils
  codeData: CodeEntry[] = []
  conversationData: ConversationRow[] | null = null
  movementData: MovementDataFile[] = []
  gpsMovementData: { fileName: string; gpsData: { time: number; lat: number; lng: number }[] }[] = []

  constructor(sketch: p5) {
    this.sketch = sketch
    this.coreUtils = new CoreUtils()
  }

  /**
   * Determines file type and routes to appropriate async processing method
   * Waits for CSV/GPX files to complete processing before returning
   *
   * @param file - File object to validate and process
   * @returns Promise that resolves when file processing is complete
   */
  async testFileTypeForProcessingAsync(file: File): Promise<void> {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      await this.loadCSVData(file)
    } else if (fileName.endsWith('.gpx') || file.type === 'application/gpx+xml') {
      await this.loadGPXData(file)
    } else if (fileName.endsWith('.kml') || file.type === 'application/vnd.google-earth.kml+xml') {
      await this.loadKMLData(file)
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
      await this.loadCSVData(file)
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
    resetVideo() // clear previous video
    pausePlayback() // stop playback if it was running
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
    // Clear all previous data when switching datasets
    pausePlayback()
    this.movementData = []
    this.gpsMovementData = []
    this.conversationData = null
    this.codeData = []
    UserStore.set([])
    CodeStore.set([])
    resetGPS()
    resetVideo()
    ConfigStore.update((store) => ({ ...store, maxStopLength: 0, dataHasCodes: false }))
    const selectedValue = event.target.value as ExampleId
    const selectedExample = getExampleDataset(selectedValue)
    if (selectedExample) {
      const { files, videoId, isGPS } = selectedExample
      if (!isGPS) {
        await this.loadFloorplanImage(`/data/${selectedValue}/floorplan.png`)
      }
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
        complete: async (results: PapaParseResult<CsvRow>, parsedFile: File) => {
          // Preprocess time columns (detect format, convert to relative seconds)
          const preprocessed = this.preprocessTimeData(results)
          if (!preprocessed.success) {
            toastStore.error(preprocessed.error || 'Failed to parse time values')
            resolve()
            return
          }

          // Log any warnings from preprocessing
          if (preprocessed.warnings.length > 0) {
            console.warn('Time parsing warnings:', preprocessed.warnings)
          }

          // Update results with preprocessed data
          results.data = preprocessed.data

          // Await processing to ensure GPS data loads before conversation data
          await this.processResultsData(results, this.coreUtils.cleanFileName(parsedFile.name))
          this.sketch.loop()
          resolve()
        },
      })
    })
  }

  /**
   * Preprocesses time columns in parsed CSV data
   * Converts time values to relative seconds from the first timestamp
   */
  private preprocessTimeData(results: PapaParseResult<CsvRow>): TimeParseOutput {
    // All known time column names - TimeParser will filter to those that exist
    const timeColumns = ['time', 'start', 'end']
    return TimeParser.preprocess(results, { timeColumns })
  }

  /**
   * Loads and processes GPX file data
   * Parses XML, extracts tracks, and routes to GPS processing pipeline
   *
   * @param file - GPX File object to parse
   * @returns Promise that resolves when processing is complete
   */
  loadGPXData = async (file: File): Promise<void> => {
    try {
      const gpxContent = await file.text()
      const fileName = this.coreUtils.cleanFileName(file.name)
      const parseResult = GPXParser.parse(gpxContent, fileName)

      if (!parseResult.success) {
        toastStore.error(parseResult.error || 'Failed to parse GPX file')
        return
      }

      parseResult.warnings.forEach((warning) => toastStore.warning(warning))

      // Process each track as a separate "user" (like multiple CSV files)
      for (const track of parseResult.tracks) {
        await this.processGPSMovementData(GPXParser.toGPSMovementRows(track), track.name)
      }

      this.sketch.loop()
    } catch (error) {
      console.error('Error loading GPX file:', error)
      toastStore.error('Error reading GPX file. Please check the file format.')
    }
  }

  /**
   * Loads and processes KML file data
   * Parses XML, extracts tracks (LineString or gx:Track), and routes to GPS processing pipeline
   *
   * @param file - KML File object to parse
   * @returns Promise that resolves when processing is complete
   */
  loadKMLData = async (file: File): Promise<void> => {
    try {
      const kmlContent = await file.text()
      const fileName = this.coreUtils.cleanFileName(file.name)
      const parseResult = KMLParser.parse(kmlContent, fileName)

      if (!parseResult.success) {
        toastStore.error(parseResult.error || 'Failed to parse KML file')
        return
      }

      parseResult.warnings.forEach((warning) => toastStore.warning(warning))

      // Process each track as a separate "user" (like multiple CSV files)
      for (const track of parseResult.tracks) {
        await this.processGPSMovementData(KMLParser.toGPSMovementRows(track), track.name)
      }

      this.sketch.loop()
    } catch (error) {
      console.error('Error loading KML file:', error)
      toastStore.error('Error reading KML file. Please check the file format.')
    }
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
  // NOTE: GPS movement should be processed before regular movement as it has different headers
  processResultsData = async (results: PapaParseResult<CsvRow>, fileName: string): Promise<void> => {
    const csvData = results.data
    // Check for GPS movement data first (lat/lng headers)
    // GPS processing is async (loads map image), await to ensure it completes before other files process
    if (this.coreUtils.testGPSMovement(results)) {
      try {
        await this.processGPSMovementData(csvData as unknown as GPSMovementRow[], fileName)
      } catch (error) {
        console.error('Error processing GPS data:', error)
      }
      return
    }

    if (this.coreUtils.testMovement(results)) {
      // Regular movement data (x/y headers) - reset GPS mode if active
      if (getGPSState().isGPSMode) {
        toastStore.warning(
          'Loading indoor movement alongside GPS data. Coordinates may not align.'
        )
        resetGPS()
        this.gpsMovementData = []
      }
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

    this.finalizeUserData()
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

    UserStore.update((currentUsers) => {
      let users = [...currentUsers]
      let user = users.find((user) => user.name === userName)

      if (!user) {
        user = this.createNewUser(users, userName)
        users.push(user)
      } else user.dataTrail = [] // reset to overwrite user with new data if same user is loaded again
      user.movementIsLoaded = true

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
    this.updateTimelineValues()
  }

  /**
   * Processes GPS movement data - validates, stores, and triggers reprocessing
   * Stores raw GPS data so bounds can be recalculated when multiple files are loaded
   *
   * @param csvData - Array of GPS movement rows containing time, lat, lng coordinates
   * @param fileName - Name identifier for the user (typically from filename)
   */
  processGPSMovementData = async (csvData: GPSMovementRow[], fileName: string): Promise<void> => {
    // Check if Mapbox is configured
    if (!isMapboxConfigured()) {
      toastStore.error(
        'GPS data detected but Mapbox is not configured. Please set VITE_MAPBOX_TOKEN in your .env file.'
      )
      return
    }

    // Warn if loading GPS data alongside existing indoor movement data
    if (this.movementData.length > 0 && !getGPSState().isGPSMode) {
      toastStore.warning(
        'Loading GPS data alongside indoor movement. Coordinates may not align.'
      )
    }

    // Normalize GPS data to consistent field names and filter invalid points
    const normalizedData = csvData
      .map((row) => GPSTransformer.normalizeGPSRow(row))
      .filter(
        (row) =>
          GPSTransformer.isValidGPSPoint(row) &&
          typeof row.time === 'number' &&
          Number.isFinite(row.time)
      )

    // Warn about skipped rows due to missing/invalid data
    const skippedRows = csvData.length - normalizedData.length
    if (skippedRows > 0) {
      toastStore.warning(
        `${skippedRows} row${skippedRows > 1 ? 's were' : ' was'} skipped due to missing or invalid values`
      )
    }

    if (normalizedData.length === 0) {
      toastStore.error('No valid GPS coordinates found in the file.')
      return
    }

    // Validate GPS data: detect spikes, time issues, and filter bad points
    const validationResult = validateGPSData(normalizedData)

    // Show warnings for any issues detected
    for (const warning of validationResult.warnings) {
      toastStore.warning(warning)
    }

    // Use filtered data (spikes removed, timestamps sorted)
    const validatedData = validationResult.filteredData

    if (validatedData.length === 0) {
      toastStore.error('No valid GPS points remaining after filtering. All points had impossible speeds.')
      return
    }

    // Store validated GPS data for reprocessing when more files are added
    this.gpsMovementData.push({ fileName, gpsData: validatedData })

    // Reprocess all GPS data with combined bounds
    await this.reProcessAllGPSMovementData()
  }

  /**
   * Reprocesses all GPS movement data with unified bounds
   * Called when new GPS files are added to ensure all tracks fit on the map
   */
  reProcessAllGPSMovementData = async (): Promise<void> => {
    if (this.gpsMovementData.length === 0) return

    // Combine all GPS points to calculate unified bounds
    const allGPSPoints = this.gpsMovementData.flatMap((file) => file.gpsData)
    const bounds = GPSTransformer.calculateBounds(allGPSPoints)

    // Enable GPS mode and set bounds in store
    setGPSMode(true)
    setBounds(bounds)

    // Load Mapbox static map as floor plan
    try {
      await loadMapAsFloorPlan(this.sketch, bounds, getGPSState().mapStyle)
      this.sketch.floorPlan.curFloorPlanRotation = 0
    } catch (error) {
      console.error('Failed to load map:', error)
      resetGPS()
      this.gpsMovementData = []
      return
    }

    // Remove old GPS entries from movementData
    const gpsFileNames = new Set(this.gpsMovementData.map((f) => f.fileName))
    this.movementData = this.movementData.filter((m) => !gpsFileNames.has(m.fileName))

    // Convert all GPS data to pixels using unified bounds and add to movementData
    for (const { fileName, gpsData } of this.gpsMovementData) {
      const pixelData: MovementRow[] = gpsData.map((row) => {
        const [x, y] = GPSTransformer.toPixels(row.lat, row.lng, bounds, GPS_NORMALIZED_SIZE, GPS_NORMALIZED_SIZE)
        return { time: row.time, x, y }
      })
      this.movementData.push({ fileName, csvData: pixelData })
    }

    // Process all movement data and finalize
    this.reProcessAllMovementData()
    this.finalizeUserData()
  }

  /**
   * Sorts user data trails by time and updates stop/code values
   * Called after processing any data type to ensure consistent state
   */
  private finalizeUserData(): void {
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
    // Check for movement data before update (for warning toast)
    const existingUsers = get(UserStore)
    const hasMovementData = existingUsers.some((user) =>
      user.dataTrail.some((point) => point.x != null && point.y != null)
    )

    if (!hasMovementData) {
      toastStore.warning(
        'Conversation loaded without movement data. Positions will update when movement is loaded.'
      )
    }

    UserStore.update((currentUsers) => {
      // Clean up previous conversation data:
      // 1. Remove conversation-only users entirely
      // 2. Clear conversation data from users who also have movement
      let users = currentUsers.filter((user) => {
        if (user.conversationIsLoaded && !user.movementIsLoaded) {
          return false // Remove conversation-only users
        }
        return true
      })

      // For users with both movement and conversation, remove speech data points
      users.forEach((user) => {
        if (user.conversationIsLoaded && user.movementIsLoaded) {
          user.dataTrail = user.dataTrail.filter((point) => !point.speech)
          user.conversationIsLoaded = false
        }
      })

      const allUsersMovementData = this.getAllUsersMovementData(users)

      let curMaxTurnLength = 0
      csvData.forEach((row) => {
        if (!this.coreUtils.conversationRowForType(row)) return

        const speakerName = String(row.speaker).trim().toLowerCase()
        if (!speakerName) return // Skip empty speaker names

        let curUser = users.find((curUser) => curUser.name === speakerName)
        if (!curUser) {
          curUser = this.createNewUser(users, speakerName)
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
    let curMaxStopLength = 0

    for (let i = 0; i < data.length; i++) {
      // Find end of this stop (consecutive points at same location)
      let j = i
      while (
        j < data.length &&
        (data[j].x ?? 0) === (data[i].x ?? 0) &&
        (data[j].y ?? 0) === (data[i].y ?? 0)
      ) {
        j++
      }

      // Calculate stop duration (first point to last point in stop)
      const stopDuration = (data[j - 1].time ?? 0) - (data[i].time ?? 0)

      if (stopDuration > curMaxStopLength) {
        curMaxStopLength = stopDuration
      }

      // Mark all points in this stop (except first) with the duration
      for (let k = i + 1; k < j; k++) {
        data[k].stopLength = stopDuration
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
      if (!this.coreUtils.codeRowForType(row)) return
      this.codeData.push({ code: codeName, startTime: row.start, endTime: row.end })
    })

    this.updateCodeStore(uniqueCodes)
  }

  updateUsersForMultiCodes = (csvData: MultiCodeRow[]): void => {
    const uniqueCodes: string[] = []

    csvData.forEach((row) => {
      if (!this.coreUtils.multiCodeRowForType(row)) return
      const code = row.code.toLowerCase()
      if (!uniqueCodes.includes(code)) uniqueCodes.push(code)
      this.codeData.push({ code, startTime: row.start, endTime: row.end })
    })
    this.updateCodeStore(uniqueCodes)
  }

  updateTimelineValues = () => {
    const users = get(UserStore)
    let maxEndTime = 0

    for (const user of users) {
      if (user.dataTrail.length > 0) {
        const lastTime = user.dataTrail[user.dataTrail.length - 1].time ?? 0
        if (lastTime > maxEndTime) maxEndTime = lastTime
      }
    }

    if (maxEndTime > 0) {
      timelineV2Store.initialize(maxEndTime, 0)
    }
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

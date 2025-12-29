import type {
  PapaParseResult,
  MovementRow,
  ConversationRow,
  SingleCodeRow,
  MultiCodeRow,
  CsvRow,
} from './types'
import { GPSTransformer } from '../gps/gps-transformer'

export type RowValidator<T> = (row: T) => boolean

export class CoreUtils {
  // NOTE: All headers must be lowercase as input data tables are converted to lowercase when loaded using PapaParse transformHeaders method
  readonly headersMovement: readonly string[] = ['time', 'x', 'y'] // Each index is tested to be type number
  readonly headersConversation: readonly string[] = ['time', 'speaker', 'talk'] // Of type number, string, and not null or undefined
  readonly headersSingleCodes: readonly string[] = ['start', 'end'] // Of type number
  readonly headersMultiCodes: readonly string[] = ['code', 'start', 'end'] // MUST MATCH singleCodeHeaders with one extra column 'code' of type string
  readonly headersGPSMovement1: readonly string[] = ['time', 'lat', 'lng'] // GPS movement with short header names
  readonly headersGPSMovement2: readonly string[] = ['time', 'latitude', 'longitude'] // GPS movement with full header names

  testMovement(results: PapaParseResult): boolean {
    return this.testPapaParseResults(results, this.headersMovement, this.movementRowForType)
  }

  testConversation(results: PapaParseResult): boolean {
    return this.testPapaParseResults(results, this.headersConversation, this.conversationRowForType)
  }

  testSingleCode(results: PapaParseResult): boolean {
    return this.testPapaParseResults(results, this.headersSingleCodes, this.codeRowForType)
  }

  testMulticode(results: PapaParseResult): boolean {
    return this.testPapaParseResults(results, this.headersMultiCodes, this.multiCodeRowForType)
  }

  testGPSMovement(results: PapaParseResult): boolean {
    return (
      this.testPapaParseResults(results, this.headersGPSMovement1, this.gpsRowForType) ||
      this.testPapaParseResults(results, this.headersGPSMovement2, this.gpsRowForType)
    )
  }

  /**
   * @param results - PapaParse results object
   * @param headers - Expected headers
   * @param callbackTypeTest - Row validation function
   * Note: must bind this to callbackTypeTest to set correct "this" context
   */
  testPapaParseResults(
    results: PapaParseResult,
    headers: readonly string[],
    callbackTypeTest: RowValidator<CsvRow>
  ): boolean {
    return (
      results.data.length > 0 &&
      this.includesAllHeaders(results.meta.fields, headers) &&
      this.hasOneCleanRow(results.data, callbackTypeTest.bind(this))
    )
  }

  // NOTE: fieldNames from parsed file are converted to lowercase on Processing with PapaParse transformHeaders method
  includesAllHeaders(
    fieldNamesLowerCase: string[] | undefined,
    headers: readonly string[]
  ): boolean {
    if (!fieldNamesLowerCase) return false
    for (const header of headers) {
      if (!fieldNamesLowerCase.includes(header)) return false
    }
    return true
  }

  hasOneCleanRow(resultsDataArray: CsvRow[], callbackTypeTest: RowValidator<CsvRow>): boolean {
    for (const curRow of resultsDataArray) {
      if (callbackTypeTest(curRow)) return true
    }
    return false
  }

  movementRowForType(curRow: CsvRow): boolean {
    return (
      this.isValidNumber(curRow[this.headersMovement[0]]) &&
      this.isValidNumber(curRow[this.headersMovement[1]]) &&
      this.isValidNumber(curRow[this.headersMovement[2]])
    )
  }

  gpsRowForType(curRow: CsvRow): boolean {
    const time = curRow['time']
    const lat = curRow['lat'] ?? curRow['latitude']
    const lng = curRow['lng'] ?? curRow['longitude']
    return (
      this.isValidNumber(time) &&
      this.isValidNumber(lat) &&
      this.isValidNumber(lng) &&
      GPSTransformer.isValidGPSPoint({ lat: lat as number, lng: lng as number })
    )
  }

  // NOTE: for talk turns/3rd column, allow boolean, number or string values. These are cast as Strings later in program
  conversationRowForType(curRow: CsvRow): boolean {
    return (
      this.isValidNumber(curRow[this.headersConversation[0]]) &&
      typeof curRow[this.headersConversation[1]] === 'string' &&
      this.isStringNumberOrBoolean(curRow[this.headersConversation[2]])
    )
  }

  /**
   * Validates that a value is a valid number (not NaN or Infinity)
   */
  private isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
  }

  isStringNumberOrBoolean(value: unknown): boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
  }

  codeRowForType(curRow: CsvRow): boolean {
    return (
      this.isValidNumber(curRow[this.headersSingleCodes[0]]) &&
      this.isValidNumber(curRow[this.headersSingleCodes[1]])
    )
  }

  multiCodeRowForType(curRow: CsvRow): boolean {
    return (
      typeof curRow[this.headersMultiCodes[0]] === 'string' &&
      this.isValidNumber(curRow[this.headersMultiCodes[1]]) &&
      this.isValidNumber(curRow[this.headersMultiCodes[2]])
    )
  }

  /**
   * Used to compare and add new data to core data lists from CSV file names and data
   */
  cleanFileName(string: string): string {
    return string
      .trim()
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
  }
}

export class CoreUtils {
	constructor() {
		// NOTE: All headers must be lowercase as input data tables are converted to lowercase when loaded using PapaParse transformHeaders method
		this.headersMovement = ['time', 'x', 'y']; // Each index is tested to be type number
		this.headersConversation = ['time', 'speaker', 'talk']; // Of type number, string, and not null or undefined
		this.headersSingleCodes = ['start', 'end']; // Of type number
		this.headersMultiCodes = ['code', 'start', 'end']; // MUST MATCH singleCodeHeaders with one extra column 'code' of type string
	}

	testMovement(results) {
		return this.testPapaParseResults(results, this.headersMovement, this.movementRowForType);
	}

	testConversation(results) {
		return this.testPapaParseResults(results, this.headersConversation, this.conversationRowForType);
	}

	testSingleCode(results) {
		return this.testPapaParseResults(results, this.headersSingleCodes, this.codeRowForType);
	}

	testMulticode(results) {
		return this.testPapaParseResults(results, this.headersMultiCodes, this.multiCodeRowForType);
	}

	/**
	 * @param  {Papaparse Results Array} results
	 * @param  {Array} headers
	 * @param  {Function} callbackTypeTest
	 * Note: must bind this to callbackTypeTest to set correct "this" context
	 */
	testPapaParseResults(results, headers, callbackTypeTest) {
		return (
			results.data.length > 0 &&
			this.includesAllHeaders(results.meta.fields, headers) &&
			this.hasOneCleanRow(results.data, callbackTypeTest.bind(this))
		);
	}

	// NOTE: fieldNames from parsed file are converted to lowercase on Processing with PapaParse transformHeaders method
	includesAllHeaders(fieldNamesLowerCase, headers) {
		for (const header of headers) {
			if (!fieldNamesLowerCase.includes(header)) return false;
		}
		return true;
	}

	hasOneCleanRow(resultsDataArray, callbackTypeTest) {
		for (const curRow of resultsDataArray) {
			if (callbackTypeTest(curRow)) return true;
		}
		return false;
	}

	movementRowForType(curRow) {
		return (
			typeof curRow[this.headersMovement[0]] === 'number' &&
			typeof curRow[this.headersMovement[1]] === 'number' &&
			typeof curRow[this.headersMovement[2]] === 'number'
		);
	}

	// NOTE: for talk turns/3rd column, allow boolean, number or string values. These are cast as Strings later in program
	conversationRowForType(curRow) {
		return (
			typeof curRow[this.headersConversation[0]] === 'number' &&
			typeof curRow[this.headersConversation[1]] === 'string' &&
			this.isStringNumberOrBoolean(curRow[this.headersConversation[2]])
		);
	}

	isStringNumberOrBoolean(value) {
		return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
	}

	codeRowForType(curRow) {
		return typeof curRow[this.headersSingleCodes[0]] === 'number' && typeof curRow[this.headersSingleCodes[1]] === 'number';
	}

	multiCodeRowForType(curRow) {
		return (
			typeof curRow[this.headersMultiCodes[0]] === 'string' &&
			typeof curRow[this.headersMultiCodes[1]] === 'number' &&
			typeof curRow[this.headersMultiCodes[2]] === 'number'
		);
	}

	/**
	 * Used to compare and add new data to core data lists from CSV file names and data
	 * @param  {String} s
	 */
	cleanFileName(string) {
		return string
			.trim()
			.replace(/\.[^/.]+$/, '')
			.toLowerCase();
	}
}

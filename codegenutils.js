/*

Alex Reynolds
CMPU-331
Final Project

codegenutils.js

	- Contains functions used to generate code
	- Object representations of:
		Execution Environment
		Static Data Table
		Heap Data Table
		Jumps Table
*/

// Execution Environment table object
// Holds code generated
// Uses an array of arrays to represent table
function ExecEnv () {

	// An array to hold the content of the table
	this.content = [];

	// Initialize multiple rows
	for (var n = 0; n < 12 ; n++) {

		// Constructs row
		var row = [];

		for (var i = 0; i < 8; i++)
		{
			row[i] = "";
		}

		// Adds row to table content
		this.content.push(row);
	}

	// Points to the row currently being edited in table
	this.currRow = this.content[0];

	// Current index of next open spot
	this.frontindex = 0;

	// Current index of last open space in table
	this.tailindex = this.content.length * 8 - 1;

	// Adds a new cell of entry to the table
	this.addEntry = function (opcode) {

		var row = Math.floor(this.frontindex / 8);
		var column = this.frontindex % 8;

		// Adds entry to the first open spot in the current row
		this.content[row][column] = opcode.toUpperCase();

		// Increments front end index
		this.frontindex++;

		// If in if/while statement, increment jump position counter
		if (ifwhileFlag) {
			jumpCounter++;
		}
	};

	// Adds a new cell of entry to the end of the table
	this.addTailEntry = function (opcode) {

		// Gets the index of where in the row the entry should go
		var column = this.tailindex % 8;

		// Gets the index of the row where the entry should go
		var row = Math.floor(this.tailindex / 8);

		// Adds entry to the end of the current row
		this.content[row][column] = opcode.toUpperCase();

		// Decrements tailindex
		this.tailindex--;
	};

	// A toString method, to return the op code for processing
	this.toString = function () {

		// String of code to be returned
		var code = "";

		// Step through the table to add all of the values to the string
		// Iterate through rows
		for (var k = 0; k < this.content.length; k++) {
			// Iterate through columns
			for (var m = 0; m < 8; m++) {
				if (code == "") {
					code += this.content[k][m];
				}
				else {
					code = code + " " + this.content[k][m];
				}
			}
		}

		return code;
	};


}

// Static Data table object
// Holds variable entries
function StaticDataTable () {

	// An array to hold the entries of the Static Data table
	this.entries = [];

	// Adds a new entry to the table
	this.newEntry = function (temp, varname, scope) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp variable
						variable: varname,	// name of variable stored
						scope: scope,		// scope of variable
						offset: 0			// offset of variable (set to 0 until known)
					};

		// Sets current entry offset to that of the previous entry + 1
		if (this.entries.length > 1) {
			entry.offset = this.entries[this.entries.length - 1].offset + 1;
		}

		// Adds new entry to entries array
		this.entries.push(entry);

		//console.log("ADDED STATIC ENTRY FOR " + varname + " AT SCOPE " + scope);
	};

	// Returns an entry from the table, given its variable name and scope
	this.getEntry = function (varname, scope) {

		//console.log("Static get entry var: " + varname + " scope: " + scope);

		for (var i = 0; i < this.entries.length ; i++) {

			var tempentry = this.entries[i];

			//console.log("name: " + tempentry.variable + " scope: " + tempentry.scope);

			if (tempentry.variable == varname && tempentry.scope == scope) {
				//console.log("FOUND");
				return tempentry;
			}

		}
	};

}


// Heap Data table object
// Keeps track of string variables
function HeapDataTable () {

	// An array to hold the entries of the Static Data table
	this.entries = [];

	// Adds a new entry to the table
	this.newEntry = function (temp, varname, scope) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp variable
						variable: varname,	// name of variable stored
						scope: scope,		// scope of variable
						offset: 0			// offset of variable (eventually - length of string)
					};

		// Adds new entry to entries array
		this.entries.push(entry);

		//console.log("ADDED HEAP ENTRY FOR " + varname + " AT SCOPE " + scope);
	};

	// Returns an entry from the table, given its temp value
	this.getEntry = function (id, scope) {

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < this.entries.length ; i++) {

			var tempentry = this.entries[i];

			if ((tempentry.variable == id) && (tempentry.scope == scope)) {
				// console.log("found entry");
				return tempentry;
			}

		}
	};

}

// Jumps table object
// Tracks if statements
function JumpsTable () {

	// Array to hold table entries
	this.entries = [];

	// Adds a new entry to the table
	this.newEntry = function (temp, dist) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp location
						dist: dist			// distance of jump
					};

		// Adds new entry to entries array
		this.entries.push(entry);
	};

	// Returns an entry from the table, given its temp value
	this.getEntry = function (tempname) {

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < this.entries.length ; i++) {

			var tempentry = this.entries[i];

			if (tempentry.temp == tempname) {

				return tempentry;
			}

		}
	};
}

// Used to test if a value is a number (ints are stored as strings here)
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

// Used to test if a value is an id (a single character that is not + or - or numeric)
function isId(value) {
	return (value.length == 1 && !(value == "+" || value == "-") && !isNumber(value));
}

// Used to test if a value is an operator (+ or -)
function isOp(value) {
	return (value == "+" || value == "-");
}

// Used to check the type of the given input, a node name
// Returns a string indicating type of input
function checkType(value) {
	if (isOp(value)) { return "int"; }
	else if (isNumber(value)) { return "int"; }
	else if (value == "true" || value == "false") { return "boolean"; }
	else if (value == "equal?") { return "boolean"; }
	else if (value.length > 1) { return "string"; }
	else { return "MYSTERY"; }
}

// Stores an integer to be used for boolean purposes at the beginning of the environment
function setEnvironment () {

	// Adds boolean 1 (true) to the environment
	execEnv.addEntry("A9");	// Load accumulator
	execEnv.addEntry("01");	// Store value true
	execEnv.addEntry("8D");	// Store accumulator in memory
	execEnv.addEntry("B0");	// Temp location
	execEnv.addEntry("XX");	// BOXX

	// Adds its entry to Static Data table
	staticData.newEntry("B0XX", "bool", -1);

	// Adds strings "true" and "false" to the environment (for printing)
	declareString("true", "B1XX", -1);
	assignString("B1XX", "true", -1, "true");
	declareString("false", "B2XX", -1);
	assignString("B2XX", "false", -1, "false");

}

// Declares an integer in the environment, given its name, Temp address & scope
function declareInt(id, temp, scope) {

	execEnv.addEntry("A9");		// Load accumulator
	execEnv.addEntry("00");		// Store value 0
	execEnv.addEntry("8D");		// Store accumulator in memory
	execEnv.addEntry(temp);		// Temp location
	execEnv.addEntry("XX");		// T#XX

	// Add the int variable to the Static Data table
	staticData.newEntry(temp + "XX", id, scope);

}

// Declares a string in the environment, given its name, Temp address & scope
function declareString(id, temp, scope) {

	// Add string variable to the Heap
	heapData.newEntry(temp + "XX", id, scope);
	// console.log("string declared");
}

// Declares a boolean in the environment, given its name, Temp address (T#) & scope
function declareBoolean(id, temp, scope) {

	// Booleans represented as ints in the environment
	// 00 is false, 01 true

	execEnv.addEntry("A9");		// Load accumulator
	execEnv.addEntry("00");		// Store value 0
	execEnv.addEntry("8D");		// Store accumulator in memory
	execEnv.addEntry(temp);		// Temp location
	execEnv.addEntry("XX");		// T#XX

	// Add the boolean variable to the Static Data table
	staticData.newEntry(temp + "XX", id, scope);
}

// Assigns an integer in the environment, given its Temp address (T#) and value
function assignInt(temp, value) {

	console.log("ASSIGN INT TO " + value);

	// Note: temp here is the full Temp location (T#XX)


	value = parseInt(value).toString(16).toUpperCase();
	value = fixInt(value);
	console.log("VALUE : " + value);

	execEnv.addEntry("A9");						// Load accumulator
	execEnv.addEntry(value);					// Store value in acc
	execEnv.addEntry("8D");						// Store accumulator in memory
	execEnv.addEntry(temp.substring(0,2));		// Temp location
	execEnv.addEntry(temp.substring(2,4));		// T#XX

}

// Assigns an integer in the environment, given its Temp address (T#), an int and another id
function assignIntId(temp1, value, temp2) {

	// Note: temp here is the full Temp location (T#XX)

	value = parseInt(value).toString(16).toUpperCase();
	value = fixInt(value);

	execEnv.addEntry("A9");						// Load accumulator with a constant
	execEnv.addEntry(value);					// Store value in acc
	execEnv.addEntry("6D");						// Add value stored in second id
	execEnv.addEntry(temp2.substring(0,2));		// Found at location
	execEnv.addEntry(temp2.substring(2,4));		// T#XX
	execEnv.addEntry("8D");						// Store accumulator in memory
	execEnv.addEntry(temp1.substring(0,2));		// Store at id1's Temp location
	execEnv.addEntry(temp1.substring(2,4));		// T#XX

}

// Assigns a string in the environment, given its Temp address (T#), name, scope and value
function assignString(temp, id, scope, value) {

	execEnv.addTailEntry("00");	// Signifies that the string is done

	//console.log("Adding string " + value + " of length " + value.length);

	// Steps backward through the string value
	// Each value is converted to hex and then added to the end of the environment
	for (var i = value.length - 1; i > -1; i--) {

		var hexChar = value.charCodeAt(i).toString(16).toUpperCase();
		execEnv.addTailEntry(hexChar);
	}

	// The location of the start of the string in the environment
	var stringLoc = (execEnv.tailindex + 1).toString(16);
	// console.log("string location in memory: " + stringLoc);

	// Adds string data to the environment
	/*
	execEnv.addEntry("AC");
	execEnv.addEntry(stringLoc);
	execEnv.addEntry("8D");
	execEnv.addEntry(temp.substring(0,2));
	execEnv.addEntry(temp.substring(2,4));
	*/

	// Updates the offset in the string's entry in the heap
	heapData.getEntry(id, scope).offset = -(value.length + 1);
	// console.log("string offset: " + (-(value.length + 1)));
	// Updates location in string's entry in heap
	//heapData.getEntry(id, scope).temp = stringLoc + "00";
}

// Assigns a value to a boolean in the environment, given its Temp (T#), scope & value
function assignBoolean(temp, scope, value) {

	if (value == "false") { value = "00"; }
	else { value = "01"; }

	console.log("bool value = " + value);
	console.log("bool temp = " + temp);

	execEnv.addEntry("A9");		// Load accumulator
	execEnv.addEntry(value);	// Store value
	execEnv.addEntry("8D");		// Store accumulator in memory
	execEnv.addEntry(temp.substring(0,2));		// Temp location
	execEnv.addEntry(temp.substring(2,4));		// T#XX

}

// Assigns a value from one id in the environment to another
function assignId(temp1, temp2) {

	execEnv.addEntry("AD"); 				// Load accumulator from memory
	execEnv.addEntry(temp2.substring(0,2));
	execEnv.addEntry(temp2.substring(2,4));	// Load value at id 2
	execEnv.addEntry("8D"); 				// Store accumulator in memory
	execEnv.addEntry(temp1.substring(0,2));
	execEnv.addEntry(temp1.substring(2,4));	// Store accumulator in id 1

}

// Prints the value of an id, given its temp address and type
function printId(temp, type) {

	if (type == "int")	{
		execEnv.addEntry("AC");					// Load accumulator
		execEnv.addEntry(temp.substring(0,2));	// With id value
		execEnv.addEntry(temp.substring(2,4));
		execEnv.addEntry("A2");					// Load X reg with 1
		execEnv.addEntry("01");					// (1 = print int)
		execEnv.addEntry("FF");					// System call
	}
	else if (type == "string") {
		execEnv.addEntry("A0");					// Load accumulator
		execEnv.addEntry(temp.substring(0,2));	// With id value
		// execEnv.addEntry(temp.substring(2,4));
		execEnv.addEntry("A2");					// Load X reg with 2
		execEnv.addEntry("02");					// (2 = print string)
		execEnv.addEntry("FF");					// System call
	}
	else if (type == "boolean") {
		printBoolean(temp);
	}
	else
	{
		console.log("WHOOPS trying to print an id of unknown type!");
	}

}

// Prints the value of an int, given its temp address and type
function printInt(value, temp, temploc) {

		// Converts int to hex
		value = parseInt(value).toString(16).toUpperCase();
		// Makes value two characters long
		value = fixInt(value);

		// If printing an int expression with an id
		if (temp) {
			execEnv.addEntry("A9");						// Load accumulator with a constant
			execEnv.addEntry(value);					// Store value in acc
			execEnv.addEntry("6D");						// Add value stored in second id
			execEnv.addEntry(temp.substring(0,2));		// Found at location
			execEnv.addEntry(temp.substring(2,4));		// T#XX
			execEnv.addEntry("8D");						// Store accumulator in memory
			execEnv.addEntry(temploc);					// At temp int values' temp location
			execEnv.addEntry("XX");						// temploc + XX
			execEnv.addEntry("A0");						// Load Y reg with temp int value
			execEnv.addEntry(temploc);
			execEnv.addEntry("XX");
			execEnv.addEntry("A2");						// Load X reg with 1
			execEnv.addEntry("01");						// (1 = print int)
			execEnv.addEntry("FF");						// System call

			// Add the temporary int variable to the Static Data table
			staticData.newEntry(temploc + "XX", "temp", -1);
		}
		// If only printing an int
		else {
			execEnv.addEntry("A0");		// Load Y reg with value
			execEnv.addEntry(value);
			execEnv.addEntry("A2");		// Load X reg with 1
			execEnv.addEntry("01");		// (1 = print int)
			execEnv.addEntry("FF");		// System call
		}
	
}

// Prints a string, given its temp address
function printString(temp) {

	execEnv.addEntry("A0");					// Load Y register
	execEnv.addEntry(temp.substring(0,2));	// With string value from temp
	//execEnv.addEntry(temp.substring(2,4));
	execEnv.addEntry("A2");					// Load X reg with 2
	execEnv.addEntry("02");					// (2 = print string)
	execEnv.addEntry("FF");					// System call
}

// Prints a boolean, given its temp address
function printBoolean(temp) {
	console.log("PRINT BOOLEAN");
	console.log("bool temp: " + temp);
	
	if (temp == "B1XX") {
		execEnv.addEntry("A0");			// Load Y reg with constant
		execEnv.addEntry("B1");			// The address of the string "true"
		execEnv.addEntry("A2");			// Load X reg with 2
		execEnv.addEntry("02");
		execEnv.addEntry("FF");			// System call
	}
	else if (temp == "B2XX") {
		execEnv.addEntry("A0");			// Load Y reg with constant
		execEnv.addEntry("B2");			// The address of the string "false"
		execEnv.addEntry("A2");			// Load X reg with 2
		execEnv.addEntry("02");
		execEnv.addEntry("FF");			// System call
	}
	else {
		/*
		execEnv.addEntry("AC");					// Load accumulator
		execEnv.addEntry(temp.substring(0,2));	// With string value from temp
		execEnv.addEntry(temp.substring(2,4));
		execEnv.addEntry("A2");					// Load X reg with 2
		execEnv.addEntry("02");					// (2 = print string)
		execEnv.addEntry("FF");					// System call
		*/
		// Printing a variable boolean
		execEnv.addEntry("AE");
		execEnv.addEntry(temp.substring(0,2));
		execEnv.addEntry(temp.substring(2,4));	// Load contents of variable to X register
		execEnv.addEntry("EC");	// Compare byte in memory to variable val in X reg
		execEnv.addEntry("B0");	// Byte is true (01)
		execEnv.addEntry("XX");
		execEnv.addEntry("D0");	// Branch on not equal
		execEnv.addEntry("0D");	// Jump to not equal (print false) - 13 positions
		// IF BOOLEAN IS TRUE
		execEnv.addEntry("A0");		// Load Y reg with constant
		execEnv.addEntry("B1");		// address of string true
		execEnv.addEntry("A2");		// Load X reg with 2
		execEnv.addEntry("02");
		execEnv.addEntry("FF");		// System call
		execEnv.addEntry("A2");		// Load X reg with constant 0
		execEnv.addEntry("00");
		execEnv.addEntry("EC");		// Compare to byte 01 in memory
		execEnv.addEntry("B0");		// (will evaluate to false)
		execEnv.addEntry("XX");
		execEnv.addEntry("D0");		// Branch on not true
		execEnv.addEntry("05");		// Jump past false print statement
		// IF BOOLEAN IS FALSE
		execEnv.addEntry("A0");		// Load Y reg with constant
		execEnv.addEntry("B2");		// address of string false
		execEnv.addEntry("A2");		// Load X reg with 2
		execEnv.addEntry("02");
		execEnv.addEntry("FF");		// System call

	}
}

// Evaluates Int Expressions with operations and returns the final value
function intExprEval(startnode) {

	// Starting node is the provided node
	var node = startnode;
	// Variable to hold second id to check if necessary
	var id = "";
	// Accumulator, initialized with value of LHS (a digit)
	var acc = parseInt(node.children[0].name);

	// Iterate through RHS until the end of the expression
	while (node.name == "+" || node.name == "-") {

		// Get right hand child node
		var rhsname = node.children[1].name;

		// If RHC is an id, get its value
		if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

			id = rhsname;
		}
		// Else RHC is a number, update acc
		else if (isNumber(rhsname)) {

			if (startnode.name == "+") {
				acc += parseInt(rhsname);
			}
			else {
				acc -= parseInt(rhsname);
			}	
		}
		else {
			// Weird shit is going down
			console.log("Error accumulating intExpr in assign.");
		}

		// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
		node = node.children[1];
	}

	// If no id was found, simply return acc value
	if (id.length == 0) {
		return acc;
	}
	// Else return array with acc and id found
	else {
		console.log("return array");
		var temparray = [];
		temparray.push(acc);
		temparray.push(id);
		return temparray;
	}
}

// Performs operations for an If expression
function ifExprEval(boolVal, jumpCount) {
	console.log("IFEXPREVAL");

	// Temporary location for jump
	var jumpTemp = "J" + jumpCount;
	jumpCount++;

	execEnv.addEntry("A2");		// Load boolean into X reg
	execEnv.addEntry(boolVal);
	execEnv.addEntry("EC");		// Compare to bool val true (01)
	execEnv.addEntry("B0");		// Stored at B0XX
	execEnv.addEntry("XX");
	execEnv.addEntry("D0");		// Branch if z flag = 0
	execEnv.addEntry(jumpTemp);	// Jump

	// Add jump to jump table
	jumpsTable.newEntry(jumpTemp, "?");

	// Set flags to start counters
	inIfExpr = true;
	ifwhileFlag = true;
}

// Performs operations for a while expression
function whileExprEval(boolVal) {

	// Temporary location for jump
	var jumpTemp = "J" + jumpCount;
	jumpCount++;

	// Sets in while flag to index of the first entry of while cond
	inWhileExpr = execEnv.frontindex - 1;

	execEnv.addEntry("A2");		// Load boolean into X reg
	execEnv.addEntry(boolVal);
	execEnv.addEntry("EC");		// Compare to bool val true (01)
	execEnv.addEntry("B0");		// Stored at B0XX
	execEnv.addEntry("XX");
	execEnv.addEntry("D0");		// Branch if z flag = 0

	// Add jump to jump table
	jumpsTable.newEntry(jumpTemp, "?");

	// Set flags to start counters
	ifwhileFlag = true;	

}

// Finishes while expressions once the statement block ends
function endWhile(destindex) {

	// Get a true comparison and jump back to start of while loop
	execEnv.addEntry("A2");		// Load boolean into X reg
	execEnv.addEntry("00");
	execEnv.addEntry("EC");		// Compare to bool val true (01)
	execEnv.addEntry("B0");		// Stored at B0XX
	execEnv.addEntry("XX");
	execEnv.addEntry("D0");		// Branch if z flag = 0
	// Branches because false and jumps back to the start of the loop
	// (Jump added below)

	// Get value of jump
	// To jump backwards (to start of loop), jump forwards in position
	// until pos loops at 255 and starts back at 0
	var currIndex = execEnv.frontindex;
	var jumpDist = destindex + 255 - currIndex + 1;
	// Convert jump distance to hex and add to environment at end of while loop
	jumpDist = jumpDist.toString(16).toUpperCase();
	// console.log("JUMPDIST: " + jumpDist);
	execEnv.addEntry(jumpDist);
}

// Evaluates equal? statements
// Given LHS, RHS, temp values of both (if they are ids), flag (temp location if needs to be stored)
function equalEval(lhs, rhs, lefttemp, righttemp, flag, jumpCount) {

	var boolVal = "";
	var jumpTemp = "J" + jumpCount.toString();
	var idtemp = "";
	var constant = "";
	var id = "";
	var constantType = checkType(constant);

	// Sets inWhileExpr flag to first index of the while statement cond
	if (inWhileExpr) {
		inWhileExpr = execEnv.frontindex - 1;
	}

	// If evaluating two variables
	if (lefttemp && righttemp) {

		execEnv.addEntry("AE");		// Load X register with contents of LHS
		execEnv.addEntry(lefttemp.substring(0,2));
		execEnv.addEntry(lefttemp.substring(2,4));
		execEnv.addEntry("EC");		// Compare X register to contents of RHS
		execEnv.addEntry(righttemp.substring(0,2));
		execEnv.addEntry(righttemp.substring(2,4));
		execEnv.addEntry("D0");		// Branch on NOT EQUAL
		execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true

	}
	// If evaluating a variable and a constant
	else if (lefttemp || righttemp) {

		// Sets temp location of id and constant to check
		if (lefttemp) {
			idtemp = lefttemp; 
			id = lhs;
			constant = rhs;
		}
		else {
			idtemp = righttemp;
			id = rhs;
			constant = lhs;
		}

		var type = STtypesearch(symbolTable.curr, id);
		console.log("id type: " + type);

		// Get type of constant
		constantType = checkType(constant);
		console.log("constant: " + constantType);

		// If checking variable against int
		if (constantType == "int") {

			// Converts the constant to hex
			constant.toString(16).toUpperCase();
			// Fixes number to be two digits
			constant = fixInt(constant);
			console.log("constant after being fixed up: " + constant);

			execEnv.addEntry("A2");		// Load X reg with int constant
			execEnv.addEntry(constant);
			execEnv.addEntry("EC");		// Check X reg against contents of id
			execEnv.addEntry(idtemp.substring(0,2));
			execEnv.addEntry(idtemp.substring(2,4));
			execEnv.addEntry("D0");		// Branch on NOT EQUAL
			execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true

		}
		// If checking variable against a boolean
		else if (constantType == "boolean") {
			// Problems arise if variable is an int of 0 or 1
			// If this is true, skip if because it will only evaluate to false anyway
			if (type !== "boolean") {
				// Automatically branch on not equal
				execEnv.addEntry("D0");
				execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true
			}
			else {
				// If constant is an equal? **** IGNORE FOR NOW
				if (constant == "equal?") { console.log("ALERT NESTED EQUALS GO HOME AND CRY NOW."); }
				// Resets constant to a numerical boolean value
				else if (constant == "true") { constant = "01"; }
				else if (constant == "false") { constant = "00"; }

				execEnv.addEntry("A2");		// Load X reg with boolean value
				execEnv.addEntry(constant);
				execEnv.addEntry("EC");		// Check X reg against contents of id
				execEnv.addEntry(idtemp.substring(0,2));
				execEnv.addEntry(idtemp.substring(2,4));
				execEnv.addEntry("D0");		// Branch on NOT EQUAL
				execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true
			}

		}
		// If checking variable against a string
		else if (constantType == "string") {

			var idstr = "";

			// Check if id is in Heap table. If it is, get the string it represents
			for (var i = 0; i < heapData.entries.length; i++) {
				if (idtemp == heapData.entries[i].temp) {
					idstr = getString(heapData.entries[i].offset);
				}
			}

			// Compare id string to constant string and store result
			if (idstr == constant) { constant = "01"; }
			else { constant = "00"; }

			execEnv.addEntry("A2");		// Load X reg with int constant
			execEnv.addEntry(constant);
			execEnv.addEntry("EC");		// Check X reg against boolean true
			execEnv.addEntry("B0");
			execEnv.addEntry("XX");
			execEnv.addEntry("D0");		// Branch on NOT EQUAL
			execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true

		}
		// Else something is not right
		else
		{
			console.log("Trying to evaluate equal? with an id and constant but CONFUSE.");
		}

	}
	// If evaluating two constants
	else {

		// Set constant to proper boolean value
		if (lhs == rhs) { constant = "01"; }
		else { constant = "00"; }

		execEnv.addEntry("A2");		// Load X reg with int constant
		execEnv.addEntry(constant);
		execEnv.addEntry("EC");		// Check X reg against boolean true
		execEnv.addEntry("B0");
		execEnv.addEntry("XX");
		execEnv.addEntry("D0");		// Branch on NOT EQUAL
		execEnv.addEntry(jumpTemp);	// Jump ahead to code executed after true

	}

	// ADDING THE JUMP ENTRY TO JUMPS TABLE
	// If flag indicates value to be stored in boolean flag temp
	if (flag) {
		// If true
		execEnv.addEntry("A9");		// Load accumulator
		execEnv.addEntry("01");		// Store true
		execEnv.addEntry("8D");		// Store accumulator in memory
		execEnv.addEntry(flag.substring(0,2));		// Temp location
		execEnv.addEntry(flag.substring(2,4));		// T#XX

		// Set jump table entry to represent jumping over above code
		jumpsTable.newEntry(jumpTemp, 6);

		// If false
		execEnv.addEntry("A9");		// Load accumulator
		execEnv.addEntry("00");		// Store false
		execEnv.addEntry("8D");		// Store accumulator in memory
		execEnv.addEntry(flag.substring(0,2));		// Temp location
		execEnv.addEntry(flag.substring(2,4));		// T#XX
	}
	// Else, simply add jump to jumps table
	else {
		// Add jump to jump table
		jumpsTable.newEntry(jumpTemp, "?");

		// Flag set for in if/while statement
		// Starts counting number of positions to jump for jump statement
		if (inIfExpr || inWhileExpr) {
			ifwhileFlag = true;
		}
	}
}

// Formats integers to be two digit strings
// Returns formatted value
function fixInt(value) {

	if (value < 10) {
		value = "0" + value;
	}
	else {
		value = value.toString();
	}

	return value;
}

// Creates a string given the offset of a string in environment
function getString(offset) {

	offset = parseInt(offset);
	var startindex = (execEnv.content.length - 1) + offset;
	var str = "";

	for (var i = startindex; i < execEnv.content.length; i++) {

		// Gets the index of where in the row the entry should go
		var column = this.tailindex % 8;
		// Gets the index of the row where the entry should go
		var row = Math.floor(this.tailindex / this.content.length);

		// Appends generated ASCII character to string to return
		str += hexToString(execEnv.content[row][column]);
	}

	return str;
}

// Returns ASCII string given a hex code
function hexToString(hex) {
    var str = "";

    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    return str;
}

// Steps up through the symbol table looking for the most recent occurrence of given id
// Returns the number (name) of the scope that it was found in
function STscopesearch (node, id) {

	console.log("ST scope search | start node : " + node.scope + "	id: " + id);

	var found = false;

	while (node.parent !== undefined && !found) {
		
		// Check current scope to see if id has already been declared
		for (var i = 0; i < node.ids.length; i++)
		{
			var currid = node.ids[i].getID();

			if (currid == id) {
				found = true;
				return node.scope;
			}
		}

		// Move up tree if not found at current scope
		node = node.parent;
	}
}

// Steps up through the symbol table looking for the most recent occurrence of given id
// Returns the type assignment of the most recent occurrence
function STtypesearch (node, id) {

	var found = false;

	while (node.parent !== undefined && !found) {
		
		// Check current scope to see if id has already been declared
		for (var i = 0; i < node.ids.length; i++)
		{
			var currid = node.ids[i].getID();

			if (currid == id) {
				found = true;
				console.log("TYPE = " + node.ids[i].getType());
				return node.ids[i].getType();
			}
		}

		// Move up tree if not found at current scope
		node = node.parent;
	}
}

// Searches heap and static data tables to determine which contains given id
// Returns string indicating table found in
function tableSearch(id) {

	var table = "";

	for (var i = 0; i < heapData.entries.length; i++) {
		if (heapData.entries[i].variable = id) {
			table = "heap";
		}
	}

	for (var j = 0; j < staticData.entries.length; j++) {
		if (staticData.entries[j].variable = id) {
			table = "static";
		}
	}

	return table;

}

// Goes through the environment and backpatches temporary variables
function backpatch() {

	// Add a 00 to the end of the environment (tells system to break)
	execEnv.addEntry("00");

	var address = execEnv.frontindex;

	// Convert to hex: yourNumber.toString(16);

	// First go through STATIC data table and backpatch all values
	for (var i = 0; i < staticData.entries.length; i++) {

		// Address to store variable at in environment
		// (Hex number of next open position in table)
		address = execEnv.frontindex.toString(16).toUpperCase();

		// Makes address of form "0#"
		if (address.length < 2) { address = "0" + address; }

		// Fill cell in environment table with 00 as placeholder for variable
		execEnv.addEntry("00");

		// Temp value of variable
		var temp = staticData.entries[i].temp;
		// Extracts "T#" from string
		temp = temp.substring(0,2);

		// Replace all instances of temp variable with address
		// Replace all instances of XX with 00
		for (var row = 0; row < execEnv.content.length; row++) {
			for (var col = 0; col < 8; col++) {
				// If an instance of the variable, replace with address
				if (execEnv.content[row][col] == temp) {
					//console.log(execEnv.content[row][col]);
					execEnv.content[row][col] = address;
				}
				else if (execEnv.content[row][col] == "XX") {
					execEnv.content[row][col] = "00";
				}
			}
		}

		staticData.entries[i].temp = address + "00";
	}

	// Starting index for heap variables
	var totalCells = execEnv.content.length * 8;
	var startindex = totalCells;

	// Heap variables are backpatched in code gen (once string is declared)
	// Go through HEAP data and backpatch
	for (var i = 0; i < heapData.entries.length; i++) {

		// Address to store variable at in environment
		// Starting index (in hex) of string in env.
		startindex+=heapData.entries[i].offset;
		address = startindex.toString(16).toUpperCase();

		// Makes address of form "0#"
		if (address.length < 2) { address = "0" + address; }

		// Fill cell in environment table with 00 as placeholder for variable
		execEnv.addEntry("00");

		// Temp value of variable
		var temp = heapData.entries[i].temp;
		// Extracts "T#" from string
		temp = temp.substring(0,2);

		// Replace all instances of temp variable with address
		// Replace all instances of XX with 00
		for (var row = 0; row < execEnv.content.length; row++) {
			for (var col = 0; col < 8; col++) {
				// If an instance of the variable, replace with address
				if (execEnv.content[row][col] == temp) {
					// console.log(execEnv.content[row][col]);
					execEnv.content[row][col] = address;
				}
				else if (execEnv.content[row][col] == "XX") {
					execEnv.content[row][col] = "00";
				}
			}
		}

		heapData.entries[i].temp = address + "00";
	}

	// Go through jumps table and backpatch all values
	for (var i = 0; i < jumpsTable.entries.length; i++) {

		// Address to store variable at in environment
		// (Hex number of next open position in table)
		address = execEnv.frontindex.toString(16).toUpperCase();

		// Makes address of form "0#"
		if (address.length < 2) { address = "0" + address; }

		// Fill cell in environment table with 00 as placeholder for variable
		execEnv.addEntry("00");

		// Temp value of variable
		var temp = jumpsTable.entries[i].temp;
		// Extracts "T#" from string
		temp = temp.substring(0,2);

		// Replace all instances of temp variable with address
		// Replace all instances of XX with 00
		for (var row = 0; row < execEnv.content.length; row++) {
			for (var col = 0; col < 8; col++) {
				// If an instance of the variable, replace with address
				if (execEnv.content[row][col] == temp) {
					execEnv.content[row][col] = address;
				}
			}
		}

		jumpsTable.entries[i].temp = address;
	}

	// Go through remaining cells in environment and fill with 00
	for (var row = 0; row < execEnv.content.length; row++) {
		for (var col = 0; col < 8; col++) {
			// If empty, fill with 00
			if (execEnv.content[row][col] == "") {
				execEnv.content[row][col] = "00";
			}
		}
	}

}








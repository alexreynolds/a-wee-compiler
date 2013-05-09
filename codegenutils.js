/*

Alex Reynolds
CMPU-331
Final Project

codegen.js

	- Generates assembly language code to be interpreted by an OS
	- Uses the AST generated previously
	- Can assume that there are no semantic errors in AST at this point,
	  as function would not be run if so.
*/

// Execution Environment table object
// Holds code generated
// Uses an array of arrays to represent table
function ExecEnv () {

	// An array to hold the content of the table
	this.content = [];

	// Initialize multiple rows
	for (var n = 0; n < 12 ; n++) {
		this.newRow();
	}

	// Points to the row currently being edited in table
	this.currRow = this.content[0];

	// Current index of last added cell
	this.frontindex = -1;

	// Current index of last open space in table
	this.tailindex = this.content.length * 8 - 1;

	// Adds a new row to the table
	this.newRow = function () {

		// Constructs row
		var row = [];

		for (var i = 0; i < 8; i++)
		{
			row[i] = "";
		}

		// Adds row to table content
		this.content.push(row);
	};

	// Adds a new cell of entry to the table
	this.addEntry = function (opcode) {

		var row = Math.floor(this.frontindex / this.content.length);
		var column = this.frontindex % 8;

		// Adds entry to the first open spot in the current row
		this.content[row][column] = opcode;

		// Increments front end index
		this.frontindex++;
	};

	// Adds a new cell of entry to the end of the table
	this.addTailEntry = function (opcode) {

		// Gets the index of where in the row the entry should go
		var column = this.tailindex % 8;

		// Gets the index of the row where the entry should go
		var row = Math.floor(this.tailindex / this.content.length);

		// Adds entry to the end of the current row
		this.content[row][column] = opcode;

		// Decrements tailindex
		this.tailindex--;
	};

	// A toString method, to return the op code for processing
	this.toString = function () {

		// String of code to be returned
		finalopcode = "";

		// Step through the table to add all of the values to the string

		// Iterate through rows
		for (var k = 0; k < this.content.length; k++) {
			// Iterate through columns
			for (var m = 0; m < 8; m++) {

				// If the cell is empty, fill with 00
				if (this.content[k][m] == "")
				{ 
					this.content[k][m] = "00";
				}

				finalopcode = finalopcode + " " + this.content[k][m];
			}
		}
	}


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
	};

	// Returns an entry from the table, given its variable name and scope
	this.getEntry = function (varname, scope) {

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

			if (tempentry.variable == varname && tempentry.scope == scope) {

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
	};

	// Returns an entry from the table, given its temp value
	this.getEntry = function (id, scope) {

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

			if ((tempentry.name == id) && (tempentry.scope == scope)) {

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
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

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
	if (isId(value)) { return ["id", true]; }
	else if (isOp(value)) { return ["int", true]; }
	else if (isNumber(value)) { return ["int", false]; }
	else if (value == "true" || value == "false") { return ["boolean", false]; }
	else if (value == "equal?") { return ["boolean", true]}
	else if (value.length > 1) { return "string"; }
	else { return ["MYSTERY", false]; }
}

// Stores an integer to be used for boolean purposes at the beginning of the environment
function setEnvironment () {

	// Adds boolean 0 (false) to the environment
	execEnv.addEntry("A9");	// Load accumulator
	execEnv.addEntry("00");	// Store value 0
	execEnv.addEntry("8D");	// Store accumulator in memory
	execEnv.addEntry("B0");	// Temp location
	execEnv.addEntry("XX");	// BOXX

	// Adds its entry to Static Data table
	staticData.addEntry("B0XX", bool, -1);

}

// Declares an integer in the environment, given its name, Temp address & scope
function declareInt(id, temp, scope) {

	execEnv.addEntry("A9");		// Load accumulator
	execEnv.addEntry("00");		// Store value 0
	execEnv.addEntry("8D");		// Store accumulator in memory
	execEnv.addEntry(temp);	// Temp location
	execEnv.addEntry("XX");		// T#XX

	// Add the int variable to the Static Data table
	staticData.addEntry(temp + "XX", id, scope);

}

// Declares a string in the environment, given its name, Temp address & scope
function declareString(id, temp, scope) {

	// Add string variable to the Heap
	heapData.addEntry(temp + "XX", id, scope);
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
	staticData.addEntry(temp + "XX", id, scope);
}

// Assigns an integer in the environment, given its Temp address (T#) and value
function assignInt(temp, value) {

	// Note: temp here is the full Temp location (T#XX)

	value = fixInt(value);

	execEnv.addEntry("A9");						// Load accumulator
	execEnv.addEntry(value);					// Store value in acc
	execEnv.addEntry("8D");						// Store accumulator in memory
	execEnv.addEntry(temp.substring(0,1));		// Temp location
	execEnv.addEntry(temp.substring(2,3));		// T#XX

}

// Assigns an integer in the environment, given its Temp address (T#), an int and another id
function assignIntId(temp1, value, temp2) {

	// Note: temp here is the full Temp location (T#XX)

	value = fixInt(value);

	execEnv.addEntry("A9");						// Load accumulator with a constant
	execEnv.addEntry(value);					// Store value in acc
	execEnv.addEntry("6D");						// Add value stored in second id
	execEnv.addEntry(temp2.substring(0,1));		// Found at location
	execEnv.addEntry(temp2.substring(2,3));		// T#XX
	execEnv.addEntry("8D");						// Store accumulator in memory
	execEnv.addEntry(temp1.substring(0,1));		// Store at id1's Temp location
	execEnv.addEntry(temp1.substring(2,3));		// T#XX

}

// Assigns a string in the environment, given its Temp address (T#), name, scope and value
function assignString(temp, id, scope, value) {

	execEnv.addTailEntry("00");	// Signifies that the string is done

	// Steps backward through the string value
	// Each value is converted to hex and then added to the end of the environment
	for (var i = value.length - 1; i = 0; i++) {
		var hexChar = value.charCodeAt(i).toString(16).toUpperCase();
		execEnv.addTailEntry(hexChar);
	}

	// The location of the start of the string in the environment
	var stringLoc = execEnv.tailindex.toString(16);

	// Adds string data to the environment
	execEnv.addEntry("AC");
	execEnv.addEntry(stringLoc);
	execEnv.addEntry("8D");
	execEnv.addEntry(temp);
	execEnv.addEntry("XX");

	// Updates the offset in the string's entry in the heap
	heapData.getEntry(id, scope).offset = -(value.length + 1);
}

// Assigns a value to a boolean in the environment, given its Temp (T#), scope & value
function assignBoolean(temp, scope, value) {

	if (value == "false") { value = "00"; }
	else { value == "01"; }

	execEnv.addEntry("A9");		// Load accumulator
	execEnv.addEntry(value);	// Store value 0
	execEnv.addEntry("8D");		// Store accumulator in memory
	execEnv.addEntry(temp);		// Temp location
	execEnv.addEntry("XX");		// T#XX

}

// Assigns a value from one id in the environment to another
function assignId(temp1, temp2) {

	execEnv.addEntry("AD"); 				// Load accumulator from memory
	execEnv.addEntry(temp2.substring(0,1));
	execEnv.addEntry(temp2.substring(2,3));	// Load value at id 2
	execEnv.addEntry("8D"); 				// Store accumulator in memory
	execEnv.addEntry(temp1.substring(0,1));
	execEnv.addEntry(temp1.substring(2,3));	// Store accumulator in id 1

}

// Evaluates Int Expressions with operations and returns the final value
function intExprEval(startnode) {

	// Starting node is the provided node
	var node = startnode;
	// Variable to hold second id to check if necessary
	var id = "";
	// Accumulator, initialized with value of LHS (a digit)
	var acc = parseInt(node.children[0]);

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

			if (startnode.name == "+") { acc+=parseInt(rhsname); }
			else { acc-=parseInt(rhsname); }	
		}
		else {
			// Weird shit is going down
			console.log("Error accumulating intExpr in assign.");
		}

		// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
		node = node.children[1];
	}

	// If no id was found, simply return acc value
	if (id.length == 0) { return acc; }
	// Else return array with acc and id found
	else { return [acc, id]; }
}

// Evaluates equal? statements	*NOTE should pass flags in for things (used for if, while, bools)
function equalEval() {

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

// Steps up through the symbol table looking for the most recent occurrence of given id
// Returns the number (name) of the scope that it was found in
function STscopesearch (node, id) {

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
				return node.scope[i].getType();
			}
		}

		// Move up tree if not found at current scope
		node = node.parent;
	}
}


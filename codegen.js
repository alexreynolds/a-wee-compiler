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
	this.locindex = -1;

	// Current index of last open space in table
	this.tailindex = this.content.length * 8;

	// Number of last row in environment
	// Rows are numbered starting at 0 and alternate between
	//  	index%10 = 0	and		index%10 = 8
	// Each row has 8 columns for data
	// Index 0 in each row contains the row's number in the env
	var rowindex = 0;

	// Adds a new row to the table
	this.newRow = function () {

		// Constructs row
		var row = [rowindex];

		// Adds row to table content
		this.content.push(row);

		// Increment rowindex appropriately
		if (rowindex%10 == 0)
		{
			rowindex = rowindex + 8;
		}
		else
		{
			rowindex = rowindex + 2;
		}
	};

	// Adds a new cell of entry to the table (an op code)
	this.addEntry = function (opcode) {

		// Adds entry to the end of the current row
		this.currRow.push(opcode);

		// If the row has reached maximum length (9), start a new row
		if (this.currRow.length >= 9) {
			var nextrow = this.content.indexOf(this.currRow);
			this.currRow = this.content[nextrow];
		}

		// Increments locindex
		this.locindex++;
	};

	// Adds a new cell of entry to the end of the table
	this.addTailEntry = function (opcode) {

		// Gets the index of where in the row the entry should go
		var position = this.tailindex % 8;

		// Gets the index of the row where the entry should go
		var lastrow = Math.floor(this.tailindex / this.content.length);

		// Adds entry to the end of the current row
		this.content[lastrow][position] = opcode;

		// Decrements tailindex
		this.tailindex--;
	};


}

// Static Data table object
// Holds variable entries
function StaticDataTable () {

	// An array to hold the entries of the Static Data table
	this.entries = [];

	// Holds the index of last entry to be added
	this.currLoc = -1;

	// Adds a new entry to the table
	this.newEntry = function (temp, varname, scope) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp variable
						variable: varname,	// name of variable stored
						scope: scope,		// scope of variable
						offset: 0		// offset of variable
					};

		// increment currLoc appropriately
		currLoc++;

		// Offset of each entry is offset of the previous entry + size of current entry
		// Integers are of size 1, so simply increment previous offset
		if (entries.length > 0) {
			var prevOffset = this.entries[this.currLoc--].offset;
			entry.offset = prevOffset + 1;
		}
		else {
			// A previous entry does not exist, let offset remain 0
		}

		// Adds new entry to entries array
		this.entries.push(entry);
	};

	// Returns a Temp value of an entry from the table, given its var name and scope
	this.getEntry = function (varname, scope) {

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

			if (tempentry.variable == varname && tempentry.scope == scope) {

				return tempentry.temp;
			}

		}
	};

	// Removes an entry from table, given its temp value
	this.removeEntry = function (tempname) {

		var spliceindex;

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

			if (tempentry.temp == tempname) {
				spliceindex = i;
			}

		}

		// Removes object at index spliceindex
		this.entries.splice(spliceindex, 1);
	};

}


// Heap Data table object
// Keeps track of string variables
function HeapDataTable () {

	// An array to hold the entries of the Static Data table
	this.entries = [];

	// Holds the index of last entry to be added
	this.currLoc = -1;

	// Adds a new entry to the table
	this.newEntry = function (temp, varname, scope, offset) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp variable
						variable: varname,	// name of variable stored
						scope: scope,		// scope of variable
						offset: offset		// offset of variable (- length of string)
					};

		// increment currLoc appropriately
		this.currLoc++;

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

// Jumps table object
// Tracks if statements
function JumpsTable () {

	// Array to hold table entries
	this.entries = [];

	// Adds a new entry to the table
	this.newEntry = function (temp, dist) {

		// Constructs entry object
		var entry = { 	temp: temp,			// name of temp variable
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

	// Removes an entry from table, given its temp value
	this.removeEntry = function (tempname) {

		var spliceindex;

		// Finds the index of the entry to remove in the entries array
		for (var i = 0; i < entries.length ; i++) {

			var tempentry = entries[i];

			if (tempentry.temp == tempname) {
				spliceindex = i;
			}

		}

		// Removes object at index spliceindex
		this.entries.splice(spliceindex, 1);
	};
}

// Generates code based on the AST
function codeGen(ast) {

	// Creates the environment for code generation
	var execEnv = new ExecEnv();
	var staticData = new StaticDataTable();
	var heapData = new HeapDataTable();
	var jumpsTable = new JumpsTable();

	// Tracks current scope
	var scopeCounter = -1;

	// Sets current symbol table node to root
	symbolTable.curr = symbolTable.root;

	// Tracks current temp variable number
	// Begins at 0
	var tempAcc = 0;

	// Used to test if a value is a number (ints are stored as strings here)
	function isNumber(n) {
  		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	// In case there are no blocks of code in the AST
	if (ast.root.name !== "block")
	{
		scopeCounter = 0;
	}

	// Traverses the AST and generates code in the process
	// Handles the expansion of the nodes
	function astTraverse(node, depth)
		{

			// If the current node is a leaf
			if (!node.children || node.children.length === 0)
			{


				// THINGS


			}
			// If current node is a branch
			else
			{
				// If a new block of code
				if (node.name == "block"){

					scopeCounter++;

					// Move down to the next scope level
					// Set to the first child by default
					var nextScope = symbolTable.curr.children[0];

					for (var i = 0; i < symbolTable.curr.children.length; i++) {

						if (symbolTable.curr.children[i].scope == scopeCounter)
						{
							nextScope = symbolTable.curr.children[i];
						}
					}

					symbolTable.curr = nextScope;

				}
				// If an id declaration
				else if (node.name == "declare") {

					var id = node.children[1].name;
					var type = node.children[0].name;

					// Construct Temp location
					var temploc = "T";
					var tempnum = tempAcc.toString();
					temploc = temploc.concat(tempnum);	// temploc = "T#"

					// Increment tempAcc
					tempAcc++;

					// If id is of type int
					if (type == "int") {

						// Update execution env

						execEnv.addEntry("A9"); // Load accumulator 
						execEnv.addEntry("00"); // Accumulator loaded with constant = 0
						execEnv.addEntry("8D");	// Store accumulator into memory
						execEnv.addEntry(temploc);
						execEnv.addEntry("XX"); // Store accumulator in Temp loc

						// Add entry to static data table
						staticData.addEntry(temploc.concat("XX"), id, scopelevel);

					}
					// If id is of type string
					else if (type == "string") {

						// Add entry to heap data
						// Offset is 0 because it is unknown what the string is yet
						heapData.addEntry(temploc.concat("XX"), id, scopelevel, 0);

					}
					// If id is of type boolean
					else if (type == "boolean") {

						// *** DO THIS LATER I HAVE NO IDEA
					}

				}
				// If assigning a value
				else if (node.name == "assign") {

					var id = node.children[0].name;	// id to assign value to
					var val = node.children[1].name;	// val to assign to id
					var decid = {}	// Will hold id entry in table for type checking if it has been declared
					var decid2 = {}	// Will hold second id entry (if it exists) in table for type checking if it has been declared
					var tempscope = symbolTable.curr;
					var scopelevel = STsearch(tempscope, id);			// Gets the scope of current id
					var temploc = staticData.getEntry(id, scopelevel);	// Gets the temporary location of the id
					
					// If the val to evaluate is an IntExpr, calculate value of IntExpr
					// then store it in proper temp location
					if (val == "+" || val == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Second id to check if necessary
						var id2 = "";

						// Accumulator, starts at LHS value
						var acc = parseInt(startnode.children[0]);

						// Iterate through RHS to find final id (if it exists)
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id, get its value
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

								id2 = rhsname;

							}
							// Else RHC is a number, update acc
							else if (isNumber(rhsname)) {

								if (startnode.name == "+") { acc+=parseInt(rhsname); }
								else { acc-=parseInt(rhsname); }
								
							}
							else
							{
								// Weird shit is going down
								console.log("Error accumulating intExpr in assign.");
							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}

						// Modify value to be stored so it is a 2 digit number (string)
						if (acc < 10) {
							val = "0".concat(acc.toString());
						}
						else
						{
							val = acc.toString
						}

						// Add to execution environment

						execEnv.addEntry("A9");	// Load accumulator
						execEnv.addEntry(val); 	// Store value in accumulator

						
						// If an id was found
						if (id2.length > 0) {

							// Reset tempscope to current scope
							tempscope = symbolTable.curr;

							var id2Scope = STsearch(tempscope, id2);				// Gets scope level of id2		
							var id2Temploc = staticData.getEntry(id2, id2Scope);	// Gets temp location of id2

							// Add id2 value to accumulator

							execEnv.addEntry("6D");							// Add value from id2 address to accumulator
							execEnv.addEntry(id2Temploc.substring(0,1));
							execEnv.addEntry(id2Temploc.substring(2,3));	// id2 address

						}

						execEnv.addEntry("8D");	// Save accumulator in memory
						execEnv.addEntry(temploc.substring(0,1));	// Store accumulator in temp location
						execEnv.addEntry(temploc.substring(2,3));	// 	T#XX

					}
					// If assignment is of type id = id
					else if (val.length == 1 && !isNumber(val) && !(val == "+" || val == "-")) {

						// Reset tempscope to current scope
						tempscope = symbolTable.curr;

						var valScope = STsearch(tempscope, val);				// Gets scope level of val		
						var valTemploc = staticData.getEntry(val, valScope);	// Gets temp location of val

						// Add to execution environment
						execEnv.addEntry("AD");							// Load accumulator from memory
						execEnv.addEntry(valTemploc.substring(0,1));
						execEnv.addEntry(valTemploc.substring(2,3));	// Temp loc of val
						execEnv.addEntry("8D");							// Store accumulator in id's temp location
						execEnv.addEntry(temploc.substring(0,1));		// id's temp location
						execEnv.addEntry(temploc.substring(2,3));		// T#XX


					}
					// If assignment is of type id = equal? (boolean)
					else if (val == "equal?") {




						///** EVALUATE EQUAL HERE



					}
					// If assignment is of type id = boolval (boolean)
					else if (val == "true" || val == "false") {

						// THINGS

					}
					// If assignment is of type id = int
					else if (isNumber(val)) {

						// Changes val from a string to an int
						val = parseInt(val);

						// Modify value to be stored so it is a 2 digit number (string)
						if (val < 10) {
							val = "0".concat(val.toString());
						}

						// Add to execution environment
						execEnv.addEntry("A9");	// Load accumulator
						execEnv.addEntry(val); 	// Store value in accumulator
						execEnv.addEntry("8D");	// Save accumulator in memory
						execEnv.addEntry(temploc.substring(0,1));	// Store accumulator in temp location
						execEnv.addEntry(temploc.substring(2,3));	// 	TYXX


					}
					// If assignment is of type id = string
					else if (val.length > 1) {

						// Access the heap data entry for the given id and update offset
						heapData.getEntry(temploc).offset = -(val.length + 1);

						// Update execution environment with string at the end
						execEnv.addTailEntry("00");	// Signifies end of string

						// Steps backward through val and adds each char (in hex)
						// to the execution environment end
						for (var i = val.length - 1; i = 0; i--) {
							var charHex = val.charCodeAt(i).toString(16).toUpperCase();
							execEnv.addTailEntry(charHex);
						}

					}
					// Error
					else {

						console.log("Error generating assignment code.");
					}

				}
				// If a print statement
				else if (node.name == "print") {

					// Decrement child counter - one child has been considered
					//childCounter--;

					var id = node.children[0].name;
					var tempscope = symbolTable.curr;
					var scopelevel = STsearch(tempscope, id);			// Gets the scope of current id
					var temploc = staticData.getEntry(id, scopelevel);	// Gets the temporary location of the id
					

					// If the item in the print statement is just an int
					if (isNumber(id) && node.children[0].children.length == 0) {

						var constant = parseInt(id);

						// Makes int a two digit string
						if (constant < 10) {
							constant = "0".concat(constant.toString());
						}
						else {
							constant = constant.toString();
						}

						execEnv.addEntry("A0");		// Load Y register with constant
						execEnv.addEntry(constant);	// Load constant
						execEnv.addEntry("A2");		// Load X register with constant
						execEnv.addEntry("01");		// Load X register with 1
						execEnv.addEntry("FF");		// System call

					}

					// If the item in the print statement is just a string
					if (id.length > 1 && node.children[0].children.length == 0) {
						
						// THINGS

					}

					// If the item in the print statement is an empty string
					if (id.length == 0 && node.children[0].children.length == 0) {
						
						// DO NOTHING, PRINT NOTHING

					}

					// If the item in the print statement is an id
					if (id.length == 1 && node.children[0].children.length == 0) {

						execEnv.addEntry("AC");	// Load Y register with contents of id
						execEnv.addEntry(temploc.substring(0,1));	// At location
						execEnv.addEntry(temploc.substring(2,3));	// temploc
						execEnv.addEntry("A2");	// Load X register with constant
						execEnv.addEntry("01"); // Constant = 1
						execEnv.addEntry("FF");	// System call
					}

					// If the id being printed is an IntExpr
					// Evaluate IntExpr, then print
					if (id == "+" || id == "-") {

						// Starting node is the current id node
						var startnode = node.children[0];
						// Accumulator, initialized to LHS of first level of intExpr
						var acc = parseInt(startnode.children[0].name);
						// Variable to hold an id, if found
						var rhsid = "";

						// Iterate through RHS
						while (startnode.name == "+" || startnode.name == "-") {

							// Get val of LHS of expr
							var lhsval = parseInt(startnode.children[0].name);

							// Adjust accumulator
							if (startnode.name == "+") { acc += lhsval; }
							else { acc -= lhsval; }


							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

								id = rhsname;

							}
							// If RHC is an int
							else if (isNumber(rhsname)) {

								if (startnode.name == "+") { acc += parseInt(rhsname); }
								else { acc -= parseInt(rhsname); }
							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}

							// Makes acc constant a two digit string
							if (acc < 10) {
								acc = "0".concat(acc.toString());
							}
							else {
								acc = acc.toString();
							}
							
							// Update execution environment
							
							execEnv.addEntry("A9");		// Load the accumulator with a constant
							execEnv.addEntry(acc);		// Load acc to accumulator

							// IntExpr contained an id, evaluate its value
							if (rhsid.length > 0) {
								// Reset tempscope to current scope
								tempscope = symbolTable.curr;

								var id2Scope = STsearch(tempscope, id2);				// Gets scope level of id2		
								var id2Temploc = staticData.getEntry(id2, id2Scope);	// Gets temp location of id2

								// Add id2 value to accumulator

								execEnv.addEntry("6D");							// Add value from id2 address to accumulator
								execEnv.addEntry(id2Temploc.substring(0,1));
								execEnv.addEntry(id2Temploc.substring(2,3));	// id2 address
							}

							execEnv.addEntry("8D");		// Store accumulator in memory
							execEnv.addEntry("00");
							execEnv.addEntry("00");		// Store it in location 0000
							execEnv.addEntry("AC");		// Load Y register from memory
							execEnv.addEntry("00");
							execEnv.addEntry("00");		// Load from location 0000
							execEnv.addEntry("A2");		// Load the X register with a constant
							execEnv.addEntry("01");		// Constant = 1
							execEnv.addEntry("FF");		// System call


				}
				// If an IF or WHILE statement
				else if (node.name == "while" || node.name == "if") {

					// THINGS

				}
				// If an equal? statement
				else if (node.name == "equal?") {

					var LHC = node.children[0].name;	// LHC of equal? node
					var RHC = node.children[1].name;	// RHC of equal? node
					//var testLHC = false;	// indicates if theres an if to be checked in the LHC
					//var testRHC = false;	// indicates if theres an if to be checked in the RHC
					var declaredL = false;		// indicates if the id has been declared already
					var declaredR = false;		// indicates if second id (if it exists) has been declared already
					//var decidL = {}	// Will hold id entry in table for type checking if it has been declared
					//var decidR = {}	// Will hold second id entry (if it exists) in table for type checking if it has been declared
					
					var tempscope = symbolTable.curr;

					// If left child is an IntExpr
					if (LHC == "+" || LHC == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Iterate through RHS to find final id (if it exists)/ensure Expr is sound
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If rightmost child is an id
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {
								
								// id = rhsname

							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}

						// THINGS
					}

					// If right child is an IntExpr that needs to be checked for ids
					if (RHC == "+" || RHC == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Iterate through RHS
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id, set it to LHC to be checked
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {
								
								// id = rhsname

							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}


						// THINGS


					}

					// If left child is an id
					if (LHC.length == 1 && !isNumber(LHC) && !(LHC == "+" || LHC == "-"))
					{
						// THINGS
					}
					// If right child is an id
					if (RHC.length == 1 && !isNumber(RHC) && !(RHC == "+" || RHC == "-"))
					{
						// THINGS
					}

					// If left child is a StringExpr or boolVal
					if (LHC.length > 1 || LHC == "true" || LHC == "false")
					{

						// THINGS

					}
					// If right child is a StringExpr or boolVal
					if (RHC.length > 1 || RHC == "true" || RHC == "false") {

						// THINGS
						
					}
					// If left child is an equal? BooleanExpr
					// If right child is an equal? BooleanExpr


				}
				// If an op
				else if (node.name == "+" || node.name == "-")
				{
					// Presumably do nothing
					// Though I am not 100% sure

				}

				// Recursive expansion
				for (var j = 0; j < node.children.length; j++)
				{
					astTraverse(node.children[j], depth + 1);

					// Once a block is done being recursively expanded, step up a level in the symbol table
					if (node.name == "block" && j == node.children.length - 1) {

						symbolTable.curr = symbolTable.curr.parent;

					}
				}

			}
		


	};
		

	// Initial call to astTraverse from the root
	// Creates the symbol table and type checks as it goes
	astTraverse(ast.root, 0);

}


// Goes up through the symbol table looking for the most recent
// occurrence of a given id
function STsearch (startnode, id) {

	var found = false;

	while (startnode.parent !== undefined && !found) {
		
		// Check this scope to see if id has already been declared
		for (var i = 0; i < startnode.ids.length; i++)
		{
			var currid = startnode.ids[i].getID();

			if (currid == id) {
				found = true;
				return startnode.scope;
			}
		}

		// Move up tree if not found at current scope
		startnode = startnode.parent;
	}
}


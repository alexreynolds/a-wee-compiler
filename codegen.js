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

	// Points to the row currently being edited in table
	this.currRow = {};

	// Current index of last added cell
	this.locindex = -1;

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

		// Changes currRow to new row
		var loc = this.content.indexOf(row);
		this.currRow = this.content[loc];

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
			this.newEntry();
		}

		// Increments locindex
		this.locindex++;
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
	var currScope = -1;

	// Sets current symbol table node to root
	symbolTable.curr = symbolTable.root;

	// Tracks current temp variable number
	// Begins at 0
	var tempAcc = 0;

	// Used to test if a value is a number (ints are stored as strings here)
	function isNumber(n) {
  		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	// === SET UP ENVIRONMENT ===

	execEnv.addEntry("A9"); // Load accumulator 
	execEnv.addEntry("00"); // Accumulator loaded with constant = 0
	execEnv.addEntry("8D");	// Store acc into memory
	//execEnv.addEntry("T0");	// Acc stored in loc Temp0
	//execEnv.addEntry("XX");	// Denoted as T0XX

	// In case there are no blocks of code in the AST
	if (ast.root.name !== "block")
	{
		currScope = 0;
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

					currScope++;

					// Moves symbol table pointer down a scope
					// RETHINK THIS
					symbolTable.curr = symbolTable.curr.child[0];

				}
				// If an id declaration
				else if (node.name == "declare") {

					var id = node.children[1].name;
					var type = node.children[0].name;

					// If id is of type int
					if (type == "int") {

						// Construct Temp location
						var temp = "T";
						var tempnum = tempAcc.toString();
						temp = temp.concat(tempnum);	// temp = "TX"

						// Store accumulator in Temp loc
						execEnv.addEntry(temp);
						execEnv.addEntry("XX");
						// Add entry to static data table
						staticData.addEntry(temp.concat("XX"), id, currScope);
					}

				}
				// If assigning a value
				else if (node.name == "assign") {

					var id = node.children[0].name;	// id to assign value to
					var val = node.children[1].name;	// val to assign to id
					var decid = {}	// Will hold id entry in table for type checking if it has been declared
					var decid2 = {}	// Will hold second id entry (if it exists) in table for type checking if it has been declared
					
					var tempscope = symbolTable.curr;
					
					// If the val to evaluate is an IntExpr, calculate value of IntExpr
					// then store it in proper temp location
					if (val == "+" || val == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Second id to check if necessary
						var id2;

						// Accumulator, starts at LHS value
						var acc = parseInt(startnode.children[0]);

						// Iterate through RHS to find final id (if it exists)
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id, set it to id to be checked
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

								id2 = rhsname;

								// *** FIGURE OUT HOW TO CHECK THE VALUE OF THE ID
								// 		THEN ADD IT TO THE ACC

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

							
							var tempscope = symbolTable.curr;
							var scopelevel = 0;
							var found = false;

							// Runs up symbol table tree to find most recent id declaration
							while (tempscope.parent !== undefined && !found) {

								// Check this scope to see if id has already been declared
								for (var i = 0; i < tempscope.ids.length; i++)
								{
									var currid = tempscope.ids[i].getID();

									if (currid == id) {
										found = true;
										scopelevel = tempscope.scope;
									}
								}

								tempscope = tempscope.parent;
							}

							// Gets the temporary location of the id
							var temploc = staticData.getEntry(id, scopelevel);

							// Modify value to be stored so it is a 2 digit number (string)
							if (acc < 10) {
								val = "0".concat(acc.toString());
							}
							else
							{
								val = acc.toString
							}

							execEnv.addEntry("A9");	// Load accumulator
							execEnv.addEntry(val); 	// Store value in accumulator
							execEnv.addEntry("8D");	// Save accumulator in memory
							execEnv.addEntry(temploc.substring(0,1));
							execEnv.addEntry(temploc.substring(2,3));	// Store accumulator in temp location



						}

						// If assignment is of type id = id
						else if (val.length == 1 && !isNumber(val) && !(val == "+" || val == "-")) {

							// THINGS

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

							// THINGS


						}
						// If assignment is of type id = string
						else if (val.length > 1) {

							// Note that the id has been initialized
							decid.initialized = true;

						}
						// Error
						else {

							// WHO KNOWS?
						}

				}
				// If a print statement
				else if (node.name == "print") {

					// Decrement child counter - one child has been considered
					//childCounter--;

					var id = node.children[0].name;
					var tempscope = symbolTable.curr;

					// If the item in the print statement is just an int
					if (isNumber(id) && node.children[0].children.length == 0) {

						// THINGS

					}

					// If the item in the print statement is just a string
					if (id.length > 1 && node.children[0].children.length == 0) {
						
						// THINGS

					}

					// If the item in the print statement is an empty string
					if (id.length == 0 && node.children[0].children.length == 0) {
						
						// THINGS

					}

					// If the id being printed is an IntExpr
					if (id == "+" || id == "-") {

						// Starting node is the current id node
						var startnode = node.children[0];

						// Iterate through RHS
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

								id = rhsname;

							}
							// If RHC is an int
							else if (isNumber(rhsname)) {


							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}
					
						// THINGS

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
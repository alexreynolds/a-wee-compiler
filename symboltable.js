/*

Alex Reynolds
CMPU-331
Final Project

symboltable.js

	- Contains Symbol object representation
	- Contains SymbolTable object representation
	- Builds the symbol table given the AST
*/

// SYMBOL OBJECT FOR INSERTING INTO TREE
function Symbol(id, type, index, scope) {
	this.id = id;
	this.type = type;
	this.scope = scope;
	this.used = false;	// Tracks if id was used after declaration
	this.initialized = false;


	// Returns the id name
	this.getID = function getID() {
		return this.id.toString();
	};

	// Returns the id type
	this.getType = function getType() {
		return this.type.toString();
	};
}

// SYMBOL TABLE OBJECT REPRESENTATION
function SymbolTable() {

	// The root of the tree, initialized to null
	this.root = null;

	// The current node of tree being built
	this.curr = {};

	// Accumulator to number scopes
	var scopeAcc = 0;

	// Add a scope node
	this.addScope = function() {

		// Construct node object
		var node = { 	//name: name,		// name of scope node
						children: [],	// array of children
						parent: {},		// parent of node
						ids: [],			// Array of ids contained in scope
						scope: 0		// Number of scope (relatively arbitrary)
					};

		// Checks to see if this node should be tree root
		if ((this.root == null) || (!this.root))
		{
			// No root yet exists
			// Make this node the root
			this.root = node;
		}
		else
		{
			// Root exists, new node is a child

			// Make current node the parent of new node
			node.parent = this.curr;

			node.scope = scopeAcc;

			// Add new node to children array of current node
			this.curr.children.push(node);
		}

		// Sets current scope to new node
			this.curr = node;
		// Increment scopeAcc
			scopeAcc++;

	};

	// If done with a branch of the tree
	this.endChildren = function() {

		// Move up (back) to the parent node, if possible
		if ((this.curr.parent !== null) && (this.curr.parent.name !== undefined))
		{
			this.curr = this.curr.parent;
		}
		else
		{
			// Error
			putMessage("FYI TRYING TO TRAVERSE THE TREE BUT THERE ARE SOME SAD PARENTLESS ORPHAN NODES MESSING THINGS UP.");
		}
	};


	// Return a string representation of the tree
	this.toString = function() {

		// The result string to be returned
		var stString = "";	

		// Handles the expansion of the nodes
		function expand(node, depth)
		{
			// Spaces things out with tabs based on current depth
			for (var i = 0; i < depth; i++)
			{
				stString += "  ";
			}

			// If the node is a leaf
			if (!node.children || node.children.length === 0)
			{
				stString = stString + "Scope " + depth + "\n";

				// Print out all the ids in the scope level
				for (var i = 0; i < node.ids.length; i++)
				{
					// Spaces things out based on current depth
					for (var d = 0; d < depth + 1; d++)
					{
						stString += "  ";
					}

					var idname = node.ids[i].getID();
					var idtype = node.ids[i].getType();

					stString += idname + " | " + idtype;
					stString += "\n";
				
				}
				
			}
			// If there are children, note interior branch nodes & expand them
			else
			{
				stString = stString + "Scope " + depth + "\n";

				// If there are ids in the scope, print them out
				if (node.ids)
				{
					// Print out all the ids in the scope level
					for (var i = 0; i < node.ids.length; i++)
					{
						// Spaces things out based on current depth
						for (var d = 0; d < depth + 1; d++)
						{
							stString += "  ";
						}

						var idname = node.ids[i].getID();
						var idtype = node.ids[i].getType();

						stString += idname + " | " + idtype;
						stString += "\n";
					}
				}

				// Recursive expansion
				for (var j = 0; j < node.children.length; j++)
				{
					expand(node.children[j], depth + 1);
				}
			}
		}

		// Initial call to expand from the root
		expand(symbolTable.root, 0);

		// Returns result string
		return stString;
	};

}



// Constructs the symbol table, given an AST
// 	Type checks the statements as it constructs
function buildSymbolTable(ast) {

	//var childCounter = -1;	// Tracks the number of children to be considered

	// Used to test if a value is a number (ints are stored as strings here)
	function isNumber(n) {
  		return !isNaN(parseFloat(n)) && isFinite(n);
	}


	// In case there are no blocks of code in the AST
	if (ast.root.name !== "block")
	{
		symbolTable.addScope();
	}

	// Walks through the AST to build up the symbol table
	// Handles the expansion of the nodes
	function astWalk(node, depth)
		{

			// If the node is a leaf
			if (!node.children || node.children.length === 0)
			{
				// Do nothing
			}
			// If node is a branch
			// If there are children, note interior branch nodes & expand them
			else
			{
				// If a new block of code, make a new level of scope in symbol table
				if (node.name == "block"){

					symbolTable.addScope();

				}
				// If an id declaration, make a new symbol table entry at current scope
				else if (node.name == "declare") {

					// Decrement child counter - one child has been considered
					//childCounter--;

					var id = node.children[1].name;
					var type = node.children[0].name;
					var declared = false;

					// Check to ensure id is not already declared in scope
					for (var i = 0; i < symbolTable.curr.ids.length; i++)
					{
						var currid = symbolTable.curr.ids[i].getID();

						if (currid == id) {
							// id has already been declared in current scope
							putMessage("ERROR EINSTEIN YOU CAN'T REDECLARE VARIABLES IN THE SAME SCOPE, DUH.");
							errorCount++;
							declared = true;
						}
					}

					// If the id has not yet been declared in scope, add to this scope's id array
					if (!declared)
					{
						var tempid = new Symbol(id, type, depth, false, false);
						symbolTable.curr.ids.push(tempid);
					}

				}
				// If assigning a value (initializing the id)
				else if (node.name == "assign") {

					// Decrement child counter - one child has been considered
					//childCounter--;

					var id = node.children[0].name;	// id to assign value to
					var val = node.children[1].name;	// val to assign to id
					var declared = false;		// indicates if the id has been declared already
					var declared2 = false;		// indicates if second id (if it exists) has been declared already
					var decid = {}	// Will hold id entry in table for type checking if it has been declared
					var decid2 = {}	// Will hold second id entry (if it exists) in table for type checking if it has been declared
					
					var tempscope = symbolTable.curr;

					// Runs up symbol table tree to check if id has been declared in
					// 	current scope as well as parent scopes
					while (tempscope.parent !== undefined && !declared) {

						// Check this scope to see if id has already been declared
						for (var i = 0; i < tempscope.ids.length; i++)
						{
							var currid = tempscope.ids[i].getID();

							if (currid == id) {
								declared = true;
								decid = tempscope.ids[i];
							}
						}

						tempscope = tempscope.parent;
					}

					// If the RHS of assignment is an id, check to ensure it's been declared
					/*if (val.length == 1 && !isNumber(val) && !(val == "+" || val == "-")) {
						tempscope = symbolTable.curr;

						// Runs up symbol table tree to check if id has been declared in
						// 	current scope as well as parent scopes
						while (tempscope.parent !== undefined && !declared2) {

							// Check this scope to see if id has already been declared & initialized
							for (var i = 0; i < tempscope.ids.length; i++)
							{
								var currid = tempscope.ids[i];

								if (currid.getID() == val) {
									declared2 = true;
									
									// If the id has not yet been initialized, issue a warning
									if (currid.initialized == false) {
										putMessage("WARNING YOU ARE TRYING TO OPERATE ON " + currid.id + " BUT IT HAS NOT BEEN INITIALIZED.");
									}

									decid2 = tempscope.ids[i];
								}
							}

							tempscope = tempscope.parent;
						}
					}
					*/

					// If the id has been declared
					if (declared)
					{
						// If the val to evaluate is an IntExpr
						if (val == "+" || val == "-")
						{
							// Starting node is the current id node
							var startnode = node.children[1];
							// Second id to check if necessary
							var id2;

							// Iterate through RHS to find final id (if it exists)/ensure Expr is sound
							while (startnode.name == "+" || startnode.name == "-") {

								// Get right hand child node
								var rhsname = startnode.children[1].name;
								console.log("RHS: " + rhsname);

								// If RHC is an id, set it to id to be checked
								if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {
									id2 = rhsname;
									console.log("RHC id: " + val);

								}
								// If RHC is a string, error
								else if (!isNumber(rhsname) && rhsname.length > 1) {

									putMessage("ERROR YOU CANNOT SLIP STRINGS INTO YOUR INT EXPRESSIONS.");
									errorCount++;

								}

								// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
								startnode = startnode.children[1];
							}

							// If the last RHC is an id, check to ensure it has been declared and initialized
							if (id2) {

								console.log("id: " + id2);

								tempscope = symbolTable.curr;

								// Runs up symbol table tree to check if id has been declared in
								// 	current scope as well as parent scopes
								while (tempscope.parent !== undefined && !declared2) {

									// Check this scope to see if id has already been declared & initialized
									for (var i = 0; i < tempscope.ids.length; i++)
									{
										var currid = tempscope.ids[i];

										if (currid.getID() == val) {
											declared2 = true;
											
											// If the id has not yet been initialized, issue a warning
											if (currid.initialized == false) {
												putMessage("WARNING YOU ARE TRYING TO OPERATE ON " + currid.id + " BUT IT HAS NOT BEEN INITIALIZED.");
											}
										}
									}

									tempscope = tempscope.parent;
								}

								// If the id has not yet been declared, error
								if (!declared2) {
									putMessage("ERROR YOU ARE TRYING TO OPERATE ON " + currid.id + " BUT IT DOESN'T EXIST YET YOU NINNY.");
									errorCount++;
								}

							}

							// If id receiving assignment is not of type int, error
							if (decid.getType() !== "int") {
								putMessage("ERROR YOU ARE TRYING TO MATCH AN INT EXPRESSION TO TYPE " + decid.getType() + ", NO.");
								errorCount++;
							}
							else {

								// Note that the id has been initialized
								decid.initialized = true;
							}


						}
						// If assignment is of type id = id
						else if (val.length == 1 && !isNumber(val) && !(val == "+" || val == "-")) {

							tempscope = symbolTable.curr;

							// Runs up symbol table tree to check if id has been declared in
							// current scope as well as parent scopes
							while (tempscope.parent !== undefined && !declared2) {

								// Check this scope to see if id has already been declared & initialized
								for (var i = 0; i < tempscope.ids.length; i++)
								{
									var currid = tempscope.ids[i];

									if (currid.getID() == val) {
										declared2 = true;
										
										// If the id has not yet been initialized, issue a warning
										if (currid.initialized == false) {
											putMessage("WARNING YOU ARE TRYING TO OPERATE ON " + currid.id + " BUT IT HAS NOT BEEN INITIALIZED.");
										}

										decid2 = tempscope.ids[i];
									}
								}

								tempscope = tempscope.parent;
							}

							// If the id types match, success
							if (decid.getType() == decid2.getType()) {

								// Note that the id has been initialized
								decid.initialized = true;

							}
							// If the second id has not been declared, warning
							else if (!declared2) {
								putMessage("ERROR UNDECLARED IDENTIFIER UP IN YOUR ASSIGNMENT STATEMENT.");
								errorCount++;
							}
							// Else id types do not match, error
							else {
								putMessage("ERROR YOU HAVE A TYPE MISMATCH UP IN THIS JOINT.");
								putMessage("YOU'RE TRYING TO MATCH ID " + decid.id + " OF TYPE " + decid.getType() + " TO TYPE " + decid2.getType() + ".");
								putMessage("IS IT THAT HARD TO INITIALIZE STRINGS TO STRINGS AND INTS TO INTS? JESUS.");

								errorCount++;

							}

						}
						// If assignment is of type id = equal? (boolean)
						else if (val == "equal?") {




							///** TEST FOR EQUAL VARIABLES HERE





							if (decid.getType() == "boolean") {

								// Note that the id has been initialized
								decid.initialized = true;
							}
							// Else error type mismatch
							else {
								putMessage("ERROR MAYDAY MAYDAY TYPE MISMATCH HERE.");
								putMessage("NO YOU CANNOT MATCH A " + decid.getType() + " TO A BOOLEAN ARE YOU MENTALLY ILL?");
								errorCount++;
							}
						}
						// If assignment is of type id = boolval (boolean)
						else if (val == "true" || val == "false") {

							// If decid is of type boolean, success
							if (decid.getType() == "boolean") {

								// Note that the id has been initialized
								decid.initialized = true;
							}
							// Else error type mismatch
							else {
								putMessage("ERROR MAYDAY MAYDAY TYPE MISMATCH HERE.");
								putMessage("NO YOU CANNOT MATCH A " + decid.getType() + " TO A BOOLEAN ARE YOU MENTALLY ILL?");
								errorCount++;
							}
						}
						// If assignment is of type id = int
						else if (isNumber(val)) {

							// If decid is of type int, success
							if (decid.getType() == "int") {

								// Note that the id has been initialized
								decid.initialized = true;

							}
							// Else error, type mismatch
							else {
								putMessage("ERROR YOU HAVE A TYPE MISMATCH UP IN THIS JOINT.");
								putMessage("YOU'RE TRYING TO MATCH A " + decid.getType() + " TO AN INT WHICH IS OBVIOUSLY WRONG.");
								putMessage("IS IT THAT HARD TO INITIALIZE STRINGS TO STRINGS AND INTS TO INTS? JESUS.");

								errorCount++;
							}
						}
						// If assignment is of type id = string
						else if (typeof val == 'string' && decid.getType() == "string") {

							// Note that the id has been initialized
							decid.initialized = true;

						}
						// Type of assignment value and id are not the same, error
						else {

							var valtype = "";

							if (!isNumber(val)){
								valtype = "string";	
							}
							else {
								valtype = "int";
							}

							putMessage("ERROR YOU HAVE A TYPE MISMATCH UP IN THIS JOINT.");
							putMessage("YOU'RE TRYING TO MATCH ID OF TYPE " + decid.getType() + " TO TYPE " + valtype + ".");
							putMessage("IS IT THAT HARD TO INITIALIZE STRINGS TO STRINGS AND INTS TO INTS? JESUS.");

							errorCount++;
						}
						
					}
					// If the id has not been declared, warning
					else
					{
						putMessage("WARNING UNDECLARED IDENTIFIER YOU CAN'T ASSIGN THINGS TO THINGS THAT DON'T EXIST");

					}

				}
				// If a print statement
				else if (node.name == "print") {

					// Decrement child counter - one child has been considered
					//childCounter--;

					var id = node.children[0].name;
					var declared = false;
					var init = false;
					var tempscope = symbolTable.curr;

					// If the item in the print statement is just an int, do nothing and return
					if (isNumber(id) && node.children[0].children.length == 0) {
						return;
					}

					// If the item in the print statement is just a stringexpr, do nothing and return
					if (id.length > 1 && node.children[0].children.length == 0) {
						return;
					}

					// If the item in the print statement is an empty string, do nothing and return
					if (id.length == 0 && node.children[0].children.length == 0) {
						return;
					}

					// If the id being checked is an IntExpr
					if (id == "+" || id == "-") {

						// Starting node is the current id node
						var startnode = node.children[0];
						console.log("START: " + startnode.name);

						// Iterate through RHS to find final id/ensure it is sound
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;
							console.log("RHC: " + rhsname);

							// If RHC is an id, set it to id to be checked
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {

								id = rhsname;

							}
							// If RHC is an int
							else if (isNumber(rhsname)) {
								id = rhsname;
								// Sets variables to true so program isn't tripped up
								declared = true;
								init = true;
							}
							// If RHC is a string, error
							else if (!isNumber(rhsname) && rhsname.length > 1) {

								putMessage("ERROR YOU CANNOT SLIP STRINGS INTO YOUR INT EXPRESSIONS.");
								putMessage("HIDING THEM IN YOUR PRINT EXPRESSIONS WILL NOT HELP.");
								errorCount++;

							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}
					}

					// Runs up symbol table tree to check if id has been declared and initialized
					// 	in this scope or parent scopes
					while (tempscope.parent !== undefined && !declared) {

						// Check this scope to see if id has already been declared
						for (var i = 0; i < tempscope.ids.length; i++)
						{
							var currid = tempscope.ids[i].getID();

							//console.log("\tcurrid = " + currid);

							if (currid == id) {
								declared = true;
								if (tempscope.ids[i].initialized) {
									init = true;
								}
							}
						}

						tempscope = tempscope.parent;
					}

					// If the id has not yet been declared, warning
					if (!declared) {
						putMessage("ERROR IDENTIFIER " + id + " HAS NOT BEEN DECLARED, HOW CAN YOU PRINT NONEXISTENT IDS?");
						errorCount++;
					}
					// If the id has not yet been initialized, warning
					else if (!init) {
						putMessage("WARNING UNINITIALIZED VARIABLE " + id + ", HOW ARE YOU SUPPOSED TO PRINT NOTHING?");
					}
					// Else, all is well
					else {
						// Do nothing
					}

				}
				// If an IF or WHILE statement
				else if (node.name == "while" || node.name == "if") {

					// Do nothing, nothing to add to ST or type check

				}
				// If an equal? statement
				else if (node.name == "equal?") {

					// Equal? does not have to be type checked
					//	Must only check to ensure variables within expressions are declared/initialized

					var LHC = node.children[0].name;	// LHC of equal? node
					var RHC = node.children[1].name;	// RHC of equal? node
					//console.log("LHC: " + LHC + "\tRHC: " + RHC);
					var testLHC = false;	// indicates if theres an if to be checked in the LHC
					var testRHC = false;	// indicates if theres an if to be checked in the RHC
					var declaredL = false;		// indicates if the id has been declared already
					var declaredR = false;		// indicates if second id (if it exists) has been declared already
					//var decidL = {}	// Will hold id entry in table for type checking if it has been declared
					//var decidR = {}	// Will hold second id entry (if it exists) in table for type checking if it has been declared
					
					var tempscope = symbolTable.curr;

					// If left child is an IntExpr that needs to be checked for ids
					if (LHC == "+" || LHC == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Iterate through RHS to find final id (if it exists)/ensure Expr is sound
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id, set it to LHC to be checked
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {
								LHC = rhsname;
								testLHC = true;
								//console.log("MUST CHECK LHC: " + LHC);

							}
							// If RHC is a string, error
							else if (!isNumber(rhsname) && rhsname.length > 1) {

								putMessage("ERROR YOU CANNOT SLIP STRINGS INTO YOUR INT EXPRESSIONS.");
								errorCount++;

							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}

						console.log("LHC: " + LHC);
					}

					// If right child is an IntExpr that needs to be checked for ids
					if (RHC == "+" || RHC == "-")
					{
						// Starting node is the current id node
						var startnode = node.children[1];

						// Iterate through RHS to find final id (if it exists)/ensure Expr is sound
						while (startnode.name == "+" || startnode.name == "-") {

							// Get right hand child node
							var rhsname = startnode.children[1].name;

							// If RHC is an id, set it to LHC to be checked
							if (!isNumber(rhsname) && rhsname.length == 1 && !(rhsname == "+" || rhsname == "-")) {
								RHC = rhsname;
								testRHC = true;
								//console.log("MUST CHECK RHC: " + RHC);

							}
							// If RHC is a string, error
							else if (!isNumber(rhsname) && rhsname.length > 1) {

								putMessage("ERROR YOU CANNOT SLIP NON-INTS INTO YOUR INT EXPRESSIONS.");
								errorCount++;

							}

							// Next node to check is the RHC of curr node (because LHS must be a digit by grammar)
							startnode = startnode.children[1];
						}

						console.log("RHC: " + RHC);
					}

					// If left child is an id
					if (LHC.length == 1 && !isNumber(LHC) && !(LHC == "+" || LHC == "-"))
					{
						// Note that LHC is an id and must be checked
						testLHC = true;
					}
					// If right child is an id
					if (RHC.length == 1 && !isNumber(RHC) && !(RHC == "+" || RHC == "-"))
					{
						// Note that RHC is an id and must be checked
						testRHC = true;
					}

					// If left child is a StringExpr or boolVal
					if (LHC.length > 1 || LHC == "true" || LHC == "false")
					{

						// Do nothing, no ids to check

					}
					// If right child is a StringExpr or boolVal
					if (RHC.length > 1 || RHC == "true" || RHC == "false") {

						// Do nothing, no ids to check
						
					}
					// If left child is an equal? BooleanExpr
					// If right child is an equal? BooleanExpr
					

					// If necessary, runs up symbol table tree to check if id in LHC has been declared in
					// 	current scope or parent scopes
					while (testLHC && tempscope.parent !== undefined && !declaredL) {

						// Check this scope to see if id has already been declared
						for (var i = 0; i < tempscope.ids.length; i++)
						{
							var currid = tempscope.ids[i].getID();

							if (currid == LHC) {
								declaredL = true;

								// If the id has not yet been initialized, issue a warning
								if (currid.initialized == false) {
										putMessage("WARNING YOU ARE TRYING TO TEST " + currid.id + " BUT IT HAS NOT BEEN INITIALIZED.");
								}

								//decidL = tempscope.ids[i];
							}
						}

						tempscope = tempscope.parent;
					}

					// If the RHC of assignment contains an id, check to ensure it's been declared
					tempscope = symbolTable.curr;

					// If necessary, runs up symbol table tree to check if id in RHC has been declared in
					// 	current scope or parent scopes
					while (testRHC && tempscope.parent !== undefined && !declaredR) {

						// Check this scope to see if id has already been declared & initialized
						for (var i = 0; i < tempscope.ids.length; i++)
						{
							var currid = tempscope.ids[i];

							if (currid.getID() == RHC) {
								declaredR = true;
								
								// If the id has not yet been initialized, issue a warning
								if (currid.initialized == false) {
									putMessage("WARNING YOU ARE TRYING TO TEST " + currid.id + " BUT IT HAS NOT BEEN INITIALIZED.");
								}

								//decidR = tempscope.ids[i];
							}
						}

						tempscope = tempscope.parent;
					}

					// If the id has been declared
					if (!declaredL || !declaredR)
					{
						putMessage("UNDECLARED VARIABLE ERROR. YOU'RE TESTING THINGS THAT DON'T EXIST, FAILURE FOR YOU.");

						if (!declaredL) {
							putMessage("VARIABLE " + LHC + " DOES NOT EXIST YET, SO DON'T TRY USING IT.");
						}
						if (!declaredR) {
							putMessage("VARIABLE " + RHC + " DOES NOT EXIST YET, SO DON'T TRY USING IT.");
						}

						errorCount++;
					}

				}
				// If an op
				else if (node.name == "+" || node.name == "-")
				{
					// Do nothing

				}

				// Recursive expansion
				for (var j = 0; j < node.children.length; j++)
				{
					astWalk(node.children[j], depth + 1);

					// Once a block is done being recursively expanded, step up a level in the symbol table
					if (node.name == "block" && j == node.children.length - 1) {

						symbolTable.curr = symbolTable.curr.parent;
					}
				}

			}
		


	};
		

	// Initial call to astWalk from the root
	// Creates the symbol table and type checks as it goes
	astWalk(ast.root, 0);

}


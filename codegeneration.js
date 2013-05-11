// Generates code based on the AST
function codeGeneration(ast) {

	// Sets current symbol table node to root
	symbolTable.curr = symbolTable.root;
	// Tracks current scope
	var scopeCounter = 0;

	// Tracks current temp variable number
	// Begins at 0
	var tempAcc = 0;
	var jumpAcc = 0;
	// Flags for items requiring multiple levels of analyzing
	// The variables hold the Temp locations of the items that must be updated
	var boolEqualFlag = false;
	var intExprFlag = false;
	var ifwhileFlag = false;



	// Steps through the AST, starting at the root of the tree
	function astWalkthrough(node, depth)
	{
		// If the current node is a leaf
		if (!node.children || node.children.length === 0)
		{
			// Do nothing
		}
		// If the current node is a branch
		else
		{
			// NODE = BLOCK
			if (node.name == "block")
			{
				// Increate scopeCounter
				scopeCounter++;

				// If not in the correct scope in the symbol table, find the correct one
				if (symbolTable.curr.scope !== scopeCounter)
				{
					for (var i = 0; i < symbolTable.curr.children.length; i++)
					{
						if (symbolTable.curr.children[i].scope = scopeCounter) {
							symbolTable.curr = symbolTable.curr.children[i];
						}
					}
				}
			}
			// NODE = DECLARE
			else if (node.name == "declare")
			{
				var nodetype = node.children[0].name;
				var id = node.children[1].name;
				var temp = "T" + tempAcc;
				tempAcc++;

				if (nodetype == "int") {
					declareInt(id, temp, symbolTable.curr.scope);
				}
				else if (nodetype == "string") {
					declareString(id, temp, symbolTable.curr.scope);
				}
				else if (nodetype == "boolean") {
					declareBoolean(id, temp, symbolTable.curr.scope);
				}
			}
			// NODE = ASSIGN
			else if (node.name == "assign")
			{
				var id = node.children[0].name;
				var value = node.children[1].name;
				// Boolean indicating if the value is an id also
				var secondId = isId(value);
				// Gets the type assignment from most recent declaration in sym table
				var type = STtypesearch(symbolTable.curr, id);
				// Gets the scope value from most recent declaration in sym table
				var scope = STscopesearch(symbolTable.curr, id);

				// If id is an int
				if (type == "int" && !secondId) {

					// If value is an IntExpr
					if (isOp(value)) {
						// Evaluate the operations
						var newval = intExprEval(node.children[1]);
						// Operations contained a id, newval = [acc, id]
						if (!isNumber(newval)) {
							// id must be evaluated with the int
							var scope2 = STscopesearch(symbolTable.curr, newval[1]);
							var temp2 = staticData.getEntry(newval[1], scope2);
							assignIntId(temp, acc, temp2);
						}
						else {
							// Normal int assignment with newval as value
							var temp = staticData.getEntry(id, scope).temp;
							assignInt(temp, scope, newval);
						}
					}
					// Else normal int assignment
					else {
						var temp = staticData.getEntry(id, scope).temp;
						assignInt(temp, value);
					}
				}
				// If id is a string
				else if (type == "string" && !secondId) {

					var temp = heapData.getEntry(id, scope);
					assignString(temp, id, scope, value);
				}
				// If id is a boolean
				else if (type == "boolean" && !secondId) {

					var temp = staticData.getEntry(id, scope).temp;

					if (value == "equal?") {
						// It will be dealt with next walkthrough
						// Temp location of current boolean id flagged
						boolEqualFlag = temp;
					}
					// Value is a boolVal
					else {
						assignBoolean(temp, scope, value);
					}
				}
				// If value is an id
				else if (secondId) {

					// Scope of second id
					var scope2 = STscopesearch(symbolTable.curr, value);

					if (type == "string") {
						var temp2 = heapData.getEntry(value, scope2).temp;
					}
					else {
						var temp2 = staticData.getEntry(value, scope2).temp;
					}

					assignId(temp, temp2);
				}
				// Catch
				else { console.log("Error, wacky things going on with assign codegen."); }
			}
			// NODE = EQUAL
			else if (node.name == "equal?")
			{
				var leftchild = node.children[0].name;
				var rightchild = node.children[1].name;
				var id1 = "";
				var id2 = "";				// Variables to hold potential findings
				var lefttemp = false;
				var righttemp = false;

				// Checks if LHC is an id
				if (isId(leftchild)) {
					id1 = leftchild;
					// Gets the temp location of LHC
					var leftscope = STscopeesearch(symbolTable.curr, id1);
					lefttemp = staticData.getEntry(id1, leftscope).temp;
				}

				// Checks if RHC is an id
				if (isId(rightchild)) {
					id2 = rightchild;
					// Gets the temp location of RHC
					var rightscope = STscopeesearch(symbolTable.curr, id2);
					righttemp = staticData.getEntry(id2, rightscope).temp;
				}

				// If LHC or RHC is an IntExpr, eval and save value to LHC/RHC
				// *** CURRENTLY ASSUMES NO ID IN INTEXPR BECAUSE I CAN'T DO THAT RIGHT NOW ***
				if (checkType(leftchild) == "int" && isOp(leftchild)) {
					leftchild = intExprEval(node.children[0]);

					if (leftchild instanceof Array) { console.log("HALP: LHS of equal contains an id to evaluate."); }
				}
				else if (checkType(rightchild) == "int" && isOp(rightchild)) {
					rightchild = intExprEval(node.children[1]);

					if (rightchild instanceof Array) { console.log("HALP: RHS of equal contains an id to evaluate."); }
				}
				
				// Evaluate equal?
				equalEval(leftchild, rightchild, lefttemp, righttemp, boolEqualFlag, jumpAcc);

				// Reset flag
				if (boolEqualFlag) { boolEqualFlag = false; }
				// Increment jump accumulator
				jumpAcc++;
			}
			// NODE = PRINT
			else if (node.name == "print")
			{
				// Item to be printed
				var value = node.children[0].name;
				var type = "";
				var temp = "";

				// If value is id
				if (isId(value)) {
					// Gets the scope value from most recent declaration in sym table
					var scope = STscopesearch(symbolTable.curr, id);
					// See if value is in Static or Heap data (int or string)
					var table = tableSearch(value);
					if (table == "heap") {
						type = "string";
						temp = heapData.getEntry(value, scope).temp;
					}
					else { 
						type = "int";
						temp = staticData.getEntry(value, scope).temp;
					}

					printId(temp, type);
				}
				// If value is int
				else if (checkType(value) == "int") {
					// If value is an int expression
					if (isOp(value)) {
						// Evaluate the operations
						var newvalue = intExprEval(node.children[1]);
						// Operations contained a id, newval = [acc, id]
						if (!isNumber(newvalue)) {

							// id must be evaluated with the int
							var scope = STscopesearch(symbolTable.curr, newvalue[1]);
							var temp = staticData.getEntry(newvalue[1], scope2);

							// Temploc is location of the temporary integer that will be stored
							var temploc = "T" + tempAcc;
							tempAcc++;

							printInt(value, temp, temploc);
						}
						// Operations yielded an int
						else {
							printInt(newvalue, false, false);
						}
					}
					// If value is just an int
					else {
						printInt(value, false, false);
					}
				}
				// If value is string
				else if (checkType(value) == "string") {

					var temp = "T" + tempAcc;
					tempAcc++;

					// Declare and assign value string in environment to be referenced
					// Item is named with the first two characters of its temp value
					declareString(temp, temp, symbolTable.curr.scope);
					assignString(temp + "XX", temp, symbolTable.curr.scope, value);

					printString(temp + "XX");

				}
				// If value is boolean
				else if (checkType(value) == "boolean") {

					// If value is an equal? statement
					if (value == "equal?") {
						console.log("PRINTING EQUAL STATEMENT VALUES I CAN'T.");
					}
					// Value is a boolVal
					else {
						// Print called using temp locations of "true" and "false"
						// strings in the environment (created at the start)
						if (value == "true") {
							printBoolean("B1XX");
						}
						else {
							printBoolean("B2XX");
						}
					}
				}
			}
			// NODE = WHILE
			// NODE = IF

		// End branch node case
		}


		// Recursive tree expansion
		for (var j = 0; j < node.children.length; j++)
		{
			astWalkthrough(node.children[j], depth + 1);

			// Once a block is done being recursively expanded, step up a level in the symbol table
			if (node.name == "block" && j == node.children.length - 1) {

				symbolTable.curr = symbolTable.curr.parent;

				// If going up a level while in an if/while statement, turn off flag and do... something
				ifwhileFlag = false;

			}
		}


	// End of AST walkthrough()
	};


	// Initial call for recursive astWalkthrough()
	// Starts at ast root, depth 0
	astWalkthrough(ast.root, 0);

	// Backpatch temporary values


// End codeGeneration()
}
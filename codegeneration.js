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
						var newval = intExprEval(value);
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
				id1 = "";
				id2 = "";				// Variables to hold potential findings
				var lefttype = "";
				var righttype = "";
				var needEval = false;

				if (isId(leftchild)) {
					id1 = leftchild;
					// Gets the type assignment from most recent declaration in sym table
					var lefttype = STtypesearch(symbolTable.curr, id1);
				}
				else { 
					var check = checkType(leftchild); 
					lefttype = check[0];
					if (check[1]) { needEval = true; }
				}

				if (isId(rightchild)) {
					id2 = rightchild;
					var lefttype = STtypesearch(symbolTable.curr, id2);
				}
				else {
					var check = checkType(rightchild);
					righttype = check[0];l
					if (check[1]) { needEval = true; }
				}

				if (boolEqualFlag) {
					// Evaluate so the boolean in flag has a value
					// Branch and have next op be bool = true, then bool = false
				}
			}

		// End branch node case
		}




		// Recursive tree expansion
		for (var j = 0; j < node.children.length; j++)
		{
			astWalkthrough(node.children[j], depth + 1);

			// Once a block is done being recursively expanded, step up a level in the symbol table
			if (node.name == "block" && j == node.children.length - 1) {

				symbolTable.curr = symbolTable.curr.parent;

			}
		}


	// End of AST walkthrough()
	};


	// Initial call for recursive astWalkthrough()
	// Starts at ast root, depth 0
	astWalkthrough(ast.root, 0);


// End codeGeneration()
}
/*

Alex Reynolds
CMPU-331
Final Project

trees.js

	- Contains Tree object representation (used to build CST)
	- Generates an abstract syntax tree (AST)
	  given the concrete syntax tree (CST)
*/

// A Javascript tree object representation
function Tree() {

	// The root of the tree, initialized to null
	this.root = null;

	// The current node of tree being built
	this.curr = {};

	// Add a node
	// Kind can be branch or leaf
	this.addNode = function(name, kind) {

		// Construct node object
		var node = { 	name: name,		// name of node
						children: [],	// array of children
						parent: {}		// parent of node
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

			// Add new node to children array of current node
			this.curr.children.push(node);
		}

		// If new node is an interior/branch node (not a leaf)
		// 	update current node to new node
		if (kind == "branch")
		{
			this.curr = node;
		}

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
			//putMessage("FYI TRYING TO TRAVERSE THE TREE BUT THERE ARE SOME SAD PARENTLESS ORPHAN NODES MESSING THINGS UP.");
		}
	};


	// Return a string representation of the tree
	this.toString = function() {

		// The result string to be returned
		var treeString = "";	// Rhymes with g-string

		// Handles the expansion of the nodes
		function expand(node, depth)
		{
			// Spaces things out with - based on current depth
			for (var i = 0; i < depth; i++)
			{
				treeString += "-";
			}

			// If the node is a leaf
			if (!node.children || node.children.length === 0)
			{
				// Note current leaf node
				treeString += "[" + node.name + "]";
				treeString += "\n";
			}
			// If there are children, note interior branch nodes & expand them
			else
			{
				treeString += "<" + node.name + "> \n";

				// Recursive expansion
				for (var i = 0; i < node.children.length; i++)
				{
					expand(node.children[i], depth + 1);
				}
			}
		}

		// Initial call to expand from the root
		expand(this.root, 0);

		// Returns result string
		return treeString;
	};

}




// CONVERTS THE CST TO AN AST, GIVEN THE CST
function makeAST(cst) {

	// Sets root of CST as the starting point for expanion
	this.root = cst.root;

	// Tracks how many children have been found for the current node (used in expansion)
	var childCounter = -1;
	// Tracks if processing an operation
	var inOP = false;
	// Tracks if processing an equal?
	var inEqual = false;
	// Tracks if processing if or while statement
	var ifWhile = false;
	// Tracks how many children have been found for the current equal?
	var equalChildren = -1;
	// Tracks how many levels of op nesting there are
	var oplevels = 0;

	// Recursively handles expansion of the cst nodes and creation of the AST
		function cstExpansion(currnode, depth)
		{	
			// Current node is a leaf
			if (!currnode.children || currnode.children.length === 0)
			{
				var name = currnode.name;

				console.log("ChildC: " + childCounter + "\tEqualC: " + equalChildren + "\tNode: " + name);

				// If a { is found, a block begins
				if (name == "{") {
					ast.addNode("block", "branch");
				}
				// If a } is found, a block has ended
				else if (name == "}") {
					ast.endChildren();
					
					// If the end of an if or while block, step up tree again
					if (ifWhile) {
						ast.endChildren();
						ifWhile = false;
					}
				}

				// If the leaf is significant for the AST, record it
				// Ignore op leaves
				if (name !== "{" && name !== "}" && name !== "(" && name !== ")" && name !== "\"" && name !== "empty" && name !=="+" && name !== "-")
				{
					// Add child to parent node
					var nodename = currnode.name;
					ast.addNode(nodename, "leaf");

					// Decrement child counter
					childCounter--;

					if (childCounter == 0)
					{
						// If childCounter = 0, appropriate number of children
						// have been found for parent node. Step up a scope in tree.

						// If processing children of equal? node, decrement equal?
						// child counter
						if (inEqual) { equalChildren--; }

						// If the two children of equal? node have been found
						// after IntExprs step up another level
						if (equalChildren == 0 && inOP) {

							console.log("equal children = 0");
							ast.endChildren();

							if (!ifWhile && oplevels == 1) { ast.endChildren(); }

							// Sets counter to -1
							equalChildren--;
						}

						// If childCounter = 0 while in an op, step up another level
						if (inOP) {
							console.log("oplevels: " + oplevels);
							for (var a = 1; a < oplevels; a++) {
								ast.endChildren();
							}
							console.log("inOP over");
							oplevels = 0;
							inOP = false;
						}

						ast.endChildren();

						// Reset child counter
						childCounter = -1;
					}
				}

			}
			// Current node is a branch
			// If there are children, note interior branch nodes & expand them
			else
			{
					var nodename = currnode.name;
					console.log("ChildC: " + childCounter + "\tEqualC: " + equalChildren + "\tNode: " + nodename);


					// If all children for current working branch have been found,
					// 	end and move on (for parallel scope)
					if (childCounter == 0)
					{
						ast.endChildren();
						childCounter = -1;
					}

					if (nodename == "assign") 	// ID = EXPR
					{
						ast.addNode("assign", "branch");
						// has 2 children
						childCounter = 2;
					}
					else if (nodename == "VarDecl")		// VarDecl -> Type Id
					{
						ast.addNode("declare", "branch");
						// has 2 children
						childCounter = 2;
					}
					else if (nodename == "print") 	// print(expr)
					{
						ast.addNode("print", "branch");
						// has 1 child
						childCounter = 1;
					}
					else if (nodename == "IntExpr")	// Int expr
					{
						// If the intexpr contains an operation
						if (currnode.children.length > 1)
						{

							var tempop = currnode.children[1].name;

							inOP = true;
							oplevels++;

							// Adds the op as a branch to the AST -- op branch should have 2 children
							ast.addNode(tempop, "branch");

							childCounter = 2;
						}
					}
					else if (nodename == "while")	// While Expr
					{
						ast.addNode("while", "branch");
						// has 2 children
						childCounter = 2;
						ifWhile = true;
					}
					else if (nodename == "if")	// If Expr
					{
						ast.addNode("if", "branch");
						// has 2 children
						childCounter = 2;
						ifWhile = true;
					}
					else if (nodename == "equal?")
					{
						ast.addNode("equal?", "branch");
						// has 2 children
						childCounter = 2;
						equalChildren = 2;
						inEqual = true;
					}
					else if (nodename == "Expr")
					{
						// has 1 child
						childCounter = 1;
					}

				}

				// Recursive expansion
				for (var i = 0; i < currnode.children.length; i++)
				{
					cstExpansion(currnode.children[i], depth + 1);
				}
			
			}

		// Initial call to expand from the root
		cstExpansion(this.root, 0);


}



















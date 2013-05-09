// TREES

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
	// Tracks how many levels of op nesting there are
	var oplevels = 0;

	// Recursively handles expansion of the cst nodes and creation of the AST
		function cstExpansion(currnode, depth)
		{	
			// Current node is a leaf
			if (!currnode.children || currnode.children.length === 0)
			{
				var name = currnode.name;

				// If a { is found, a block begins
				if (name == "{") {
					ast.addNode("block", "branch");
				}
				// If a } is found, a block has ended
				else if (name =="}") {
					ast.endChildren();
					//childCounter = 0;
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

						// If childCounter = 0 while in an op, step up another level
						if (inOP) {

							for (var a = 0; a < oplevels; a++) {
								ast.endChildren();
							}

								oplevels = 0;
								inOP = false;
						}

						ast.endChildren();
						childCounter = -1;
					}
				}

			}
			// Current node is a branch
			// If there are children, note interior branch nodes & expand them
			else
			{
					var nodename = currnode.name;


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
					/*
					else if (nodename == "+")	// + op
					{
						ast.addNode("+", "branch");
						// has 2 children
						childCounter = 2;
					}
					else if (nodename == "-") 	// - op
					{
						ast.addNode("-", "branch");
						// has 2 children
						childCounter = 2;
					}
					*/
					/*
					else if (nodename == "Statement")	// Statement w/ 3 children = { StmtList }
					{
						// Only add block node if Statement List is not empty
						if (currnode.children.length == 3)
						{
							ast.addNode("block", "branch");
							// ??? children
						}
					}
					*/

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



















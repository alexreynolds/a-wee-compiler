// parsetree.js

// Used to parse a second time around and create an AST with the tokens

    
function parseTree()
    {	
        // Begin with parsing Program
        parseProgramT();
		
    }
	
function parseProgramT()
	{
		syntaxTree.addNode("Program", "branch");

		// A Program can only be a Statement, so parse Statement
		parseStatementT();
	}
	
// STATEMENT parse
function parseStatementT()
	{
		//putMessage("STATEMENT PARSE TIME");

		syntaxTree.addNode("Statement", "branch");
		
		currentToken = getNextToken();

		// STATEMENT - PRINT (EXPR)
		if (currentToken.token == "print")
		{
			// Parse the expression
			parsePrintT();

		}
		// STATEMENT - ID = EXPR
		else if (currentToken.kind == "Char")
		{
			// Stores value of id in assign statement
			var tempid = currentToken.token;

			// Get next token to see if it is "="
			currentToken = getNextToken();

			if (currentToken.token == "=")
			{
				// Creates assign node in syntax tree
				syntaxTree.addNode("assign", "branch");

				// Adds id as leaf to assign node
				syntaxTree.addNode(tempid, "leaf");

				// Parse expression
				parseExprT();

				// End assign branch ?? , back to statement branch
				syntaxTree.endChildren();

				// End Statement branch, back to ??
				syntaxTree.endChildren();

			}
			else
			{
			
				if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
			}
		}
		// STATEMENT - VARDECL
		else if (currentToken.kind == "Type")
		{
			// Adds declare node to syntax tree
			syntaxTree.addNode("VarDecl", "branch");

			// Adds type node to syntax tree
			syntaxTree.addNode("Type", "branch");

			// Adds type declaration leaf to type node
			syntaxTree.addNode(currentToken.token, "leaf");

			// Ends current type branch of tree, back to VarDecl
			syntaxTree.endChildren();

			currentToken = getNextToken();

			// Statement is of type Type ID
			if (currentToken.kind =="Char")
			{
				// Adds id node to syntax tree
				syntaxTree.addNode("id", "branch");

				// Adds id declaration leaf to id node
				syntaxTree.addNode(currentToken.token, "leaf");

				// Ends current ID branch of tree, back to VarDecl
				syntaxTree.endChildren();

				// Ends VarDecl branch of tree, back to Statement
				syntaxTree.endChildren();

				// Ends Statement branch of tree, back to ??
				syntaxTree.endChildren();
			
				return;
			}


			
		}
		// STATEMENT - {STATEMENTLIST}
		else if (currentToken.token =="{")
		{
			// Adds { leaf to Statement node
			syntaxTree.addNode("{", "leaf");

			// Parse Statement List
			parseStatListT();

			// Ends Statement branch of tree, back to ??
			syntaxTree.endChildren();

			// Adds } leaf to Statement node
			//syntaxTree.addNode("}", "leaf");

			// Ends current Statement branch of tree, back to ?
			//syntaxTree.endChildren();
			//syntaxTree.endChildren();

		}
		// STATEMENT - WHILE STATEMENT
		else if (currentToken.token == "while")
		{
			// Adds While branch to Statement node
			syntaxTree.addNode("while", "branch");

			// Parse While
			parseWhileT();

			// Ends while branch of tree, back to Statement
			syntaxTree.endChildren();

			// Ends Statement branch of tree, back to ??
			syntaxTree.endChildren();

		}
		// STATEMENT - IF STATEMENT
		else if (currentToken.token == "if")
		{
			// Adds If branch to Statement node
			syntaxTree.addNode("if", "branch");

			// Parse If
			parseIfT();

			// Ends If branch of tree, back to Statement
			syntaxTree.endChildren();

			// Ends Statement branch of tree, back to ??
			syntaxTree.endChildren();

		}
		else
		{	
			if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
		}

		// Ends statement branch of tree, return to ???
		//syntaxTree.endChildren();
		
	}

// WHILE Statement parse
function parseWhileT()
{
	// Current token entering is "while"
	
	// Parse the BooleanExpr
	parseBooleanExprT();

	// Get the next {
	currentToken = getNextToken();

	// Add { leaf to while node of tree
	syntaxTree.addNode("{", "leaf");

	// Parse the Statement List
	parseStatListT();

}

// IF Statement parse
function parseIfT()
{
	// Current token entering is "if"
	
	// Parse the BooleanExpr
	parseBooleanExprT();

	// Get the next {
	currentToken = getNextToken();

	// Add { leaf to if node of tree
	syntaxTree.addNode("{", "leaf");

	// Parse the Statement List
	parseStatListT();

}
	
// print(EXPR) parse
function parsePrintT()
{
		//putMessage("PRINT(EXPRESSION) PARSE TIME");
		syntaxTree.addNode("print", "branch");

		currentToken = getNextToken();
		
		// Check to ensure next token is "("
		if (currentToken.token =="(")
		{
			// Adds ( leaf to statement node
			syntaxTree.addNode("(", "leaf");

			// Parse expression in print
			parseExprT();
			
			// Gets next token, presumably ")"
			currentToken = getNextToken();

			// Adds ) leaf to statement node
			syntaxTree.addNode(")", "leaf");

			// Ends print branch of tree, return to Statement node
			syntaxTree.endChildren();
			
			return;
		}
		else
		{
			/*
			putMessage("ERROR YOUR STATEMENT DOES NOT LOOK LIKE IT SHOULD (HINT: PRINT(EXPR))");
			errorCount++;
			
			
			// Program has failed, stop parsing
			FAILURE();
				*/
			
			if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}

				return;

		}
	
}

// STATEMENTLIST parse
function parseStatListT()
{
	// Add Statement List node to syntax tree
	syntaxTree.addNode("Statement List", "branch");


	nextToken = checkNextToken();
	
	// The Statement List is empty
	// Block has ended
	if (nextToken.token=="}")
	{	
		// Adds empty leaf to Statement List node
		syntaxTree.addNode("empty", "leaf");

		currentToken = getNextToken();

		nextToken = checkNextToken();

		// If EOF is next, done with parsing, close off the program
		if (nextToken.token == EOF)
		{
			// Move back up the tree until the first statement node is reached
			while (syntaxTree.curr.parent.name !== "Program") {
				syntaxTree.endChildren();
			}

			// Once there, add a } leaf node
			syntaxTree.addNode("}", "leaf");

			return;
		}

		// Ends StatementList branch of tree, back to Statement/next level of StmtList
		syntaxTree.endChildren();
		syntaxTree.endChildren();
		//syntaxTree.endChildren();

		// Adds } leaf to Statement node
		syntaxTree.addNode("}", "leaf");

		// Ends Statement branch, back to ??
		//syntaxTree.endChildren();

		// NOTE: Leaf node for } added in Statement parse

		return;

	}
	else if (nextToken.token != EOF)
	{
		// StatementList --> Statement StatementList

		parseStatementT();

		parseStatListT();

		// Ends Statement List branch of tree, back to original Statement List
		syntaxTree.endChildren();
		
	}

}

// EXPRESSION parse
function parseExprT()
{
	//putMessage("FOUND AN EXPR HEYO");

	// Adds an Expression node to the syntax tree
	syntaxTree.addNode("Expr", "branch");

	currentToken = getNextToken();
	
	// EXPR - INTEXPR
	if (currentToken.kind == "digit")
	{
		parseIntExprT();

		// Ends whatever branch of tree, back to ???
		syntaxTree.endChildren();
	}
	// EXPR - STRINGEXPR
	else if (currentToken.token == "\"")
	{
		parseStringExprT();
	}
	// EXPR - ID
	else if (currentToken.kind == "Char")
	{
		// Adds id node to syntax tree
		syntaxTree.addNode("id", "branch");

		// Adds id declaration leaf to id node
		syntaxTree.addNode(currentToken.token, "leaf");

		// Ends id branch of tree, back to Expr node
		syntaxTree.endChildren();

		// Ends Expr branch of tree, back to ???
		syntaxTree.endChildren();

		return;
	}
	// EXPR - BOOL
	else if (currentToken.kind == "boolean" || currentToken.token == "(")
	{
		parseBooleanExprT();

		// Ends
	}
	else
	{
		// Do nothing
	}
}

// INT EXPRESSION parse
function parseIntExprT()
{
	//putMessage("FOUND AN INTEXPR HEYO");

	// NOTE: token going into IntExpr already proven to be a digit

	// Adds IntExpr node to syntax tree
	syntaxTree.addNode("IntExpr", "branch");

	
	// Checks the next token to decide what to do with IntExpr
	nextToken = checkNextToken();
	
	// If IntExpr is of type digit op Expr
	if (nextToken.kind == "op")
	{
		// Stores the value of the digit going into intexpr
		var tempdigit = currentToken.token;
	
	// NOTE TO SELF
		// CHANGED FROM HAVING THE OP AS THE BRANCH WITH DIGITS AS LEAVES TO 
		// HAVING DIGIT AND OP AS LEAVES AN THEN MORE AS BRANCH
		// Adds digit leaf to op node
		syntaxTree.addNode(tempdigit, "leaf");

		// Gets the op token
		currentToken = getNextToken();

		// Adds op node to syntax tree
		syntaxTree.addNode(currentToken.token, "leaf");

		parseExprT();	

		// End branch of tree, go back to something hopefully right....
		//syntaxTree.endChildren();
	}
	// Otherwise, do nothing, IntExpr consisted of only one digit
	else
	{
		//putMessage("THUS THE INTEXPR ENDS");
		// return;

		// Adds known digit leaf to intexpr node
		syntaxTree.addNode(currentToken.token, "leaf");

		// End IntExpr branch of tree, return to Expr node
		syntaxTree.endChildren();

		// End Expr branch of tree, return to ???
		syntaxTree.endChildren();
	}
}

// STRING EXPRESSION parse
function parseStringExprT()
{
	//putMessage("FOUND A CHAREXPR HEYO");

	// Add String Expression node to syntax tree
	syntaxTree.addNode("StringExpr", "branch");

	
	// Adds CharList node to syntax tree (so it is not added with every recursive call)
	syntaxTree.addNode("CharList", "branch");

	// StringExpr can only contain a CharList
	parseCharListT("");

	// End String Expr branch of tree, return to Expr
	syntaxTree.endChildren();
}

// BOOLEAN EXPRESSION parse
function parseBooleanExprT()
{
	// Add Boolean Expression node to syntax tree
	syntaxTree.addNode("BooleanExpr", "branch");

	// If BooleanExpr is of type (Expr == Expr)
	if (currentToken.token == "(")
	{
		syntaxTree.addNode("equals?", "branch");

		// Parse LHS Expr
		parseExprT();

		// Get == token
		currentToken = getNextToken();

		// Formatted correctly, parse RHS Expr
		parseExprT();

		// Get ) token
		currentToken = getNextToken();

		// End equals branch of tree, back to Boolean branch
		syntaxTree.endChildren();

		// End Boolean expr branch of tree, back to ??
		syntaxTree.endChildren();

	}
	// If BooleanExpr is of type boolVal
	else if (currentToken.kind == "boolean")
	{
		// Add boolean leaf to boolean expr branch
		syntaxTree.addNode(currentToken.token, "leaf");

		// End boolean expr branch of tree, back to ??
		syntaxTree.endChildren();

	}

}

// CHAR LIST parse
function parseCharListT(str)
{

	// String representing contents of the charlist
	var chliststrT = str;

	nextToken = checkNextToken();
	
	// If CharExpr is of type Char CharList or Space Charlist
	if (nextToken.kind == "Char" || nextToken.kind == "Space")
	{
		currentToken = getNextToken();

		// Append current token value to charlist string
		chliststrT += currentToken.token;

		parseCharListT(chliststrT);
	}
	// If CharExpr is empty
	else if (nextToken.token =="\"")
	{
		currentToken = getNextToken();
		// Do nothing, CharList is empty
		//putMessage("THUS THE CHAREXPR ENDS");

		// Adds charlist string leaf to Char List node
		syntaxTree.addNode(chliststrT, "leaf");

		// End Char List branch of tree, return to String Expr node
		syntaxTree.endChildren();

		return;
	}
	else if (nextToken.kind == "digit")
	{
		currentToken = getNextToken();
		//putMessage("WARNING YOU'RE TRYING TO SLIP DIGITS INTO YOUR CHARLIST YOU CHEATING BASTARD");
		//putMessage("(Will continue anyway in case it was merely a mistake.)");

		// Append current token value to charlist string
		chliststrT += currentToken.token;

		parseCharListT(chliststrT);
	}
	else if (nextToken.kind == "Type")
	{
		currentToken = getNextToken();
		//putMessage("FOUND A TYPE DECLARATION BUT YOU'RE IN A CHARLIST SO YOUR DECLARATIONS AREN'T WORTH A DAMN");
		//putMessage("PARSING THAT S**T LIKE IT'S A MOTHERF***ING CHARLIST");

		// Append current token value to charlist string
		chliststrT += currentToken.token;

		parseCharListT(chliststrT);	
	}
	else
	{
		// Do nothing
	}
}

function FAILURE()
{
	putMessage("YOUR PROGRAM HAS FAILED COMPLETELY AND MOST UTTERLY AND WILL NO LONGER BE PARSED");
	failed = true;
}
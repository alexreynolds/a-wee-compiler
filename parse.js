// parse.js

    
function parse()
    {
        putMessage("PARSING ALL YOUR TOKENS NOW.");
		
        // Begin with parsing Program
        parseProgram();
		
		// If program doesn't fail, execute the rest of parse
		if (!failed)
		{
			currentToken = getNextToken();
			
			// Looking for end of stream $ after Statement, if not found, error!
			if (currentToken.token == "$")
			{
				// Write results
				putMessage("PARSING IS FINITO JOY OF ALL JOYS.\n");
				//putMessage("(Heads up, you had " + errorCount + " error(s).)");  
			}
			// If program ends but there is no $
			else if (currentToken.token != "$")
			{
				putMessage("MAYDAY MAYDAY WHERE IS THE $?");
				errorCount++;
				
				// Scrolls through remaining tokens to see if there is an $ somewhere
				putMessage("BEGINNING A QUEST TO FIND THE MISSING $");
				var i;
				var tokenCount = 0;
				for (i = tokenIndex; i < tokens.length; i++)
				{
					var curr = tokens[i];
					if (curr.token == EOF)
					{
						putMessage("FINALLY FOUND A $ " + tokenCount + " POSITIONS AFTER WHERE IT WAS DUE.");
						putMessage("YOU CAUSE THIS PARSER MUCH STRIFE.")
					}
					else
					{
						tokenCount++;
					}
				}
				putMessage("(Parsing finally done, you had " + errorCount + " error(s).)");
			}
		}
    }
	
function parseProgram()
	{
		putMessage("PROGRAM PARSE TIME");
		
		// A Program can only be a Statement, so parse Statement
		parseStatement();
	}
	
// STATEMENT parse
function parseStatement()
	{
		putMessage("STATEMENT PARSE TIME");
		
		currentToken = getNextToken();
		
		// If Statement is of type PRINT(EXPR)
		if (currentToken.token == "print")
		{
			putMessage("FOUND A PRINT(EXPR) HEYO");
			parsePrint();
		}
		// If Statement is of type ID = EXPR
		else if (currentToken.kind == "Char")
		{
			putMessage("FOUND A ID=EXPR HEYO");
			// Get next token to see if it is "="
			currentToken = getNextToken();
			if (currentToken.token == "=")
			{
				parseExpr();
			}
			else
			{
				putMessage("ERROR THE FORM IS ID = EXPR AND YOU NEED TO CONFORM TO THE FORM");
				errorCount++;
				
				// Program has failed, stop parsing
				FAILURE();
				
				// If the EOF has been reached
				if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
			}
		}
		// If Statement is of type VarDecl
		else if (currentToken.kind == "Type")
		{
			putMessage("FOUND A VARIABLE DECLARATION HEYO");

			currentToken = getNextToken();

			// Statement is of type Type ID
			if (currentToken.kind =="Char")
			{
				// Do nothing, statement is correctly formatted
				return;
			}
			else
			{
				putMessage("ERROR YOUR VARIABLE DECLARATION IS DECLARABLY DEFECTIVE");
				errorCount++;
				
				// Program has failed, stop parsing
				FAILURE();
				
			}
			
		}
		// If Statement is of type {STATEMENTLIST}
		else if (currentToken.token =="{")
		{
			putMessage("FOUND A STATEMENT LIST HEYO");

			// Moving down a level in scope
			scope++;

			parseStatList();
		}
		// If Statement is a While Statement
		else if (currentToken.token == "while")
		{
			putMessage("FOUND A WHILE STATEMENT HEYO");
			parseWhile();
		}
		// If Statement is an If Statement
		else if (currentToken.token == "if")
		{
			putMessage("FOUND AN IF STATEMENT HEYO");
			parseIf();
		}
		else
		{
			putMessage("ERROR YOUR STATEMENT IS NOT A STATEMENT");
			errorCount++;	
			
			
			// Program has failed, stop parsing
			FAILURE();
				
			
			if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
		}
		
	}

// WHILE Statement parse
function parseWhile()
{
	// Current token entering is "while"
	putMessage("WHILE STATEMENT PARSE TIME");

	currentToken = getNextToken();
	
	// Parse the BooleanExpr
	parseBooleanExpr();

	// Check to ensure next token is a {
	currentToken = getNextToken();

	if (currentToken.token == "{")
	{
		// While is properly formatted, parse StatementList
		parseStatList();

		// Moving down a level in scope
			scope++;
	}
	else	// While is not formatted correctly, error
	{
		putMessage("YOUR WHILE STATEMENT IS ALL OUT OF WHACK.");
		errorCount++;

		// Program has failed, stop parsing
		FAILURE();
	}

}

// IF Statement parse
function parseIf()
{
	// Current token entering is "if"
	putMessage("IF STATEMENT PARSE TIME");

	currentToken = getNextToken();
	
	// Parse the BooleanExpr
	parseBooleanExpr();

	// Check to ensure next token is a {
	currentToken = getNextToken();

	if (currentToken.token == "{")
	{
		// While is properly formatted, parse StatementList
		parseStatList();

		// Moving down a level in scope
			scope++;
	}
	else	// While is not formatted correctly, error
	{
		putMessage("YOUR IF STATEMENT IS ALL SORTS OF WHACK.");
		errorCount++;

		// Program has failed, stop parsing
		FAILURE();
	}

}
	
// print(EXPR) parse
function parsePrint()
{
		putMessage("PRINT(EXPRESSION) PARSE TIME");
		currentToken = getNextToken();
		
		// Check to ensure next token is "("
		if (currentToken.token =="(")
		{
			parseExpr();
			
			// Check to ensure that statement is closed with a ")"
			nextToken = checkNextToken();
			
			if (nextToken.token != ")" && nextToken.token != EOF)
			{
				putMessage("EXPECTED ) BUT THERE'S A BUNCH OF GIBBERISH INSTEAD");
				errorCount++;
				
				// Search remaining tokens to see if a ) exists
				var j;
				var positionCount = 0;
				var tempIndex = tokenIndex;
				var endFound = false;
				for (j = tokenIndex; j < tokens.length; j++)
				{
					var tempToken = tokens[j];
					if (tempToken.token == ")")
					{
						putMessage("FINALLY FOUND A ) " + positionCount + " POSITIONS AFTER WHERE IT SHOULD'VE BEEN.");
						putMessage("YOU NEED TO CLEAN UP YOUR PARENTHETICAL STATEMENT YOU DIRTY USER.");
						tokenIndex = j + 1;
						endFound = true;
					}
					else
					{
						positionCount++;
						tempIndex++;
					}
					
				}
				
				// If a ) was not found
				if (!endFound)
				{
					putMessage("ERROR CLOSE YOUR STATEMENT WITH A ) FOR CRYING OUT LOUD.");
					errorCount++;
					
					// Program has failed, stop parsing
					FAILURE();
				
				}
			}
			// If next token is EOF, not )
			else if (nextToken.token == EOF)
			{
				putMessage("WARNING YOU NEED TO CLOSE YOUR DAMNED STATEMENT WITH A ) BEFORE ENDING THIS PARSE.");
				errorCount++;

				// Program has failed, stop parsing
				FAILURE();
			}
			// ) is present, all is well
			else
			{
				currentToken = getNextToken();
				return;
			}
		}
		else
		{
			putMessage("ERROR YOUR STATEMENT DOES NOT LOOK LIKE IT SHOULD (HINT: PRINT(EXPR))");
			errorCount++;
			
			
			// Program has failed, stop parsing
			FAILURE();
				
			
			if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
		}
	
}

// STATEMENTLIST parse
function parseStatList()
{
	nextToken = checkNextToken();
	


	// The Statement List is empty
	if (nextToken.token=="}")
	{	
		// Moving back up a level in scope
		scope--;

		currentToken = getNextToken();

		return;
	}
	else if (nextToken.token != EOF)
	{
		// StatementList --> Statement StatementList
		parseStatement();
		
		parseStatList();
		
	}
	else if (nextToken.token == EOF)
	{
		putMessage("ERROR YOU NEED TO CLOSE UP YOUR LIST WITH A } BEFORE YOU EVEN THINK ABOUT FINISHING.");
		errorCount++;

		// Program has failed, stop parsing
		FAILURE();
	}
	else
	{
		putMessage("YOUR STATEMENT LIST IS A VERY CONFUSED STATEMENT LIST");
		errorCount++;
		
		
		// Program has failed, stop parsing
		FAILURE();
				
	}
}

// EXPRESSION parse
function parseExpr()
{
	putMessage("FOUND AN EXPR HEYO");
	currentToken = getNextToken();
	
	// If Expr is of type IntExpr
	if (currentToken.kind == "digit")
	{
		parseIntExpr();
	}
	// If Expr is of type StringExpr
	else if (currentToken.token == "\"")
	{
		parseStringExpr();
	}
	// If Expr is of type ID
	else if (currentToken.kind == "Char")
	{
		// Expr is an ID, do nothing
		return;
	}
	// If Expr is of type BooleanExpr
	else if (currentToken.kind == "boolean" || currentToken.token == "(")
	{
		parseBooleanExpr();
	}
	else
	{
		putMessage("ERROR YOUR EXPRESSION IS NOT REAL.");
		errorCount++;
		
		
		// Program has failed, stop parsing
		FAILURE();
				
		
		if (currentToken.token == EOF)
				{
					// Decrements tokenIndex so that EOF is not missed in parsing
					tokenIndex--;
				}
	}
}

// INT EXPRESSION parse
function parseIntExpr()
{
	putMessage("FOUND AN INTEXPR HEYO");
	// NOTE: token going into IntExpr already proven to be a digit
	
	// Checks the next token to decide what to do with IntExpr
	nextToken = checkNextToken();
	
	// If IntExpr is of type digit op Expr
	if (nextToken.kind == "op")
	{
		currentToken = getNextToken();
		parseExpr();
	}
	// Otherwise, do nothing, IntExpr consisted of only one digit
	else
	{
		putMessage("THUS THE INTEXPR ENDS");
		// return;
	}
}

// STRING EXPRESSION parse
function parseStringExpr()
{
	putMessage("FOUND A CHAREXPR HEYO");
	// StringExpr can only contain a CharList
	parseCharList();
}

// BOOLEAN EXPRESSION parse
function parseBooleanExpr()
{
	putMessage("FOUND A BOOLEAN EXPRESSION HEYO");

	// If BooleanExpr is of type (Expr == Expr)
	if (currentToken.token == "(")
	{
		parseExpr();

		// Check for equality test
		currentToken = getNextToken();

		if (currentToken.token == "==")	
		{
			// Formatted correctly, parse second Expr
			parseExpr();

			// Check that next token is a )
			nextToken = checkNextToken();

			if (nextToken.token == ")")
			{
				// Formatted correctly
				currentToken = getNextToken();
			}
			else
			{
				// Formatted incorrectly, fail
				putMessage("YOUR BOOLEAN EXPRESSION IS BIZARRE AND WRONG AND YOU SHOULD REMEDY THAT.");
				errorCount++;

				// Program has failed, stop parsing
				FAILURE();
			}
		}

	}
	// If BooleanExpr is of type boolVal
	else if (currentToken.kind == "boolean")
	{
		// Do nothing, all is well
	}
	// Else, incorrectly formatted
	else
	{
		putMessage("YO YOU NEED TO UP YOUR BOOLEAN STATEMENT GAME. IT'S ALL SORTS OF WRONG.");
		errorCount++;

		// Program failed, stop parsing
		FAILURE();
	}
}

// CHAR LIST parse
function parseCharList()
{
	nextToken = checkNextToken();
	
	// If CharExpr is of type Char CharList or Space Charlist
	if (nextToken.kind == "Char" || nextToken.kind == "Space")
	{
		currentToken = getNextToken();
		parseCharList();
	}
	// If CharExpr is empty
	else if (nextToken.token =="\"")
	{
		currentToken = getNextToken();
		// Do nothing, CharList is empty
		putMessage("THUS THE CHAREXPR ENDS");
		//return;
	}
	else if (nextToken.kind == "digit")
	{
		currentToken = getNextToken();
		putMessage("WARNING YOU'RE TRYING TO SLIP DIGITS INTO YOUR CHARLIST YOU CHEATING BASTARD");
		putMessage("(Will continue anyway in case it was merely a mistake.)");
		parseCharList();
	}
	else if (nextToken.kind == "Type")
	{
		currentToken = getNextToken();
		putMessage("FOUND A TYPE DECLARATION BUT YOU'RE IN A CHARLIST SO YOUR DECLARATIONS AREN'T WORTH A DAMN");
		putMessage("PARSING THAT S**T LIKE IT'S A MOTHERF***ING CHARLIST");
		parseCharList();	
	}
	else
	{
		putMessage("ERROR YOUR CHARLIST IS A MOST INCORRECT LIST OF CHARACTERS");
		errorCount++;
		
		// Check to ensure that statement is closed with a "
		if (nextToken.token != "\"")
		{
				putMessage("EXPECTED \" BUT ALAS IT WAS NOT MEANT TO BE");
				errorCount++;
				
				// Search remaining tokens to see if a " exists
				var j;
				var positionCount = 0;
				var tempIndex = tokenIndex;
				var endFound = false;
				for (j = tokenIndex; j < tokens.length; j++)
				{
					var tempToken = tokens[j];
					if (tempToken.token == "\"")
					{
						putMessage("FINALLY FOUND A \" " + positionCount + " POSITIONS AFTER WHERE IT SHOULD'VE BEEN.");
						putMessage("QUOTATION MARKS ARE IMPORTANT YOU INCOMPETENT BUM.");
						tokenIndex = j + 1;
						endFound = true;
					}
					else
					{
						positionCount++;
						tempIndex++;
					}
					
				}
				
				// If a " was not found
				if (!endFound)
				{
					putMessage("CLOSE YOUR CHAREXPR WITH A \" FOR CRYING OUT LOUD.");
					putMessage("QUOTATION MARKS ARE IMPORTANT YOU LAZY BUM.");
					errorCount++;
					
					// Program has failed, stop parsing
					FAILURE();
				
				}
				
		}
	}
}

function FAILURE()
{
	putMessage("YOUR PROGRAM HAS FAILED COMPLETELY AND MOST UTTERLY AND WILL NO LONGER BE PARSED");
	failed = true;
}
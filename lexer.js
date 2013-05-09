/*

Alex Reynolds
CMPU-331
Final Project

lexer.js

	- Lexical analysis of source code input
	- Generates a list of tokens to be parsed
*/

var sourceCode;

// Tracks if there are statement blocks ({}) in code
var areBlocks = false;

function lex()
    {
        // Get source code
        sourceCode = document.getElementById("TAsourceCode").value;
		
        // Trim leading and trailing spaces
        sourceCode = trim(sourceCode);
		
		// Check for $ at end of input, adds one if necessary
		if (sourceCode.charAt(sourceCode.length - 1) !="$")
		{
			putMessage("WARNING YOUR STATEMENT WAS WOEFULLY DEPRIVED OF A $ BUT ALL IS WELL NOW");
			sourceCode = sourceCode + "$";
		}
		
		// Iterates through string to construct tokens array
		var i = 0;
		var line = 1; 	// Tracks line number
		var inCharList = false;	// Boolean indicating if lexer is working through a charlist
		
		while (i < sourceCode.length)
		{
			var curr = sourceCode.charAt(i);
			
			if (curr == EOF)	// EOF reached, stop reading string
			{
				makeToken(curr, "EOF", line, i);
				putMessage("$ FOUND, WE DONE LEXING.");
				
				// If there is code after the $, warning and then ignore
				if (i < sourceCode.length - 1)
				{
					putMessage("WARNING CODE AFTER $ IS PAINFULLY USELESS AND WILL THUSLY BE IGNORED.");
					return;
				}
			}
			
			else if (curr == '\n') { line++; } 	// New line of input, increment line number counter

			else if (curr == '\t') {}	// Tab, do nothing

			else if (curr == '\"') // If current item is a ", which begins or ends a CharList
			{
				makeToken(curr, "other", line, i);

				// Changes boolean to alert lexer that a CharList is beginning/has ended
				// Refrain from creating "int" and "char" tokens
				if (inCharList) {
					inCharList = false;
				} else {
					inCharList = true;
				}
			}
			
			else if (isIntType(curr, i) && !inCharList)	// If current item is an Integer Type declaration
			{
				makeToken("int", "Type", line, i);
				
				// Skip ahead since isIntType looks at the next two items as well
				i = i + 2;
			}
			
			else if (isStringType(curr, i) && !inCharList)
			{
				makeToken("string", "Type", line, i);
				// Skip ahead since isStringType looks at next 5 items as well
				i = i + 5;	
			}

			else if (isBoolType(curr, i) && !inCharList)
			{
				makeToken("boolean", "Type", line, i);
				// Skip ahead since isBoolType looks at next 6 items as well
				i = i + 6;	
			}

			else if (isPrint(curr, i) && !inCharList)	// If current item is a print statement
			{
				makeToken("print", "print", line, i);
				// Skip ahead since isPrint looks at next 4 items as well
				i = i + 4;
			}

			else if (isWhile(curr, i) && !inCharList)	// If current item is a while statement
			{
				makeToken("while", "while", line, i);
				// Skip ahead since isWhile looks at next 4 items as well
				i = i + 4;
			}

			else if (isIf(curr, i) && !inCharList)	// If current item is an if statement
			{
				makeToken("if", "if", line, i);
				// Skip ahead since isIf looks at next 4 items as well
				i = i + 1;
			}

			else if (isFalse(curr, i) && !inCharList)	// If current item is a false statement
			{
				makeToken("false", "boolean", line, i);
				// Skip ahead since isFalse looks at next 4 items as well
				i = i + 4;
			}

			else if (isTrue(curr, i) && !inCharList)	// If current item is a true statement
			{
				makeToken("true", "boolean", line, i);
				// Skip ahead since isTrue looks at next 3 items as well
				i = i + 3;
			}
			
			else if (isChar(curr))	// If current item is a character
			{
				makeToken(curr, "Char", line, i);
			}
			
			else if (isDigit(curr))	// If current item is a digit
			{
				makeToken(curr, "digit", line, i);
			}
			
			else if (isOp(curr))	// If current item is an operation symbol
			{
				makeToken(curr, "op", line, i);
			}
			
			else if (isUpChar(curr))	// If current item is an uppercase character
			{
				putMessage("Line " + line + ": ERROR JUST BECAUSE COMPILER IS IN ALLCAPS DOESN'T MEAN YOU CAN USE CAPS TOO");
				putMessage("\tNOT MAKING A TOKEN FOR YOUR UPPERCASE BS");
				errorCount++; 
			}
			
			else if (curr == ' ')	// If current item is a space
			{
				// If in a CharList, register the space (is now valid)
				if (inCharList)
				{
					makeToken(curr, "Space", line, i);
				}
			}

			else if (curr=="=" && sourceCode.charAt(i+1)=="=")	// If current item is an equality test
			{
				makeToken("==", "other", line, i);
				// Skip ahead since it looks at next item as well
				i = i + 1;
			}
			
			else
			{
				if (curr == "{")
				{
					areBlocks = true;
				}

				if (curr == '\s') {}
				else {
					makeToken(curr, "other", line, i);
				}
			}
			
			
			i++;
		}
		
    }
	
function putMessage(msg)
    {
        document.getElementById("output").value += msg + "\n";
    }
	
// Creates a token and adds the identifier to the symbol table
function makeToken(curr, currkind, currline, position)
	{
		var t = new Token(curr, currkind, currline, position);
		tokens.push(t);
		var update = t.toString;
		putMessage(update);
		
	}
	
// Tests if a character
function isChar(curr)
	{
		if (curr=="a" || curr=="b" || curr=="c" ||
			curr=="d" || curr=="e" ||curr=="f" || 
			curr=="g" || curr=="h" || curr=="i" || 
			curr=="j" || curr=="k" || curr=="l" || 
			curr=="m" || curr=="n" || curr=="o" || 
			curr=="p" || curr=="q" || curr=="r" || 
			curr=="s" || curr=="t" || curr=="u" || 
			curr=="v" || curr=="w" || curr=="x" || 
			curr=="y" || curr=="z")
			{
				return true;	
			}
			else
				return false;
	}

// Tests if an uppercase character
// P is excluded from this test, as it is allowed in the grammar
function isUpChar(curr)
	{
		if (curr=="A" || curr=="B" || curr=="C" ||
			curr=="D" || curr=="E" ||curr=="F" || 
			curr=="G" || curr=="H" || curr=="I" || 
			curr=="J" || curr=="K" || curr=="L" || 
			curr=="M" || curr=="N" || curr=="O" || 
			curr=="P" || curr=="Q" || curr=="R" || 
			curr=="S" || curr=="T" || curr=="U" || 
			curr=="V" || curr=="W" || curr=="X" || 
			curr=="Y" || curr=="Z")
			{
				return true;	
			}
			else
				return false;
	}

// Tests if a digit [0,9]
function isDigit(curr)
	{
		if (curr=="0" || curr=="1" || curr=="2" ||
			curr=="3" || curr=="4" || curr=="5" ||
			curr=="6" || curr=="7" || curr=="8" ||
			curr=="9")
			{
				return true;
			}
		else
			return false;
	}
	
// Tests if an acceptable op ("+" or "-")
function isOp(curr)
	{
		if (curr=="+" || curr=="-")
		{
			return true;
		}
		else
		 return false;
	}
	
// Tests if an int Type declaration
function isIntType(curr, i)
	{
		// Examines current character and next two after it
		if (curr=="i" && sourceCode.charAt(i+1)=="n" && sourceCode.charAt(i+2)=="t")
		{
			return true;	
		}
		else
		  return false;
	}
	
// Tests if a string Type declaration
function isStringType(curr, i)
	{
		// Examines current character and next three after it
		if (curr=="s" && sourceCode.charAt(i+1)=="t" && sourceCode.charAt(i+2)=="r" && sourceCode.charAt(i+3)=="i" && sourceCode.charAt(i+4)=="n" && sourceCode.charAt(i+5)=="g")
		{
			return true;	
		}
		else
		  return false;
	}

// Tests if a print declaration
function isPrint(curr, i)
{
	if (curr=="p" && sourceCode.charAt(i+1)=="r" && sourceCode.charAt(i+2)=="i" && sourceCode.charAt(i+3)=="n" && sourceCode.charAt(i+4)=="t")
	{
		return true;
	}
	else
	{
		return false;
	}
}

// Tests if a while declaration
function isWhile(curr, i)
{
	if (curr=="w" && sourceCode.charAt(i+1)=="h" && sourceCode.charAt(i+2)=="i" && sourceCode.charAt(i+3)=="l" && sourceCode.charAt(i+4)=="e")
	{
		return true;
	}
	else
	{
		return false;
	}
}

// Tests if an if declaration
function isIf(curr, i)
{
	if (curr=="i" && sourceCode.charAt(i+1)=="f")
	{
		return true;
	}
	else
	{
		return false;
	}
}

// Tests if a boolean Type declaration
function isBoolType(curr, i)
{
	if (curr=="b" && sourceCode.charAt(i+1)=="o" && sourceCode.charAt(i+2)=="o" && sourceCode.charAt(i+3)=="l" && sourceCode.charAt(i+4)=="e" && sourceCode.charAt(i+5)=="a"  && sourceCode.charAt(i+6)=="n")
	{
		return true;
	}
	else
	{
		return false;
	}
}

// Tests if a false statement
function isFalse(curr, i)
{
	if (curr=="f" && sourceCode.charAt(i+1)=="a" && sourceCode.charAt(i+2)=="l" && sourceCode.charAt(i+3)=="s" && sourceCode.charAt(i+4)=="e")
		{
			return true;
		}
		else
		{
			return false;
		}
}

// Tests if a true statement
function isTrue(curr, i)
{
	if (curr=="t" && sourceCode.charAt(i+1)=="r" && sourceCode.charAt(i+2)=="u" && sourceCode.charAt(i+3)=="e")
		{
			return true;
		}
		else
		{
			return false;
		}
}


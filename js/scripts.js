document.addEventListener("DOMContentLoaded", () => {
	newgame();

	const newGame = document.getElementById("newGameButtom");
	newGame.addEventListener('click', reset);

	window.oncontextmenu = (e) => {
  		e.preventDefault();
	}
	
})


// global variables
const SIZE = 6;

const choiceCellWidth = 720 / SIZE / 3 - 6 + "px";  /* constant to be changed dynamically if board SIZE is not constant; "-6" is margin and border - could be also dynamically added/changed */
const choiceCellHeight = 720 / SIZE / 2 - 6 + "px"; 


const rowType = ["numbers", "letters", "roman", "operands", "colors", "operators"];
const pieces = {
	numbers: [1, 2, 3, 4, 5, 6],
	letters: ["A", "B", "C", "D", "E", "F"],
	roman: ["I", "II", "III", "IV", "V", "VI"],
	operands: ["+", "-", "/", "x", "^", "="],
	colors: ["red", "blue", "green", "yellow", "white", "aqua"],
	operators: ["<", ">", "!=", "&&", "$", "%"]
};

let cluesSet = [];

// pencil marks for solver => in order to generate clues for new game
let solver = new Array(SIZE);


function newgame() {
	const game = document.getElementById("board");
	const arr = [0,1,2,3,4,5] // array to aid game shuffling 
	let board = {};	

	for (let row = 0; row < SIZE; row++) {
		const boardRow = game.appendChild(document.createElement("tr"));
		shuffle(arr)
		boardRow.className = "row  " + rowType[row];
		board[row] = [];
		for (let col = 0; col < SIZE; col++) {
			const cell = document.createElement("td");
			const cellDiv = document.createElement("div")
			cellDiv.className = "choiceDiv";
			cell.id = SIZE * row + col;
			cell.dataset.field = pieces[rowType[row]][arr[col]];
			cell.className = "cell " + rowType[row];
			cell.style.width = cell.style.height = 720 / SIZE + "px";
			boardRow.appendChild(cell);
			cell.append(cellDiv);

			/* store shuffled board inside variable */
			board[row].push(arr[col]);
			for (let i = 0; i < SIZE; i++){
				const choice = document.createElement("span");
				choice.dataset.field = pieces[rowType[row]][i];
				choice.className = "choice choice" + i;
				choice.style.width = choiceCellWidth;
				choice.style.height = choiceCellHeight;
				if (rowType[row] == "colors") {
					choice.style.background = pieces[rowType[row]][i]
				} else {
					choice.innerHTML = pieces[rowType[row]][i];
				}
				cellDiv.appendChild(choice);
			}
		}
	}

	const choices = document.querySelectorAll('.choice');

	// add listener for 'pencil marks'
	choices.forEach(choice => choice.addEventListener('click', checkMatch)); 
	// add right click listener for 'pencil marks'
	choices.forEach(choice => choice.addEventListener('contextmenu', removeChoice));

	populateSolver();
	genClues(board);
	removeClues(board);
	populateClues();

	// add listener for clue section
	const clues = document.querySelectorAll('.clueCell');
	clues.forEach(newCell => newCell.addEventListener('click', removeClue));

/*	game.oncontextmenu = (e) => {
  		e.preventDefault();
	}
	*/
}


function gameOver() {
	const choices = document.querySelectorAll('.choice');
	choices.forEach(choice => choice.removeEventListener('click', checkMatch));
	choices.forEach(choice => choice.removeEventListener('contextmenu', removeChoice));
	alert("Game Over");
}


// reset window for new game - should really reset only the game
function reset() {
	cluesSet = [];
	window.location.reload(true);
	newgame();
}


function drawClue(pattern) {
	const clueDiv = document.getElementById("horizontalClues");
	const newClue = document.createElement("div");
	newClue.className = "horClue";
	for (let i = 0; i < 3; i++) {
		const newCell = document.createElement("div");
		newCell.className = "clueCell";
		if (isColor(pattern[i])) {
			newCell.style.background = pattern[i];
		} else {
			newCell.innerHTML = pattern[i];
		}
		if (i == 1) {
			if ((pattern[i] == "<|>") || (pattern[i] == ":::::")) {
				newCell.style.border = "none";
				newCell.style.color = "red";
			}
			else {
				newCell.style.borderLeft = "none";
				newCell.style.borderRight = "none";
			}
		}
		newClue.appendChild(newCell);
	}
	clueDiv.appendChild(newClue);
}


function drawClueVert(pattern) {
	const clueDiv = document.getElementById("verticalClues");
	const newClue = document.createElement("div");
	newClue.className = "vertClue";
	for (let i = 0; i < 2; i++) {
		const newCell = document.createElement("div");
		newCell.className = "clueCell";
		if (isColor(pattern[i])) {
			newCell.style.background = pattern[i];
		} else {
			newCell.innerHTML = pattern[i];
		}
		newClue.appendChild(newCell);
		if (i == 1) {
			newCell.style.borderTop = "none";
		}
	}
	clueDiv.appendChild(newClue);
}


function checkMatch() {
	const solved = this.parentElement.parentElement;
	const choiceParent = this.parentElement;

	if (solved.dataset.field == this.dataset.field) {
		flip(solved);
		while (choiceParent.hasChildNodes()) {  
  			choiceParent.removeChild(choiceParent.firstChild);
		}
	} else { 
		gameOver();
	}
}


function removeChoice() {
	const rClicked = this.parentElement.parentElement;

	if (rClicked.dataset.field == this.dataset.field) {
		gameOver();
	} else {
		rClicked.firstChild.removeChild(this);
		if (rClicked.firstChild.childNodes.length == 1) {
			flip(rClicked);

		}
	}
}


function removeClue() {
	const clueDone = this.parentElement;
	clueDone.classList.toggle("clueDone");
}


function removeLastChoice(elem) {
	flip(elem.parentElement);
	elem.removeChild(elem.firstChild);
}


function flip(elem) {
	if (elem.id > 23 && elem.id < 30) {
		elem.innerHTML = " ";
		elem.style.background = elem.dataset.field + " content-box";
	} else {
		elem.innerHTML = elem.dataset.field;
	}
	elem.classList.add('flip');	
	removeCousins(elem);
}


function removeCousins(elem) {
	let cellDivSiblings = elem.parentElement.childNodes;
	for (let i = 0; i < cellDivSiblings.length; i++) {
		let grandChildren = cellDivSiblings[i].firstChild.childNodes;
		for (let j = 0; j < grandChildren.length; j++) {
			if (grandChildren[j].dataset.field == elem.dataset.field) {
				cellDivSiblings[i].firstChild.removeChild(grandChildren[j]);
				if (grandChildren.length == 1) {
					removeLastChoice(cellDivSiblings[i].firstChild);
				}
				break;
			}
		}
	}
} 


/* HELPER METHODS */ /* HELPER METHODS */ /* HELPER METHODS */
/* HELPER METHODS */ /* HELPER METHODS */ /* HELPER METHODS */
/* HELPER METHODS */ /* HELPER METHODS */ /* HELPER METHODS */
/* HELPER METHODS */ /* HELPER METHODS */ /* HELPER METHODS */
/* HELPER METHODS */ /* HELPER METHODS */ /* HELPER METHODS */


function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


// Check if arg passed is a color
function isColor(ch) {
	return pieces["colors"].includes(ch);
}


function populateSolver() {
	for (let i = 0; i < SIZE; i++) {
		solver[i] = new Array(SIZE);
	    for (let j = 0; j < SIZE; j++) {
			solver[i][j] = new Array(SIZE);
	        for (let k = 0; k < SIZE; k++) {
	            solver[i][j][k] = k;  
	        }
	    }
	}
}


// randomly generate number
function rand(num) {
	return Math.floor(Math.random() * num)
}


function getSign(arr) {
	return pieces[rowType[arr[0]]][arr[1]];
}


function genClues(board) {
	let done = false;
	let clue;

	do {
		clue = genClue(rand(4), board);
		cluesSet.push(clue);
		done = solvable();
		
		
	} while (! done);
}


function removeClues(board) {
	let possible = false;
	let first = cluesSet[0];
	let removed;

    
    do {
        possible = false;
        for (let i = 0; i < cluesSet.length; i++) {
        	removed = cluesSet.pop();
        	if (solvable()) {
            	possible = true;
            	break;
        	} else {
            	cluesSet.unshift(removed);
        	}
        }
    } while (possible);
}


function solvable() {
	let changed = false;
	populateSolver();

	do {
		changed = false;
		for (let i = 0; i < cluesSet.length; i++) {
			if (cluesSet[i].apply()) { 
				changed = true;
			}
		}
	} while (changed);

	return isSolved();
}




/* CLUES CLASSES, CLUE GENERATING, SOLVER */
/* CLUES CLASSES, CLUE GENERATING, SOLVER */
/* CLUES CLASSES, CLUE GENERATING, SOLVER */
/* CLUES CLASSES, CLUE GENERATING, SOLVER */
/* CLUES CLASSES, CLUE GENERATING, SOLVER */

// Clues
// Every piece of clue (cell) consists of an array which specifies rowType (arr[0]) and sign, as numbered inside const 'pieces'

class ClueNeighbour {
	constructor(cell, neigh) {
		this.cell = cell;
		this.neigh = neigh;
	}	
	apply() {
		let changed = false;

		for (let i = 0; i < SIZE; i++) {
	        if (this.applyLR(i, this.cell[0], this.cell[1], this.neigh[0], this.neigh[1])) {
	            changed = true;
        	}
	        if (this.applyLR(i, this.neigh[0], this.neigh[1], this.cell[0], this.cell[1])) {
	            changed = true;
	        }
        }
    
	    if (changed) {
	        this.apply();
	    }

	    return changed;
	}

	applyLR(col, neighRowType, neighSign, cellRowType, cellSign) {

		let leftN, rightN;
	    
	    if (col == 0) {
	        leftN = false;
	    } else {
	        leftN = isMarked(col - 1, neighRowType, neighSign);
	    }
		    if (col == SIZE-1) {
		        rightN = false;
		    } else {
		        rightN = isMarked(col + 1, neighRowType, neighSign);
		    }
	    
	    // check if clue/constraint applies to the given cell:
	    // if both right and left sides are not valid, remove pencil mark
	    if ((! rightN) && (! leftN) && isMarked(col, cellRowType, cellSign)) {
	        eraze(col, cellRowType, cellSign);
	        return true;
	    } else {
	        return false;
	    }
	}
	draw() {
		if (rand(2) == 0) {
			drawClue([getSign(this.cell), "<|>", getSign(this.neigh)]);
		}
		else {
			drawClue([getSign(this.neigh), "<|>", getSign(this.cell)]);
		}
	}
}


class ClueTwoNeighbours {
	constructor(cell, left, right) {
		this.cell = cell;
		this.left = left;
		this.right = right;
	}
	apply() {
		let changed = false;

		// remove middle sign's marks from side cells
		if (isMarked(0, this.cell[0], this.cell[1])) {
			changed = true;
			eraze(0, this.cell[0], this.cell[1]);
		}
		if (isMarked(SIZE-1, this.cell[0], this.cell[1])) {
			changed = true;
			eraze(SIZE-1, this.cell[0], this.cell[1]);
		}


		// to avoid recursion, because the above lines dont need to be evaluated again, we implement a loop governed by second bool variable
		let changedLoop;
		
		do {
			changedLoop = false;

			// remove mark from cell if both sides return isMarked False (since it is ||, both conditions have to be false for !(||) to be true; 
			// if one is True, whole expresion returns !True, thus false)
			for (let i = 1; i < SIZE - 1; i++) {
				if (isMarked(i, this.cell[0], this.cell[1])) {
                	if (! ((isMarked(i-1, this.left[0], this.left[1]) && isMarked(i+1, this.right[0], this.right[1])) || 
                		(isMarked(i-1, this.right[0], this.right[1]) && isMarked(i+1, this.left[0], this.left[1]))))
	                {
	                    eraze(i, this.cell[0], this.cell[1]);
	                    changedLoop = true;
	                }
	            } 
			}

			for (let i = 0; i < SIZE; i++) {
	            let leftPossible, rightPossible;

	            if (isMarked(i, this.right[0], this.right[1])) {
	                if (i < 2){
	                	leftPossible = false;
	               	} else {
	                    leftPossible = (isMarked(i-1, this.cell[0], this.cell[1]) && isMarked(i-2, this.left[0], this.left[1]));
	               	}
	                if (i >= SIZE - 2) {
	                    rightPossible = false;
	                } else {
	                    rightPossible = (isMarked(i+1, this.cell[0], this.cell[1]) && isMarked(i+2, this.left[0], this.left[1]));
	                }
	                if ((! leftPossible) && (! rightPossible)) {
	                    eraze(i, this.right[0], this.right[1]);
	                    changedLoop = true;
	                }
	            }

	            if (isMarked(i, this.left[0], this.left[1])) {
	                if (i < 2) {
	                    leftPossible = false;
	                } else {
	                    leftPossible = (isMarked(i-1, this.cell[0], this.cell[1]) && isMarked(i-2, this.right[0], this.right[1]));
	                }
	                if (i >= SIZE - 2) {
	                    rightPossible = false;
	                } else {
	                    rightPossible = (isMarked(i+1, this.cell[0], this.cell[1]) && isMarked(i+2, this.right[0], this.right[1]));
	                }
	                if ((! leftPossible) && (! rightPossible)) {
	                    eraze(i, this.left[0], this.left[1]);
	                    changedLoop = true;
	                }
	            }
	        }

	        if (changedLoop)
	            changed = true;
	    } while (changedLoop);

    	return changed;		
	}
	draw() {
		if (rand(2) == 0) {
			drawClue([getSign(this.left), getSign(this.cell), getSign(this.right)]);
		}
		else {
			drawClue([getSign(this.right), getSign(this.cell), getSign(this.left)]);
		}
	}
}


class ClueToRight {
	constructor(cell, toRight) {
		this.cell = cell;
		this.toRight = toRight;
	}
	apply() {
		let changed = false;

		for (let i = 0; i < SIZE; i++) {
	        if (isMarked(i, this.toRight[0], this.toRight[1])) {
	            eraze(i, this.toRight[0], this.toRight[1]);
	            changed = true;
	        }
	        if (isMarked(i, this.cell[0], this.cell[1]))
	            break;
	    }
	    
	    for (let i = SIZE-1; i >= 0; i--) {
	        if (isMarked(i, this.cell[0], this.cell[1])) {
	            eraze(i, this.cell[0], this.cell[1]);
	            changed = true;
	        }
	        if (isMarked(i, this.toRight[0], this.toRight[1]))
	            break;
	    }
	    
	    return changed;
	}
	draw() {
		drawClue([getSign(this.cell), ":::::", getSign(this.toRight)]);
	}
}


class ClueVertical {
	constructor(cell, owns) {
		this.cell = cell;
		this.owns = owns;
	}
	apply() {
		let changed = false;

		for (let i = 0; i < SIZE; i++) {
			if (! (isMarked(i, this.cell[0], this.cell[1])) && isMarked(i, this.owns[0], this.owns[1])) {
				eraze(i, this.owns[0], this.owns[1]);
				changed = true;
			}
			if (! (isMarked(i, this.owns[0], this.owns[1])) && isMarked(i, this.cell[0], this.cell[1])) {
				eraze(i, this.cell[0], this.cell[1]);
				changed = true;
			}
		}
		return changed;
	}
	draw() {
		drawClueVert([getSign(this.cell), getSign(this.owns)]);
	}
}


// clue generator
function genClue(num, board) {
	let col;
	let clue;

	let cellRow = rand(SIZE);
	let neighRow = rand(SIZE);


	switch(num) {
		// ClueNeighbour
		case 0:
			col = rand(SIZE - 1);
			clue = new ClueNeighbour([cellRow, board[cellRow][col]], [neighRow, board[neighRow][col + 1]]);
			break;
		// ClueTwoNeighbours
		case 1:
			let neighRow2 = rand(SIZE);
			col = 1 + rand(SIZE - 2);
			clue = new ClueTwoNeighbours([cellRow, board[cellRow][col]], [neighRow, board[neighRow][col - 1]], [neighRow2, board[neighRow2][col + 1]]);
			break;
		// ClueToRight
		case 2:
			col = rand(SIZE-1);
			let colToRight = rand(SIZE - 1 - col) + col + 1;
			clue = new ClueToRight([cellRow, board[cellRow][col]], [neighRow, board[neighRow][colToRight]]);
			break;
		case 3:
			col = rand(SIZE);
			clue = new ClueVertical([cellRow, board[cellRow][col]], [neighRow, board[neighRow][col]]);
			break;
	}
	return clue;
}


// Draw clues
function populateClues() {
	for (let i = 0; i < cluesSet.length; i++) {
		cluesSet[i].draw();
	}
}


// if a mark is solved (one left) in one cell, remove it from other cells in row/col
function singles(row) {

    let marksInCell = [SIZE];   	// count of marks in cells
    let marksInRow = [SIZE];     	// total count of marks in row
    let mark = [SIZE];   			// used to pull last mark iterated over inside cell [col][row] - important in case only one mark is left
    let markInCol = [SIZE];    		// returns the column mark has been found inside a row

    
    // check if there is only one element left in cell(col, row)
    for (let col = 0; col < SIZE; col++) {
        for (let i = 0; i < SIZE; i++) {
            if (solver[col][row][i]) {
                marksInRow[i]++;
                markInCol[i] = col;
                marksInCell[col]++;
                mark[col] = i;
            }
        }
    }

    let changed = false;
    
    // check for cells with single element
    for (let col = 0; col < SIZE; col++) {
        if ((marksInCell[col] == 1) && (marksInRow[mark[col]] != 1)) {
            // there is only one mark in cell but it used somewhere else
            // a cell has only one pencil mark, but it is also present in other cells from which it has to be removed
            let e = mark[col];
            for (let i = 0; i < SIZE; i++) {
                if (i != col) {
                    solver[row][i][e] = null;
                }
            }
            changed = true;
        }
    }

    // check for single mark (row) without exclusive cell
    // a ROW has a pencil mark which is present inside ONLY one cell so other pencil marks have to be removed from that cell
    for (let el = 0; el < SIZE; el++) {
        if ((marksInRow[el] == 1) && (marksInCell[markInCol[el]] != 1)) {
            let col = markInCol[el];
            for (let i = 0; i < SIZE; i++) {
                if (i != el) {
                    solver[row][col][i] = null;
                }
            }
            changed = true;
        }
    }

    if (changed) {
        singles(row);  // pencil marks in ROW have been altered -> we have to check for further possible eliminations
    }

}


// return True if only one pencil mark is left
function oneMarkLeft(col, row) 
{
    let marksRemoved = 0, marks = 0;
    for (let i = 0; i < SIZE; i++)
        if (solver[row][col][i] == null)
            marksRemoved++;
        else
            marks++;
    return ((marksRemoved == SIZE-1) && (marks == 1));
}


function isMarked(col, row, mark) {
    return solver[row][col][mark] == mark;
}


// return True if game is solved
function isSolved() {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (oneMarkLeft(i, j) == false) {
                return false;
            }
        }
    }
    return true;
}


// remove marks
// for real solver, this SHOULD make sure it doesn't remove the last mark??
function eraze(col, row, mark) {
	if (solver[row][col][mark] == null) {
        return;
	}

    solver[row][col][mark] = null;
    singles(row);
}
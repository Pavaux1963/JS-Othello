(() => {
    async function wait(ms) {
        return new Promise(resolve => { setTimeout(resolve, ms) });
    }
    document.addEventListener("DOMContentLoaded", () => {
        let output = document.getElementById("output");
        class Board {
            constructor(context) {
                this.context = context;
                this.main_board = [[0, 0, 0, 0, 0, 0, 0, 0],
                              [0, 0, 0, 0, 0, 0, 0, 0],
                              [0, 0, 0, 0, 0, 0, 0, 0],
                              [0, 0, 0, 2, 1, 0, 0, 0],
                              [0, 0, 0, 1, 2, 0, 0, 0],
                              [0, 0, 0, 0, 0, 0, 0, 0],
                              [0, 0, 0, 0, 0, 0, 0, 0],
                              [0, 0, 0, 0, 0, 0, 0, 0]];
                this.eval_board = [[52, -2, 24, 2, 2, 24, -2, 52],
                                   [-2, -76, -31, -20, -20, -31, -76, -2],
                                   [24, -31, 22, 7, 7, 22, -31, 24],
                                   [2, -20, 7, 18, 18, 7, -20, 2],
                                   [2, -20, 7, 18, 18, 7, -20, 2],
                                   [24, -31, 22, 7, 7, 22, -31, 24],
                                   [-2, -76, -31, -20, -20, -31, -76, -2],
                                   [52, -2, 24, 2, 2, 24, -2, 52]]
                this.tap = new Audio("tap.mp3");
                this.putting = false;
                this.turn = 1;
            }

            draw() {
                this.context.fillStyle = "#FFFFCC"
                this.context.fillRect(0, 0, canvas.width, canvas.height);
                this.context.fillStyle = this.turn == 2 ? "#FF9999" : "red";
                this.context.fillRect(100, 40, 190, 50);
                context.beginPath();
                context.arc(125, 65, 15, 0, 360 * Math.PI / 180, true);
                context.fillStyle = "white";
                context.fill();
                context.font = "15pt sans-serif";
                context.fillText("Player", 150, 72);
                context.fillText(this.enumPos(1).length, 240, 72);
                this.context.fillStyle = this.turn == 1 ? "#99CCFF" : "blue";
                this.context.fillRect(310, 40, 190, 50);
                context.beginPath();
                context.arc(335, 65, 15, 0, 360 * Math.PI / 180, true);
                context.fillStyle = "black";
                context.fill();
                context.fillText("CPU", 360, 72);
                context.fillText(this.enumPos(2).length, 450, 72);
                this.context.fillStyle = "green";
                this.context.fillRect(103, 130, 386, 386);
                this.context.lineWidth = 1;
                this.context.strokeStyle = "black";
                this.context.strokeRect(103, 130, 386, 386);
                for (let i = 1; i <= 7; i++) {
                    this.context.beginPath();
                    this.context.moveTo(103 + 48 * i, 130);
                    this.context.lineTo(103 + 48 * i, 130 + 386);
                    this.context.stroke();
                    this.context.beginPath();
                    this.context.moveTo(103, 130 + 48 * i);
                    this.context.lineTo(103 + 386, 130 + 48 * i);
                    this.context.stroke();
                }
                for (let y in this.main_board) {
                    for (let x in this.main_board[y]) {
                        let color = this.main_board[y][x];
                        if (color != 0) {
                            context.beginPath();
                            context.arc(127 + 48 * x, 154 + 48 * y, 18, 0, 360 * Math.PI / 180, true);
                            context.fillStyle = color == 1 ? "white" : "black";
                            context.fill();
                        }
                    }
                }
            }

            async putSingle(boardX, boardY, pieceColor) {
                if(this.main_board[boardY][boardX] != pieceColor) {
                    this.main_board[boardY][boardX] = pieceColor;
                    this.draw();
                    this.tap.play();
                    await wait(200);
                }
            }

            realToBoardPos(x, y) {
                return [Math.floor((x - 103) / 48), Math.floor((y - 130) / 48)];
            }

            boardToRealPos(x, y) {
                return [x * 48 + 103, y * 48 + 130];
            }

            enemyColor(color) {
                return color == 1 ? 2 : 1;
            }

            enumPos(color, board=this.main_board) {
                let pos = [];
                for (let y in board) {
                    for (let x in board[y]) {
                        if (board[y][x] == color) pos.push([x, y]);
                    }
                }
                return pos;
            }

            enumCanPut(color, board=this.main_board) {
                let canput = new Set();
                let positions = this.enumPos(color, board);
                let dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                for (let pos of positions) {
                    for (let dir of dirs) {
                        let x = parseInt(pos[0]), y = parseInt(pos[1]);
                        if((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1])))
                            && (board[y+dir[1]][x+dir[0]] == this.enemyColor(color))) {
                            while((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1])))
                                && (board[y+dir[1]][x+dir[0]] == this.enemyColor(color))) {
                                x += dir[0], y += dir[1];
                            }
                            if((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1])))
                                && (board[y+dir[1]][x+dir[0]] == 0)) {
                                x += dir[0], y += dir[1];
                                canput.add([x, y]);
                            }
                        }
                    }
                }
                return Array.from(canput);
            }

            canInvert(x, y, color, dir, board=this.main_board) {
                if ((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1]))) &&
                    (board[y+dir[1]][x+dir[0]] == this.enemyColor(color))) {
                    while ((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1]))) &&
                        (board[y+dir[1]][x+dir[0]] == this.enemyColor(color))) {
                        x += dir[0], y += dir[1];
                    }
                    if ((((x+dir[0]) >= 0) && ((y+dir[1]) >= 0) && (7 >= (x+dir[0])) && (7 >= (y+dir[1]))) &&
                    (board[y+dir[1]][x+dir[0]] == color)) {
                        return true;
                    }
                }
                return false;
            }

            async put(x, y, color) {
                this.putting = true;
                let dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                for (let dir of dirs) {
                    let x2 = x, y2 = y;
                    if(this.canInvert(x2, y2, color, dir)) {
                        do {
                            await this.putSingle(x2, y2, color);
                            x2 += dir[0], y2 += dir[1];
                        } while(this.main_board[y2][x2] == this.enemyColor(color));
                    }
                }
                this.putting = false;
            }

            putTest(x, y, color, board) {
                let dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                for (let dir of dirs) {
                    let x2 = x, y2 = y;
                    if(this.canInvert(x2, y2, color, dir, board)) {
                        do {
                            board[y2][x2] = color;
                            x2 += dir[0], y2 += dir[1];
                        } while(board[y2][x2] == this.enemyColor(color));
                    }
                }
            }

            getBestPos(color, board=this.main_board) {
                let canput = this.enumCanPut(color, board);
                let bestpos = canput[0];
                for(let pos of canput) {
                    if(this.eval_board[bestpos[1]][bestpos[0]] < this.eval_board[pos[1]][pos[0]]) {
                        bestpos = pos;
                    }
                }
                return bestpos;
            }

            watchArray(array) {
                let text = "";
                for(let i of array) {
                    text += i + "\n";
                }
                alert(text);
            }

            evalPos(x, y, color) {
                let test_board = JSON.parse(JSON.stringify(this.main_board));
                this.putTest(x, y, color, test_board);
                while(true) {
                    if(this.enumCanPut(this.enemyColor(color), test_board).length != 0) {
                        let bestpos = this.getBestPos(this.enemyColor(color), test_board);
                        this.putTest(bestpos[0], bestpos[1], this.enemyColor(color), test_board);
                    }
                    if(this.enumCanPut(color, test_board).length != 0) {
                        let bestpos = this.getBestPos(color, test_board);
                        this.putTest(bestpos[0], bestpos[1], color, test_board);
                    }
                    if((this.enumCanPut(color, test_board).length == 0) &&
                    (this.enumCanPut(this.enemyColor(color), test_board).length == 0)) {
                        return [this.enumPos(color, test_board).length, this.enumPos(this.enemyColor(color), test_board).length];
                    }
                }
            }

            async cpuTurn() {
                if(this.enumCanPut(2).length != 0) {
                    this.turn = 2;
                    let canput = this.enumCanPut(2);
                    let bestpos = [];
                    let high_score = -100;
                    for(let i of canput) {
                        let result = this.evalPos(i[0], i[1], 2);
                        let score = result[0] / result[1];
                        if(high_score < score) {
                            bestpos = i;
                            high_score = score
                        }
                    }
                    console.log(high_score);
                    await this.put(bestpos[0], bestpos[1], 2);
                    this.turn = 1;
                    this.draw();
                }
                if((this.enumCanPut(2).length == 0) && (this.enumCanPut(1).length == 0)) {
                    this.gameset();
                }
            }

            gameset() {
                console.log("game set");
                this.turn = 3;
                this.draw();
            }
        }

        let canvas = document.getElementById("canvas");
        let context = canvas.getContext("2d");
        let board = new Board(context);
        board.draw();
        canvas.addEventListener("click", async (e) => {
            /*
            if(board.enumCanPut(1).length != 0) {
                let bestpos = board.getBestPos(1);
                await board.put(bestpos[0], bestpos[1], 1);
                board.cpuTurn();
            } else if(board.enumCanPut(2).length == 0) {
                board.gameset();
            } else {
                await board.cpuTurn();
            }
            */
            let x = e.offsetX, y = e.offsetY;
            if ((103 <= x) && (x <= 487) && (130 <= y) && (y <= 514) && (!board.putting)) {
                [x, y] = board.realToBoardPos(x, y);
                if(board.enumCanPut(1).length != 0) {
                    if(board.enumCanPut(1).some(a => a[0] == x && a[1] == y)) {
                        await board.put(x, y, 1);
                        board.cpuTurn();
                    } else {
                        console.log("You can't put here.");
                    }
                } else if(board.enumCanPut(2).length == 0) {
                    board.gameset();
                } else {
                    await board.cpuTurn();
                }
            }
        });
    });
})();
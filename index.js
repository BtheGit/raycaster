// This will be for the most bare bones implementation and playing around.
// If this goes on long enough, we'll modularize and add in a build system.

// # Constants

// The length/width of one grid section, or wall.
const GRID_LENGTH = 10;
const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;
const STARTING_POSX = 200;
const STARTING_POSY = 200;
const STARTING_DIR = 1; // Angle in radians.

// # Helper functions
const radians = degrees => degrees * (Math.PI / 180);
const degrees = radians => radians / (Math.PI/ 180);
const random = (upper = 100, lower = 0) => Math.max(Math.floor(Math.random() * (upper + 1)), lower);

// We'll start with a lot of objects. See if we decide to avoid that in a refactor.

// Brainstorming Base classes.

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}
class Wall {
  constructor(vectorA, vectorB, ctx, color = 'white') {
    this.vectorA = vectorA;
    this.vectorB = vectorB;
    this.ctx = ctx;
    this.color = color;
  }

  setCtx(ctx){
    this.ctx = ctx;
  }

  draw(ctx = this.ctx) {
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.vectorA.x, this.vectorA.y);
    ctx.lineTo(this.vectorB.x, this.vectorB.y);
    ctx.closePath();
    ctx.stroke();
  }
}

// An origin of rays
class Player {
  constructor({pos = new Vector(), dir = 0, ctx = null, color = "rgba(200,100,200,0.4)"}){
    this.size = 5;
    this.pos = pos;
    this.dir = dir;
    this.color = color;
    this.ctx = ctx;
  }

  move(){}

  rotate(){}

  draw(ctx = this.ctx){
    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// The camera won't have a position.
// For now, it will use the same as the player.
// class Camera {
//   constructor(){

//   }
// }

// Handle map rendering
// class World {
//   constructor(width, height){

//   }
// }

class Map {
  constructor(id){
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.backgroundColor = 'black';
    this.clear();
  }

  resizeCanvas(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.clear();
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
  }

  clear(color = this.backgroundColor) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
  }

  draw() {
    this.clear();

  }

}

// To handle the I/O and game loop. Probably can refrain from making this a class, but for brainstorming it's cool.
// class Game {
//   constructor(){
//   }
// }
// const game = new Game();

// const world = new World(MAP_WIDTH, MAP_HEIGHT);
// const camera = new Camera();

const map = new Map('display-map');
map.resizeCanvas(500,500)

const generateRandomWalls = ({count = 5, ctx = null}) => {
  const walls = [];
  for(let i = 0; i < count; i++){
    const wall = new Wall(new Vector(random(MAP_WIDTH), random(MAP_HEIGHT)), new Vector(random(MAP_WIDTH), random(MAP_HEIGHT)), ctx);
    walls.push(wall);
  }
  return walls;
}

const player = new Player({pos: new Vector(STARTING_POSX, STARTING_POSY), dir: STARTING_DIR, ctx: map.ctx});

const walls = generateRandomWalls({ctx: map.ctx});
for (let wall of walls) {
  wall.draw();
}

player.draw();

// A ray should have an origin, an angle (direction), and a range.
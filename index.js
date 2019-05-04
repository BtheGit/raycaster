// This will be for the most bare bones implementation and playing around.
// If this goes on long enough, we'll modularize and add in a build system.

// # Constants

// The length/width of one grid section, or wall.
const GRID_LENGTH = 10;
const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;
const STARTING_POSX = 200;
const STARTING_POSY = 200;
const STARTING_DIR = 0; // Angle in degrees.

// # Helper functions
const radians = degrees => degrees * (Math.PI / 180);
const degrees = radians => radians / (Math.PI/ 180);
const vectorDistance = (vector1, vector2) => Math.sqrt((vector1.x - vector2.x) ** 2 + (vector1.y - vector2.y) ** 2);
const random = (upper = 100, lower = 0) => Math.max(Math.floor(Math.random() * (upper + 1)), lower);

// We'll start with a lot of objects. See if we decide to avoid that in a refactor.

// Brainstorming Base classes.

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

  draw(ctx = this.ctx, color = this.color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.vectorA.x, this.vectorA.y);
    ctx.lineTo(this.vectorB.x, this.vectorB.y);
    ctx.closePath();
    ctx.stroke();
  }
}

// An origin of rays
class Raycaster {
  constructor({pos = new Vector(), dir = 0, ctx = null, color = "rgba(200,100,200,1)", world = []}){
    this.size = 2; // Size of the circle indicating caster position
    this.fov = 60;
    this.precision = .1; // Step value for fov.
    this.pos = pos;
    this.dir = dir;
    this.color = color; // Color of the circle indicating caster position
    this.ctx = ctx;
    this.world = world; // Reference to array of all objects in world.
    this.rays = [];
  }

  move(){}

  rotate(){}

  draw(ctx = this.ctx){
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    // for(let i = 0; i < this.fov; i += this.precision) {
    //   ctx.strokeStyle = 'white';
    //   ctx.beginPath();
    //   ctx.moveTo(this.pos.x, this.pos.y);
    //   ctx.lineTo()
    // }
  }

  cast(){
    const rays = [];
    for(let i = 0; i < this.fov; i += this.precision) {
      const offset = i;
      const dir = radians(this.dir + offset);
      const intersection = this.castRay(dir);
      if(intersection){
        rays.push(intersection);
      }
    }
    this.rays = rays;
    rays.forEach(({ pos, object }) => {
      const { x, y } = pos;
      this.ctx.strokeStyle = 'green';
      this.ctx.beginPath();
      this.ctx.moveTo(this.pos.x, this.pos.y);
      this.ctx.lineTo(x,y);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'red';
      this.ctx.fill();
      object.draw(this.ctx, 'blue')
    })
    const VIEW_DISTANCE = 500;
    const columnWidth = MAP_WIDTH / rays.length;
    this.ctx.fillStyle = "purple";
    this.ctx.fillRect(MAP_WIDTH, 0, MAP_WIDTH, MAP_HEIGHT);
    this.ctx.fillStyle = "violet";
    this.ctx.fillRect(MAP_WIDTH, (MAP_HEIGHT / 2), MAP_WIDTH, (MAP_HEIGHT / 2));
    for(let i = 0; i < rays.length; i++){
      // const column = i + 1;
      const offset = i * columnWidth;
      const rayPosition = rays[i].pos;
      const rayDistance = vectorDistance(this.pos, rayPosition);
      const angle = this.dir + (this.precision * i);
      // const normalizedDistance = Math.cos(angle) * rayDistance;
      const normalizedDistance = rayDistance;
      const columnOffset = Math.max((VIEW_DISTANCE - normalizedDistance), 0);
      const x1 = MAP_WIDTH + offset;
      const y1 = (MAP_HEIGHT / 2) - (columnOffset / 2);
      const brightness = Math.ceil(((VIEW_DISTANCE - normalizedDistance) / VIEW_DISTANCE) * 255);
      this.ctx.beginPath();
      this.ctx.fillStyle = `rgb(${ brightness }, ${ brightness }, ${ brightness })`;
      this.ctx.strokeStyle = `rgb(${ brightness }, ${ brightness }, ${ brightness })`;
      this.ctx.fillRect(x1,y1, columnWidth, columnOffset);
      this.ctx.strokeRect(x1,y1, columnWidth, columnOffset);
      this.ctx.closePath();
    }
    rays.forEach(({ pos, object }) => {


    })
    return this;
  }

  castRay(ray) {
    // This might be better handled by the world class.
    let currentDistance = Infinity
    let intersection = null;
    for (let object of world) {
      // Calculate intersection of ray and object
      // If an intersection with another object was already detected,
      // only store it if it's closer.
      const x1 = this.pos.x;
      const y1 = this.pos.y;
      // We only have one point so we use an imaginary second point.
      // By only looking for u >= 0, it is effectively treated as an infinitely long line.
      const x2 = Math.cos(ray) + this.pos.x;
      const y2 = Math.sin(ray) + this.pos.y;

      const x3 = object.vectorA.x;
      const y3 = object.vectorA.y;
      const x4 = object.vectorB.x;
      const y4 = object.vectorB.y;

      const commonDenominator = ((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4));
      if(!commonDenominator) {
        // Lines are parallel.
        return;
      }
      const t = (((x1 - x3) * (y3 - y4)) - ((y1 - y3) * (x3 - x4))) / commonDenominator;
      if (t >= 0) {
        const u =  - (((x1 - x2) * (y1 - y3)) - ((y1 - y2) * (x1 - x3))) / commonDenominator;
        if (u >= 0 && u <= 1) {
          const intersectionX = x3 + (u * (x4 - x3));
          const intersectionY = y3 + (u * (y4 - y3));
          const intersectionPoint = new Vector(intersectionX, intersectionY);
          const newDistance = vectorDistance(this.pos, intersectionPoint);
          if(newDistance < currentDistance) {
            currentDistance = newDistance;
            intersection = {pos: intersectionPoint, object};
          }
        }
      }
    }
    return intersection;
  }
}

class Map {
  constructor(id){
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.backgroundColor = 'black';
    this.clear();
  }

  resizeCanvas(width, height) {
    this.canvas.width = width * 2;
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
  walls.push(new Wall(new Vector(0, 0), new Vector(MAP_WIDTH, 0), ctx));
  walls.push(new Wall(new Vector(0, 0), new Vector(0, MAP_HEIGHT), ctx));
  walls.push(new Wall(new Vector(MAP_WIDTH, MAP_HEIGHT), new Vector(MAP_WIDTH, 0), ctx));
  walls.push(new Wall(new Vector(0, MAP_HEIGHT), new Vector(MAP_WIDTH, MAP_HEIGHT), ctx));
  return walls;
}

const world = generateRandomWalls({ctx: map.ctx});
for (let objects of world) {
  objects.draw();
}

const player = new Raycaster({pos: new Vector(STARTING_POSX, STARTING_POSY), dir: STARTING_DIR, ctx: map.ctx, world });

player.draw();
player.cast();
// A ray should have an origin, an angle (direction), and a range.
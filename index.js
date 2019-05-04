// This will be for the most bare bones implementation and playing around.
// If this goes on long enough, we'll modularize and add in a build system.

// # Constants

// The length/width of one grid section, or wall.
const GRID_LENGTH = 10;
const WORLD_WIDTH = 1500;
const WORLD_HEIGHT = 1500;
const STARTING_POSX = 200;
const STARTING_POSY = 200;
const STARTING_DIR = 0; // Angle in degrees.
const COLUMN_HEIGHT = 50;
const VIEW_DISTANCE = 1000;
const FRAMERATE = 1000 / 24;

// # Helper functions
const radians = degrees => degrees * (Math.PI / 180);
const degrees = radians => radians / (Math.PI/ 180);
const vectorDistance = (vector1, vector2) => Math.sqrt((vector1.x - vector2.x) ** 2 + (vector1.y - vector2.y) ** 2);
const random = (upper = 100, lower = 0) => Math.max(Math.floor(Math.random() * (upper + 1)), lower);
const clamp = (number, min, max) => Math.max(min, Math.min(number, max));
const getMovementDelta = ({angle, forward = true, speed = 1 }) => {
  const rads = radians(angle);
  const xDelta = Math.cos(rads) * speed;
  const yDelta = Math.sin(rads) * speed;
  const x = forward ? xDelta : -xDelta;
  const y = forward ? yDelta : -yDelta;
  return { x, y };
}
const scaleToScreen = (vector, screen) => {
  const scaleX = screen.width / WORLD_WIDTH;
  const scaleY = screen.height / WORLD_HEIGHT;
  const scaledX = vector.x * scaleX;
  const scaledY = vector.y * scaleY;
  return { x: scaledX, y: scaledY };
}
const getRandomWallColor = () => {
  const WALL_COLORS = [200, 220, 240, 260];
  return WALL_COLORS[ Math.floor((Math.random() * WALL_COLORS.length))];
}

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
  constructor(vectorA, vectorB, map, pov, hue = getRandomWallColor()) {
    this.vectorA = vectorA;
    this.vectorB = vectorB;
    this.map = map;
    this.pov = pov;
    this.hue = hue;
    this.color = `hsl(${ this.hue }, 100%, 70%)`;
  }

  updateDisplay(displayName, display){
    this[displayName] = display;
  }

  draw(color = this.color) {
    this.drawMap(color);
  }

  // Temporarily do rendering internally
  drawMap(color) {
    const scaledVectorA = scaleToScreen(this.vectorA, this.map);
    const scaledVectorB = scaleToScreen(this.vectorB, this.map);
    this.map.ctx.strokeStyle = this.color;
    this.map.ctx.beginPath();
    this.map.ctx.moveTo(scaledVectorA.x, scaledVectorA.y);
    this.map.ctx.lineTo(scaledVectorB.x, scaledVectorB.y);
    this.map.ctx.closePath();
    this.map.ctx.stroke();
  }
}

// An origin of rays
class Raycaster {
  constructor({pos = new Vector(), dir = 0, map = null, pov = null, color = "rgba(200,100,200,1)", world = []}){
    this.size = 2; // Size of the circle indicating caster position
    this.fov = 60;
    this.precision = .3; // Step value for fov.
    this.speed = 3; // Multiplier for moving player per step.
    this.pos = pos;
    this.dir = dir;
    this.color = color; // Color of the circle indicating caster position
    this.map = map;
    this.pov = pov;
    this.world = world; // Reference to array of all objects in world.
    this.rays = [];
    this.xoff = .1;
  }

  move({ x, y } = {}){
    if(x != null) {
      const newPosX = clamp(this.pos.x + (x * this.speed), 1, WORLD_WIDTH - 1); // The 1 offset is to prevent being in a boundary wall
      this.pos.x = newPosX;
    }
    if(y != null) {
      const newPosY = clamp(this.pos.y + (y * this.speed), 1, WORLD_HEIGHT - 1);
      this.pos.y = newPosY;
    }
  }

  wander(){
    this.xoff += .1;
    const noise = window.noise.perlin2(this.xoff, this.xoff);
    const xNoise = noise * (Math.random() * 60);
    const yNoise = noise * (Math.random() * 60);
    const dirNoise = noise * (Math.random() * 30);
    this.pos.x = clamp(this.pos.x + xNoise, 1, WORLD_WIDTH - 1);
    this.pos.y = clamp(this.pos.y + yNoise, 1, WORLD_HEIGHT - 1);
    const newDir = this.dir + dirNoise;
    const clampedDir = newDir > 360 
      ? newDir % 360 
      : newDir < 0
        ? 360 - newDir
        : newDir;
    this.dir = clampedDir;
  }

  rotate(rotation){
    const newDir = this.dir + (rotation * this.speed);
    this.dir = newDir;
  }

  drawPlayerOnMap(){
    const { x: scaledX, y: scaledY } = scaleToScreen(this.pos, this.map);
    this.map.ctx.beginPath();
    this.map.ctx.arc(scaledX, scaledY, this.size, 0, Math.PI * 2);
    this.map.ctx.fillStyle = this.color;
    this.map.ctx.fill();
  }

  drawRaysOnMap(rays){
    rays.forEach(({ pos, object }) => {
      const { x: intersectionX , y: intersectionY } = scaleToScreen(pos, this.map)
      const { x: scaledPositionX, y: scaledPositionY } = scaleToScreen(this.pos, this.map);

      this.map.ctx.strokeStyle = 'rgba(200,100,200,0.1)';
      this.map.ctx.beginPath();
      this.map.ctx.moveTo(scaledPositionX, scaledPositionY);
      this.map.ctx.lineTo(intersectionX,intersectionY);
      this.map.ctx.closePath();
      this.map.ctx.stroke();

      this.map.ctx.beginPath();
      this.map.ctx.arc(intersectionX, intersectionY, 2, 0, Math.PI * 2);
      this.map.ctx.fillStyle = 'red';
      this.map.ctx.fill();
      object.draw(this.map.ctx, 'blue')
    })
  }
  
  drawRaysOnFOV(rays){
    // Move: Coloring background of FOV
    const skyGradient = this.pov.ctx.createLinearGradient(0,0,0, this.pov.height / 2);
    skyGradient.addColorStop(0, "#68d8f2")
    skyGradient.addColorStop(1, "#0844a5")
    this.pov.ctx.fillStyle = skyGradient;
    this.pov.ctx.fillRect(0, 0, this.pov.width, this.pov.height);
    const floorGradient = this.pov.ctx.createLinearGradient(0,this.pov.height / 2 ,0, this.pov.height);
    floorGradient.addColorStop(0, "#333")
    floorGradient.addColorStop(0.2, "#14300e")
    floorGradient.addColorStop(1, "#1c660a")
    this.pov.ctx.fillStyle = floorGradient;
    this.pov.ctx.fillRect(0, (this.pov.height / 2), this.pov.width, (this.pov.height / 2));

    const columnWidth = this.pov.width / rays.length;
    for(let i = 0; i < rays.length; i++){
      const offset = i * columnWidth;
      const rayPosition = rays[i].pos;
      const wall = rays[i].object;
      const rayDistance = vectorDistance(this.pos, rayPosition);
      const halfFov = this.fov / 2;
      const angle = -halfFov + (this.precision * i);
      const normalizedDistance = Math.cos(radians(angle)) * rayDistance;
      const columnOffset = this.pov.height * (COLUMN_HEIGHT / normalizedDistance);
      const x1 = offset;
      const y1 = (this.pov.height / 2) - (columnOffset / 2);
      const brightness = (((VIEW_DISTANCE - normalizedDistance) / VIEW_DISTANCE) * 40) + 10;

      const wallHue = wall.hue;
      const hsl = `hsl(${ wallHue }, 100%, ${ brightness }%)`;
      this.pov.ctx.fillStyle = hsl;
      this.pov.ctx.strokeStyle = hsl;
      this.pov.ctx.beginPath();
      this.pov.ctx.fillRect(x1,y1, columnWidth, columnOffset);
      this.pov.ctx.strokeRect(x1,y1, columnWidth, columnOffset);
      this.pov.ctx.closePath();
    }
  }

  draw(rays = this.rays){
    this.drawPlayerOnMap();
    this.drawRaysOnMap(rays);
    this.drawRaysOnFOV(rays);
  }

  cast(){
    const rays = [];
    // We want the direction and the center of the FOV to be equal.
    const halfFov = this.fov / 2;
    for(let i = -halfFov; i < halfFov; i += this.precision) {
      const offset = i;
      const dir = radians(this.dir + offset);
      const intersection = this.castRay(dir);
      if(intersection){
        rays.push(intersection);
      }
    }
    this.rays = rays;
    this.draw();
    return this;
  }

  castRay(ray) {
    // This might be better handled by the world class.
    let currentDistance = Infinity
    let intersection = null;
    for (let object of this.world) {
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

class Screen {
  constructor(id){
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.backgroundColor = 'black';
    this.width = 0;
    this.height = 0;
    this.clear();
  }

  resizeCanvas(width, height) {
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
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

// We'll start with a lot of objects. See if we decide to avoid that in a refactor.
const generateRandomWalls = ({ count = 10, map = null, pov = null }) => {
  const walls = [];
  for(let i = 0; i < count; i++){
    const wall = new Wall(new Vector(random(WORLD_WIDTH), random(WORLD_HEIGHT)), new Vector(random(WORLD_WIDTH), random(WORLD_HEIGHT)), map, pov);
    walls.push(wall);
  }
  walls.push(new Wall(new Vector(0, 0), new Vector(WORLD_WIDTH, 0), map, pov, 300));
  walls.push(new Wall(new Vector(0, 0), new Vector(0, WORLD_HEIGHT), map, pov, 300));
  walls.push(new Wall(new Vector(WORLD_WIDTH, WORLD_HEIGHT), new Vector(WORLD_WIDTH, 0), map, pov, 300));
  walls.push(new Wall(new Vector(0, WORLD_HEIGHT), new Vector(WORLD_WIDTH, WORLD_HEIGHT), map, pov, 300));
  return walls;
}

// To handle the I/O and game loop. Probably can refrain from making this a class, but for brainstorming it's cool.
class Game {
  constructor(){
    this.interval = FRAMERATE;
    this.animationFrame = null;
    this.map = new Screen('display-map');
    this.map.resizeCanvas(300,300);
    // TODO: I need to project things now as a ratio of the map and fov dimensions and their true size to get the pixel value
    this.pov = new Screen('display-pov');
    this.pov.resizeCanvas(1200,500);
    this.walls = generateRandomWalls({ map: this.map, pov: this.pov });
    this.player = new Raycaster({pos: new Vector(STARTING_POSX, STARTING_POSY), dir: STARTING_DIR, map: this.map, pov: this.pov, world: this.walls });

    document.addEventListener('keydown', ({ key }) => {
      switch(key){
        case 'a':
          this.player.rotate(-1);
          break;
        case 'd':
          this.player.rotate(1);
          break;
        case 'w':
          this.player.move(getMovementDelta({ angle: this.player.dir }))
          break;
        case 's':
          this.player.move(getMovementDelta({ angle: this.player.dir, forward: false }))
          break;
      }      
    })
  }

  start() {
    let then = Date.now()
    let delta;

    const draw = timestamp => {
      const now = Date.now(timestamp);
      delta = now - then;
      if(delta > this.interval) {
        // Get i/o
        
        // Animate
        this.animate();
        // this.player.wander();

        then = now - (delta % this.interval)
      }
      this.animationFrame = requestAnimationFrame(draw);
    }
    this.animationFrame = requestAnimationFrame(draw)
  }

  stop() {
    cancelAnimationFrame(this.animationFrame)
    this.animationFrame = null;
  }

  animate() {
    // For each animation, we need to draw to two different canvases, the map and the POV
    // For now, we'll just pass both screens to the renderable objects for simplicity. But this is bad architecture.
    this.map.draw();
    for (let wall of this.walls) {
      wall.draw();
    }
    this.player.draw();
    this.player.cast();
  }


}
const game = new Game();
game.start();

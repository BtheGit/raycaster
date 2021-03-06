[Live Demo](https://bthegit.github.io/raycaster/): (WASD to move)

# Raycaster Test

This is just a bit of faffing about with making a basic raycaster in HTML5 canvas. But in the interests of making lists that never get completed, here are some potential milestones:

- [x] Make a basic raycaster in 2d:
  - Have a point, FOV, walls
  - Be able to move the point
  - Be able to rotate the point
  - Have a second display in first person perspective (split screen)
  - Have an animation loop for drawing at reasonable intervals
  - Have falloff lighting
  - Have walls (height)
  - Use vanilla canvas
- [ ] Add build system with typescript
- [ ] Upgrade to WebGL or try three.js
- [x] Animate point with perlin noise
- [x] Create background for infinite distance
- [x] Walls and floors
- [ ] Animate background
- [ ] Allow maps to be predrawn and loaded
- [ ] Create wall types (start with colors)
- [ ] Allow for texture mapping on walls (walls same size for now)
- [ ] Allow for procedurally generated maps
- [ ] Have collision detection
- [ ] Create other objects and animate them with perlin noise
- [ ] Give different objects different motion types and displays

### Alternate fun ideas with raycasters:
- A few dots running around shooting rays that get brighter where they intersect or illuminating bubbles flying around.
- Try voxel terrain instead


## Random working notes

We'll start with a single ray for each n radians. But we need to have vertical rays as well if we decide to have variable height walls.
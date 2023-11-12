// Byggt á sýniforriti frá ThreejsFundamentals

// Create canvas, light and cameras
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});

const camera = new THREE.PerspectiveCamera( 60, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
resetCamera();
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xAAAAAA );

const light1 = new THREE.DirectionalLight(0xFFFFFF, 1);
light1.position.set(-1, 2, 4);
scene.add(light1);
const light2 = new THREE.DirectionalLight(0xFFFFFF, 1);
light2.position.set(1, -2, -4);
scene.add(light2);

// Representing the size of the playing field
var square = 4;
var fieldX = 15;
var fieldZ = 16;

// For enabling and disabling pov camera
var povCamera = false;
var povCameraOffset = [0, 1, 0];

var active = true;
var gameOver = false;
var score = 0;

function resetCamera() {
	camera.rotation.x = -0.7;
	camera.rotation.y = 0.0;
	camera.rotation.z = 0.0;
	camera.position.set(0, 40, 60);
}

function onField(x, z) {
	return x >= 0 && z >= 0 && x < fieldX && z < fieldZ;
}
var sem = semaphore(1);
window.addEventListener("keydown", function(event) {
	if (event.code === "KeyC") {
		if (povCamera) {
			povCamera = false;
			resetCamera();
			gnome.mesh.visible=true;
			gnome.hatMesh.visible=true;
		} else {
			povCamera = true;
			camera.position.set(gnome.mesh.position.x + povCameraOffset[0], gnome.mesh.position.y + povCameraOffset[1], gnome.mesh.position.z + povCameraOffset[2]);
			camera.rotation.x = 0.0;
			camera.rotation.y = 0.0;
			camera.rotation.z = 0.0;
			gnome.mesh.visible=false;
			gnome.hatMesh.visible=false;
		}
	} else if (event.code === "Digit0") {
		resetGame();
	} else if (event.code === "KeyP") {
		active = !active;
	} else if (active) {
		// actions associated with the gnome
		sem.take(function() {
		gnome.action(event.code);
	});
	sem.leave();
	}
})

// Maps the logical coordinates to visual coordinates
function logicToVisual(x, z) {
	return [(x-7)*square, (z-8)*square];
}

class Gnome {
	constructor(x, z) {
		// The gnome has an x and y coordinates
		// It's visually represented by a sphere and a cone
		this.x = x;
		this.z = z;
		var geom = new THREE.SphereGeometry(0.4*square, 12, 12);
		const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		material.color.setHex(0xe9dcca);
		
		var hatGeom = new THREE.ConeGeometry(2, 2, 32, 1);
		const hatMaterial = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		hatMaterial.color.setHex(0xff0000);
		this.hatMesh = new THREE.Mesh(hatGeom, hatMaterial);
		this.hatMesh.position.y = 1.0 * square;
		this.hatMesh.name="GnomeHat";
		
		const mesh = new THREE.Mesh(geom, material);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		mesh.name="Gnome";
		this.mesh = mesh;
		this.updateMesh();
		var lastShot = Date.now();
		scene.add(mesh);
		scene.add(this.hatMesh);
	}
	action(code) {
		if (event.code === "ArrowUp" || event.code === "KeyW") {
			this.move(0, -1);
		} else if (event.code === "ArrowDown" || event.code === "KeyS") {
			this.move(0, 1);
		} else if (event.code === "ArrowRight" || event.code === "KeyD") {
			this.move(1, 0);
		} else if (event.code === "ArrowLeft" || event.code === "KeyA") {
			this.move(-1, 0);
		} else if(event.code === "Space") {
			this.shoot();
		}
	}
	move(xDelta, zDelta) {
		var newX = this.x + xDelta;
		var newZ = Math.max(this.z + zDelta, 11);
		if (!onField(newX, newZ) || mushrooms.isIn(newX, newZ)) {
			return;
		}
		this.x = newX;
		this.z = newZ;
		this.updateMesh();
		if (povCamera) {
			camera.position.set(this.mesh.position.x + povCameraOffset[0], this.mesh.position.y + povCameraOffset[1], this.mesh.position.z + povCameraOffset[2]);
		}
	}
	isIn(x,z) {
		return this.x == x && this.z == z;
	}
	shoot() {
		// Limit firing rate
		if (Date.now() - this.lastShot < 300) {
			return;
		}
		this.lastShot = Date.now();
		var index = projectiles.size;
		var id = Math.random().toString();
		var projectile = new Projectile(this.x, this.z - 0.5, id);
		projectiles.set(id, projectile);
	}
	updateMesh() {
		var visXZ = logicToVisual(this.x, this.z);
		this.mesh.position.x = visXZ[0];
		this.mesh.position.z = visXZ[1];
		this.hatMesh.position.x = visXZ[0];
		this.hatMesh.position.z = visXZ[1];
	}
	hit() { 
		endGame();
	}
}

class Projectile {
	constructor(x, z, id) {
		this.x = x;
		this.z = z;
		this.id = id;
		this.random = Math.random();
		var radius = 0.2*square;
		var geom = new THREE.SphereGeometry(radius, 12, 12);
		const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		material.color.setHex(0xffa500);
		const mesh = new THREE.Mesh(geom, material);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		this.mesh = mesh;
		this.mesh.name = "projectile" + this.random.toString();
		this.bound = new THREE.Sphere(this.mesh, radius);
		this.syncMeshToGameLogic();
		scene.add(mesh);
	}
	move() {
		this.z -= projectileSpeed;
		if (!onField(this.x, this.z)) {
			this.deleteFromScene();
		}
		this.syncMeshToGameLogic();
	}
	syncMeshToGameLogic() {
		var visXZ = logicToVisual(this.x, this.z);
		this.mesh.position.x = visXZ[0];
		this.mesh.position.z = visXZ[1];
		this.bound.center = this.mesh.position;
	}
	deleteFromScene() {
		scene.remove(scene.getObjectByName(this.mesh.name));
		projectiles.delete(this.id);
	}
}

class Centipede {
	constructor(length, direction, x, z, id) {
		this.length = length;
		this.direction = direction;
		this.secondaryDirection = "S";
		this.x = x;
		this.z = z;
		this.id = id;
		this.down = false;
		
		this.segments = Array(length);
		this.segments[0] = [x, z];
		for (var i = 1; i < length; i++) {
			if (direction === 'W') {
				this.segments[i] = [x+i, z];
			} else if (direction === 'E') {
				this.segments[i] = [x-i, z];
			}
		}
		this.meshSegments = Array(this.length);
		this.bounds = [];
		var radius = 0.6*square;
		for (var i = 0; i < this.length; i++) {
			var geom = new THREE.SphereGeometry(radius, 12, 12);
			const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
			if (i == 0) {
				material.color.setHex(0xffa500);
			} else {
				material.color.setHex(0x00ee00);
			}
			this.meshSegments[i] = new THREE.Mesh(geom, material);
			var visXZ = logicToVisual(this.segments[i][0], this.segments[i][1]);
			this.meshSegments[i].position.x = visXZ[0];
			this.meshSegments[i].position.z = visXZ[1];
			this.meshSegments[i].position.y = 0.5 * square;
			this.meshSegments[i].name = "Centipede"+ this.id + "-" + i.toString();
			scene.add(this.meshSegments[i]);
			
			this.bounds.push(new THREE.Sphere(this.meshSegments[i].position, radius));
		}
		this.eyeGeom = new THREE.SphereGeometry(0.2*square, 6, 6);
		this.eyeMaterial = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		this.eyeMaterial.color.setHex(0xff0000);
		this.eyeMesh1 = new THREE.Mesh(this.eyeGeom, this.eyeMaterial);
		this.eyeMesh2 = new THREE.Mesh(this.eyeGeom, this.eyeMaterial);
		this.eyeMesh1.name = "Centipede" + this.id + "-eye1";
		this.eyeMesh2.name = "Centipede" + this.id + "-eye2";
		this.eyeMesh1.position.x = this.meshSegments[0].position.x;
		this.eyeMesh1.position.z = this.meshSegments[0].position.z;
		this.eyeMesh1.position.y = 1.5+this.meshSegments[0].position.y;
		this.eyeMesh2.position.y = 1.5+this.meshSegments[0].position.y;
		scene.add(this.eyeMesh1);
		scene.add(this.eyeMesh2);
	}
	syncMeshToGameLogic() {
		for (var i = 0; i < this.length; i++) {
			var visXZ = logicToVisual(this.segments[i][0], this.segments[i][1]);
			this.meshSegments[i].position.x = visXZ[0];
			this.meshSegments[i].position.z = visXZ[1];
			this.bounds[i].center = this.meshSegments[i].position;
		}
		// Head and later segments have different colors
		this.meshSegments[0].material.color.setHex(0xffa500);
		if (this.length > 1) {
			this.meshSegments[1].material.color.setHex(0x00ee00);
		}
		// Orient the eyes according to the direction
		if (this.down && this.secondaryDirection == "S") {
			this.eyeMesh1.position.x = this.meshSegments[0].position.x + 0.7;
			this.eyeMesh1.position.z = this.meshSegments[0].position.z + 0.7;
			this.eyeMesh2.position.x = this.meshSegments[0].position.x - 0.7;
			this.eyeMesh2.position.z = this.meshSegments[0].position.z + 0.7;
		} else if (this.down) {
			this.eyeMesh1.position.x = this.meshSegments[0].position.x + 0.7;
			this.eyeMesh1.position.z = this.meshSegments[0].position.z - 0.7;
			this.eyeMesh2.position.x = this.meshSegments[0].position.x - 0.7;
			this.eyeMesh2.position.z = this.meshSegments[0].position.z - 0.7;
		} else if (this.direction == "E") {
			this.eyeMesh1.position.x = this.meshSegments[0].position.x + 0.7;
			this.eyeMesh1.position.z = this.meshSegments[0].position.z + 0.9;
			this.eyeMesh2.position.x = this.meshSegments[0].position.x + 0.7;
			this.eyeMesh2.position.z = this.meshSegments[0].position.z - 0.9;
		} else {
			this.eyeMesh1.position.x = this.meshSegments[0].position.x - 0.7;
			this.eyeMesh1.position.z = this.meshSegments[0].position.z + 0.9;
			this.eyeMesh2.position.x = this.meshSegments[0].position.x - 0.7;
			this.eyeMesh2.position.z = this.meshSegments[0].position.z - 0.9;
		}
	}
	move(retry) {
		var newX;
		var newZ;
		if (this.down) {
			var vertInc = 1;
			if (this.secondaryDirection == "N") {
				vertInc = -1;
			}
			newX = this.segments[0][0];
			newZ = this.segments[0][1]+vertInc;
			
			// check if down movement will fail
			var dstObject = atLocation(newX, newZ);
			if (onField(newX, newZ) && !(dstObject === GameObject.Mushroom || dstObject === GameObject.Centipede)) {
				this.down = false;
				this.invertDirection();
			} else {
				if (retry) {
					this.down = false;
					this.move(false);
					return;
				}
			}
		} else if(this.direction === 'W') {
			newX = this.segments[0][0]-1;
			newZ = this.segments[0][1];
		} else if (this.direction === 'E') {
			newX = this.segments[0][0]+1;
			newZ = this.segments[0][1];
		}
		var dstObject = atLocation(newX, newZ);
		if (onField(newX, newZ) && !(dstObject === GameObject.Mushroom || dstObject === GameObject.Centipede)) {
			this.segments.pop();
			this.segments.unshift([newX, newZ]);
		} else {
			this.down = true;
			if (retry) {
				this.move(false);
				return;
			}
		}
		if (newZ < 0) {
			this.secondaryDirection = "S";
		} else if (newZ == 15 && (newX == 15 || newX == -1)) {
			this.secondaryDirection = "N";
		}
		this.syncMeshToGameLogic();
	}
	hit(i) {
		// Segment i is hit
		if (i == 0) {
			score += 100;
		} else {
			score += 10;
		}
		mushrooms.create(this.segments[i][0], this.segments[i][1]);
		if (i == 0 && this.length == 1) {
			return [null, null];
		} else if (i == 0) {
			var c2 = new Centipede(this.length-i-1, this.inverseDirection(this.direction), this.segments[this.length-1][0], this.segments[this.length-1][1], Math.random().toString());
			return [c2, null];
		} else if (i == this.length - 1) {
			var c1 = new Centipede(i, this.direction, this.segments[0][0], this.segments[0][1], Math.random().toString());
			return [c1, null];
		} else {
			var c1 = new Centipede(i, this.direction, this.segments[0][0], this.segments[0][1], Math.random().toString());
			var c2 = new Centipede(this.length-i-1, this.direction, this.segments[this.length-1][0], this.segments[this.length-1][1], Math.random().toString());
			c2.invertDirection();
			return [c1, c2];
		}
	}
	isIn(x, z) {
		for (var i = 0; i < this.segments.length; i++) {
			if (this.segments[i][0] == x && this.segments[i][1] == z) {
				return true;
			}
		}
		return false;
	}
	inverseDirection(dir) {
		if (dir === 'W') {
			return 'E';
		} else if (dir === 'E') {
			return 'W';
		}
	}
	invertDirection() {
		this.direction = this.inverseDirection(this.direction);
	}
	deleteFromScene() {
		for (var i = 0; i < this.meshSegments.length; i++) {
			scene.remove(scene.getObjectByName(this.meshSegments[i].name));
		}
		scene.remove(scene.getObjectByName(this.eyeMesh1.name));
		scene.remove(scene.getObjectByName(this.eyeMesh2.name));
	}
}

const GameObject = {
	Mushroom: 'Mushroom',
	Centipede: 'Centipede',
	Gnome: 'Gnome',
	Empty: 'Empty'
};

function atLocation(x, z) {
	if (mushrooms.isIn(x,z)) {
		return GameObject.Mushroom;
	}
	if (gnome.isIn(x,z)) {
		return GameObject.Gnome;
	}
	for (var i = 0; i < centipedes.length; i++) {
		if (centipedes[i].isIn(x,z)) {
			return GameObject.Centipede
		}
	}
	return GameObject.Empty;
}

class Mushrooms {
	constructor() {
		this.map = Array(15);
		this.list = [];
		this.meshes = [];
		this.bounds = [];
		this.bodyColor = 0xcccccc;
		this.headColor = 0x795c32;
		this.radius = 0.3*square;
		this.mushGeom = new THREE.SphereGeometry(this.radius, 12, 12, 0, Math.PI*2, 0, Math.PI*2);
		// Different head geometries represent mushroom having been shot
		this.headGeom = new THREE.ConeGeometry(this.radius*1.5, this.radius/1.0, 32, 1, false, 0, Math.PI*2);
		this.headGeom3 = new THREE.ConeGeometry(this.radius*1.5, this.radius/1.0, 32, 1, false, Math.PI*2*0.1, Math.PI*2*0.8);
		this.headGeom2 = new THREE.ConeGeometry(this.radius*1.5, this.radius/1.0, 32, 1, false, Math.PI*2*0.2, Math.PI*2*0.6);
		this.headGeom1 = new THREE.ConeGeometry(this.radius*1.5, this.radius/1.0, 32, 1, false, Math.PI*2*0.3, Math.PI*2*0.4);
		this.material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		this.material.color.setHex(this.bodyColor);
		// Different head materials for color variety
		this.headMaterials = [new THREE.MeshPhongMaterial({side: THREE.DoubleSide}), 
			new THREE.MeshPhongMaterial({side: THREE.DoubleSide}), 
			new THREE.MeshPhongMaterial({side: THREE.DoubleSide}), 
			new THREE.MeshPhongMaterial({side: THREE.DoubleSide})];
		this.headMaterials[0].color.setHex(0xae6838);
		this.headMaterials[1].color.setHex(0xa67b5b);
		this.headMaterials[2].color.setHex(0xd2b48c);
		this.headMaterials[3].color.setHex(0xab7e4e);
		
		for(var i = 0; i < 15; i++) {
			this.map[i] = Array(16);
			for (var j = 0; j < 16; j++) {
				this.map[i][j] = 0.0;
			}
		}
		for (var j = 1; j < 15; j++) {
			var randomX;
			if (j > 12) {
				// Doesn't completely prevent it though
				// Try to avoid lower corners so centipede doesn't get trapped. 
				randomX = 2 + Math.floor(Math.random()*11);
			} else {
				randomX = Math.floor(Math.random()*15);
			}
			this.create(randomX, j);
			this.map[randomX][j] = 4.0;
		}
	}
	create(x, z) {
		// Logical x and z coordinates
		// Create a new mushroom
		this.map[x][z] = 4.0;
		this.list.push([x, z]);
		const mesh = new THREE.Mesh(this.mushGeom, this.material);
		//mesh.material.color.setHex(
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		var visXY = logicToVisual(x, z);
		mesh.position.x = visXY[0];
		mesh.position.z = visXY[1];
		mesh.renderOrder = 1;
		mesh.name = "MushroomBody-" + this.list.length.toString();
		
		const headMesh = new THREE.Mesh(this.headGeom, this.headMaterials[Math.floor(Math.random()*4.0)]);
		headMesh.position.y = 0.5 * square + 1.4;
		headMesh.position.x = visXY[0];
		headMesh.position.z = visXY[1];
		headMesh.renderOrder = 0;
		headMesh.name = "MushroomHead-" + this.list.length.toString();
		
		scene.add(mesh);
		scene.add(headMesh);
		this.meshes.push([mesh, headMesh]);
		
		var bound = new THREE.Sphere(mesh.position, this.radius);
		this.bounds.push(bound);
		
	}
	isIn(x,z) {
		if (x < 0 || z < 0 || x > 14 || z > 15) {
			return false;
		}
		return this.map[x][z] > 0.0
	}
	hit(i) {
		score += 1;
		// Mushroom i has been hit
		var x = this.list[i][0];
		var z = this.list[i][1];
		if (this.map[x][z] > 0.0) {
			this.map[x][z] -= 1;
		}
		if (this.map[x][z] == 0.0) {
			// delete mushroom from lists, bounds and scene
			scene.remove(scene.getObjectByName(this.meshes[i][0].name));
			scene.remove(scene.getObjectByName(this.meshes[i][1].name));
			this.list.splice(i, 1);
			this.bounds.splice(i, 1);
			this.meshes.splice(i, 1);
		} else {
			if (this.map[x][z] == 3.0) {
				this.meshes[i][1].geometry = this.headGeom3;
			} else if (this.map[x][z] == 2.0) {
				this.meshes[i][1].geometry = this.headGeom2;
			} else {
				this.meshes[i][1].geometry = this.headGeom1;
			} 
		}
	}	
}

function endGame() {
	active = false;
	gameOver = true;
	document.getElementById("scoreboard").innerHTML = "Game over! Score: " + score + ". Press 0 to restart";
}

function resetGame() {
	score = 0;
	var children = scene.children;
	for( var i = scene.children.length - 1; i >= 0; i--) { 
		obj = scene.children[i];
		scene.remove(obj); 
	}
	scene.add(light1);
	scene.add(light2);
	
	createPlane();
	gnome = new Gnome(7, 15);
	mushrooms = new Mushrooms();
	centipedes = [];
	centipedes.push(new Centipede(6, 'W', 7, 0, 1));
	projectiles = new Map();
}

function checkProjectileColisions() {
	var keysForDeletion = [];
	for (var key of projectiles.keys()) {
		var projectile = projectiles.get(key);
		for (var i = 0; i < mushrooms.bounds.length; i++) {
			var potentialCollision = projectile.bound.intersectsSphere(mushrooms.bounds[i]);
			if (potentialCollision) {
				var coords = mushrooms.list[i];
				var value = mushrooms.map[coords[0]][coords[1]];
				if (value > 0.0) {
					mushrooms.hit(i);
					keysForDeletion.push(key);
				}
			}
		}
	}
	// Check for centipede collisions
	for (var key of projectiles.keys()) {
		var projectile = projectiles.get(key);
		for (var j = 0 ; j < centipedes.length; j++) {
			var centipede = centipedes[j];
			for (var i = 0; i < centipede.bounds.length; i++) {
				var collision = projectile.bound.intersectsSphere(centipede.bounds[i]) || centipede.bounds[i].containsPoint(projectile.bound.center);
				if (collision) {
					var [c1, c2] = centipede.hit(i);
					centipedes.splice(j, 1);
					centipede.deleteFromScene();
					if (c1 != null) {
						centipedes.push(c1);
					}
					if (c2 != null) {
						centipedes.push(c2);
					}
					keysForDeletion.push(key);
					break;
				}
			}
		}
	}
	for (var i = 0; i < keysForDeletion.length; i++) {
		projectiles.get(keysForDeletion[i]).deleteFromScene();
		projectiles.delete(keysForDeletion[i]);
	}
}

function checkForCentipedeGnomeCollision() {
	for (var i = 0 ; i < centipedes.length; i++) {
		var centipede = centipedes[i];
		for (var j = 0; j < centipede.segments.length; j++) {
			if (centipede.segments[j][0] == gnome.x && centipede.segments[j][1] == gnome.z) {
				gnome.hit()
			}
		}
	}
}

function createPlane() {
	var x = 0;
	var y = 0;
	var z = -0.5*square;
	var geometry = new THREE.PlaneGeometry(15*square, 16*square, 2, 2);
	const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
	material.color.setHex(0x11aa44);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = Math.PI / 2;
	mesh.position.x = x;
	mesh.position.y = y;
	mesh.position.z = z;

	scene.add(mesh);
	return mesh;
}

createPlane();
var gnome = new Gnome(7, 15);
var mushrooms = new Mushrooms();
var centipedes = [];
centipedes.push(new Centipede(6, 'W', 7, 0, 1));
const cpPace = 24;
var cpCounter = 0;
const projectileSpeed = 0.08;
var projectiles = new Map();

// Game loop and animation
const animate = function ( time ) {
	time *= 0.001;
	requestAnimationFrame( animate );
	
	checkProjectileColisions();
	checkForCentipedeGnomeCollision();
	
	if (active) {
		if (cpCounter == cpPace) {
			for (var i = 0; i < centipedes.length; i++) {
				centipedes[i].move(true);
			}
			cpCounter = 0;
		} else {
			cpCounter += 1;
		}
		if (cpCounter == cpPace / 2) {
			for (var i = 0; i < centipedes.length; i++) {
				if (centipedes[i].length == 1) {
					centipedes[i].move(true);
				}
			}
		}
		for (var projectile of projectiles.values()) {
			projectile.move();
		}	
	}
	if (centipedes.length == 0) {
		centipedes.push(new Centipede(6, 'W', 7, 0, 1));
	}
	if (!gameOver) {
		document.getElementById("scoreboard").innerHTML = "Score: " + score;
	}
	document.getElementById("rules").innerHTML = "Controls: WASD or arrows to move and spacebar to shoot. 'c' to change camera, 'p' to pause and '0' to reset game."
	renderer.render( scene, camera );
};

animate();
// Byggt á sýniforriti frá ThreejsFundamentals

//var sem = require('semaphore')(capacity);

// Ná í striga og skilgreina birti
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});

// Skilgreina myndavél og staðsetja hana
const camera = new THREE.PerspectiveCamera( 60, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
//camera.position.set(0, 0, 100);
camera.position.set(0, 40, 75);

// Bæta við músarstýringu
const controls = new THREE.OrbitControls( camera, canvas );

// Skilgreina sviðsnetið
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xAAAAAA );

// Tveir ljósgjafar...
// Eitt ljós uppi til vinstri fyrir framan
const light1 = new THREE.DirectionalLight(0xFFFFFF, 1);
light1.position.set(-1, 2, 4);
scene.add(light1);
// Annað ljós niðri til hægri fyrir aftan
const light2 = new THREE.DirectionalLight(0xFFFFFF, 1);
light2.position.set(1, -2, -4);
scene.add(light2);

// Nokkur hjálpaföll...
const objects = [];         // Allir hlutirnir

// Bæta hlut obj í sviðsnetið í hnitum (x, y) og setja í fylki
function addObject(x, y, z, obj) {
	obj.position.x = x;
	obj.position.y = y;
	obj.position.z = z;

	scene.add(obj);
	objects.push(obj);
	return obj;
}

// Skilar Phong áferð með slembnum lit
function createMaterial() {
	const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
	material.color.setHSL(Math.random(), 1, 0.5);
	return material;
}

// Bætir hlut af gerð geometry í sviðsnetið
function addSolidGeometry(x, y, z, geometry) {
	const mesh = new THREE.Mesh(geometry, createMaterial());
	addObject(x, y, z, mesh);
	return mesh;
}

function addSolidGeometry(x, y, z, geometry, color) {
	const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
	material.color.setHex(color);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = Math.PI / 2;
	addObject(x, y, z, mesh);
	return mesh;
}

// Hlutirnir...

/*
// Fjórflötungur  (radius)
addSolidGeometry(-2, 2, new THREE.TetrahedronGeometry(7));

// Teningur (sexflötungur) (width, height, depth)
addSolidGeometry(-1, 2, new THREE.BoxGeometry(8, 8, 8));

// Áttflötungur  (radius)
addSolidGeometry(0, 2, new THREE.OctahedronGeometry(7));

// Tólfflötungur  (radius)
addSolidGeometry(1, 2, new THREE.DodecahedronGeometry(7));

// Tuttuguflötungur (radius)
addSolidGeometry(2, 2, new THREE.IcosahedronGeometry(7));


// Kúla  (radius, widthSegments, heightSegments)
addSolidGeometry(-1, 1, new THREE.SphereGeometry(7, 12, 12));

// Sívalningur  (radiusTop, radiusBottom, height, radialSegments)
addSolidGeometry(0, 1, new THREE.CylinderGeometry(4, 4, 8, 12));

// Keila  (radius, height, segments)
addSolidGeometry(1, 1, new THREE.ConeGeometry(6, 8, 16));


// Slétta  (width, height, widthSegments, heightSegments)
addSolidGeometry(-1, 0, new THREE.PlaneGeometry(9, 9, 2, 2));

// Skífa  (radius, segments)
addSolidGeometry(0, 0, new THREE.CircleGeometry(7, 24));

// Skífa með gati  (innerRadius, outerRadius, segments)
addSolidGeometry(1, 0, new THREE.RingGeometry(2, 7, 18));


// Kleinuhringur  (radius, tubeRadius, radialSegments, tubularSegments)
addSolidGeometry(-1, -1, new THREE.TorusGeometry(5, 2, 8, 24));

// Kleinuhringshnútur  (radius, tube, tubularSegments, radialSegments, p, q)
addSolidGeometry(1, -1, new THREE.TorusKnotGeometry(3.5, 1.5, 64, 8, 2, 3));
*/

var square = 4;
var fieldX = 15;
var fieldZ = 16;

function onField(x, z) {
	return x >= 0 && z >= 0 && x < fieldX && z < fieldZ;
}
var sem = semaphore(1);
window.addEventListener("keydown", function(event) {
	sem.take(function() {
		guy.action(event.code);
	});
	sem.leave();
})

function logicToVisual(x, z) {
	return [(x-7)*square, (z-8)*square];
}

class Guy {
	constructor(x, z, color) {
		this.x = x;
		this.z = z;
		var geom = new THREE.SphereGeometry(0.4*square, 12, 12);
		const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		material.color.setHex(color);
		const mesh = new THREE.Mesh(geom, material);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		this.mesh = mesh;
		this.updateMesh();
		var lastShot = Date.now();
		scene.add(mesh);
	}
	action(code) {
		if (event.code === "ArrowUp" || event.code === "KeyW") {
			this.move(0, -1);
		//guy.position.z -= 1 * square;
		} else if (event.code === "ArrowDown" || event.code === "KeyS") {
			this.move(0, 1);
			//guy.position.z += 1 * square;
		} else if (event.code === "ArrowRight" || event.code === "KeyD") {
			this.move(1, 0);
			//guy.position.x += 1 * square;
		} else if (event.code === "ArrowLeft" || event.code === "KeyA") {
			this.move(-1, 0);
			//guy.position.x -= 1 * square;
		} else if(event.code === "Space") {
			this.shoot();
		}
	}
	move(xDelta, zDelta) {
		var newX = this.x + xDelta;
		var newZ = this.z + zDelta;
		if (!onField(newX, newZ) || mushrooms.isIn(newX, newZ)) {
			return;
		}
		this.x = newX;
		this.z = newZ;
		this.updateMesh();
	}
	shoot() {
		// TODO
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
		this.z -= 0.02;
		if (!onField(this.x, this.z)) {
			// Need to also delete this object?
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
		// TODO delete from the projectile
		projectiles.delete(this.id);
	}
}

class Centipede {
	constructor(length, direction, x, z, id) {
		this.length = length;
		this.direction = direction;
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
	}
	syncMeshToGameLogic() {
		for (var i = 0; i < this.length; i++) {
			var visXZ = logicToVisual(this.segments[i][0], this.segments[i][1]);
			this.meshSegments[i].position.x = visXZ[0];
			this.meshSegments[i].position.z = visXZ[1];
			this.bounds[i].center = this.meshSegments[i].position;
		}
		this.meshSegments[0].material.color.setHex(0xffa500);
		if (this.length > 1) {
			this.meshSegments[1].material.color.setHex(0x00ee00);
		}
	}
	move(retry) {
		var newX;
		var newZ;
		if (this.down) {
			newX = this.segments[0][0];
			newZ = this.segments[0][1]+1;
			this.down = false;
			/*if (this.direction === 'W') {
				this.direction = 'E';
			} else {
				this.direction = 'W';
			}*/
			this.invertDirection();
		} else if(this.direction === 'W') {
			newX = this.segments[0][0]-1;
			newZ = this.segments[0][1];
		} else if (this.direction === 'E') {
			newX = this.segments[0][0]+1;
			newZ = this.segments[0][1];
		}
		if (onField(newX, newZ) && !mushrooms.isIn(newX, newZ)) {
			this.segments.pop();
			this.segments.unshift([newX, newZ]);
		} else {
			this.down = true;
			if (retry) {
				this.move(false);
			}
		}
		this.syncMeshToGameLogic();
	}
	hit(i) {
		// TODO implement centipede hit
		// i is the segment that was hit
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
	}
}

class Mushrooms {
	constructor() {
		this.map = Array(15);
		this.list = [];
		this.meshes = [];
		this.bounds = [];
		this.color = 0xcccccc;
		this.radius = 0.3*square;
		this.mushGeom = new THREE.SphereGeometry(this.radius, 12, 12);;
		this.material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		this.material.color.setHex(this.color);
		
		for(var i = 0; i < 15; i++) {
			this.map[i] = Array(16);
			for (var j = 0; j < 16; j++) {
				this.map[i][j] = 0.0;
			}
		}
		for (var j = 1; j < 15; j++) {
			var randomX = Math.floor(Math.random()*15);
			if (j == 15 && randomX == 7) {
				randomX = 8;
			}
			this.map[randomX][j] = 4.0;
		}
		
		for (var i = 0; i < 15; i++) {
			for (var j = 0; j < 16; j++) {
				if (this.map[i][j] > 0.0) {
					const mesh = new THREE.Mesh(this.mushGeom, this.material);
					mesh.rotation.x = Math.PI / 2;
					mesh.position.y = 0.5 * square;
					var visXY = logicToVisual(i, j);
					mesh.position.x = visXY[0];
					mesh.position.z = visXY[1];
					scene.add(mesh);
					this.meshes.push(mesh);
					
					var bound = new THREE.Sphere(mesh.position, this.radius);
					this.bounds.push(bound);
					this.list.push([i, j]);
				}
			}
		}

	}
	create(x, z) {
		// Logical x and z coordinates
		// Create a new mushroom
		this.map[x][z] = 4.0;
		this.list.push([x, z]);
		const mesh = new THREE.Mesh(this.mushGeom, this.material);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		var visXY = logicToVisual(x, z);
		mesh.position.x = visXY[0];
		mesh.position.z = visXY[1];
		scene.add(mesh);
		this.meshes.push(mesh);
		
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
		// Mushroom i has been hit
		var x = this.list[i][0];
		var z = this.list[i][1];
		if (this.map[x][z] > 0.0) {
			this.map[x][z] -= 1;
		}
		var size = 0.3*square*this.map[x][z] / 4.0
		this.meshes[i].scale.x = size;
		this.meshes[i].scale.z = size
		this.meshes[i].scale.y = size
	}
	
}

function checkProjectileColisions() {
	var keysForDeletion = [];
	// Check for mushroom collisions
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
				// TODO reduce the mushroom
				}
			}
		}
		//projectile.bound.intersectsSphere();
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
		// also do cleanup?
	}
}

addSolidGeometry(0, 0, -0.5*square, new THREE.PlaneGeometry(15*square, 16*square, 2, 2), 0x11aa44);
const axes = new THREE.AxesHelper( 15 );
scene.add(axes);
const guy = new Guy(7, 15, 0xaa1111);
const mushrooms = new Mushrooms();
var centipedes = [];
centipedes.push(new Centipede(6, 'W', 7, 0, 1));
const cpPace = 100;
var cpCounter = 0;
var projectiles = new Map();

// Hreyfifall
const animate = function ( time ) {
	time *= 0.001;

	/*objects.forEach((obj, ndx) => {
		const speed = 0.1 + ndx*0.05;
		const rot = time*speed;
		obj.rotation.x = rot;
		obj.rotation.y = rot;
	});*/
	
	requestAnimationFrame( animate );
	
	checkProjectileColisions();
	
	
	if (cpCounter == cpPace) {
		for (var i = 0; i < centipedes.length; i++) {
			centipedes[i].move(true);
		}
		cpCounter = 0;
	} else {
		cpCounter += 1;
	}
	/*for (var key in projectiles) {
		projectiles.get(key).move();
	}*/
	for (var projectile of projectiles.values()) {
		projectile.move();
	}
	
	controls.update();
	renderer.render( scene, camera );
};

animate();
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
		var geom = new THREE.SphereGeometry(0.2*square, 12, 12);
		const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		material.color.setHex(0xffa500);
		const mesh = new THREE.Mesh(geom, material);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.y = 0.5 * square;
		this.mesh = mesh;
		this.mesh.name = "projectile" + this.random.toString();
		this.syncMeshToGameLogic();
		scene.add(mesh);
	}
	move() {
		this.z -= 0.01;
		if (!onField(this.x, this.z)) {
			this.deleteFromScene();
		}
		this.syncMeshToGameLogic();
	}
	syncMeshToGameLogic() {
		var visXZ = logicToVisual(this.x, this.z);
		this.mesh.position.x = visXZ[0];
		this.mesh.position.z = visXZ[1];
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
		for (var i = 0; i < this.length; i++) {
			var geom = new THREE.SphereGeometry(0.6*square, 12, 12);
			const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
			material.color.setHex(0x00ee00);
			this.meshSegments[i] = new THREE.Mesh(geom, material);
			var visXZ = logicToVisual(this.segments[i][0], this.segments[i][1]);
			this.meshSegments[i].position.x = visXZ[0];
			this.meshSegments[i].position.z = visXZ[1];
			this.meshSegments[i].position.y = 0.5 * square;
			this.meshSegments[i].name = "Test";
			scene.add(this.meshSegments[i]);
		}
	}
	syncMeshToGameLogic() {
		for (var i = 0; i < this.length; i++) {
			var visXZ = logicToVisual(this.segments[i][0], this.segments[i][1]);
			this.meshSegments[i].position.x = visXZ[0];
			this.meshSegments[i].position.z = visXZ[1];
		}
	}
	move(retry) {
		var newX;
		var newZ;
		if (this.down) {
			newX = this.segments[0][0];
			newZ = this.segments[0][1]+1;
			this.down = false;
			if (this.direction === 'W') {
				this.direction = 'E';
			} else {
				this.direction = 'W';
			}
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
}

class Mushrooms {
	constructor() {
		this.map = Array(15);;
		for(var i = 0; i < 15; i++) {
			this.map[i] = Array(16);
			for (var j = 0; j < 16; j++) {
				this.map[i][j] = 0.0;
			}
		}
		for (var j = 1; j < 16; j++) {
			var randomX = Math.floor(Math.random()*15);
			if (j == 15 && randomX == 7) {
				randomX = 8;
			}
			this.map[randomX][j] = 4.0;
		}
		var mushGeom = new THREE.SphereGeometry(0.3*square, 12, 12);
		const material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
		material.color.setHex(0xcccccc);
		for (var i = 0; i < 15; i++) {
			for (var j = 0; j < 16; j++) {
				if (this.map[i][j] > 0.0) {
					const mesh = new THREE.Mesh(mushGeom, material);
					mesh.rotation.x = Math.PI / 2;
					mesh.position.y = 0.5 * square;
					var visXY = logicToVisual(i, j);
					mesh.position.x = visXY[0];
					mesh.position.z = visXY[1];
					scene.add(mesh);
				}
			}
		}

	}
	isIn(x,z) {
		if (x < 0 || z < 0 || x > 14 || z > 15) {
			return false;
		}
		return this.map[x][z] > 0.0
	}
	
}

addSolidGeometry(0, 0, -0.5*square, new THREE.PlaneGeometry(15*square, 16*square, 2, 2), 0x11aa44);
const axes = new THREE.AxesHelper( 15 );
scene.add(axes);
const guy = new Guy(7, 15, 0xaa1111);
const mushrooms = new Mushrooms();
const centipede = new Centipede(6, 'W', 7, 0, 1);
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
	if (cpCounter == cpPace) {
		centipede.move(true);
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
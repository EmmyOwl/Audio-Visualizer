var colors = [0xffffff, 0xffffff];
var cubeGeom = new THREE.BoxGeometry(.1, .1, .1);
var cubeMat = new THREE.MeshPhongMaterial(new THREE.Color(0x000000));
var tempV = new THREE.Vector3();
var starRaycaster = new THREE.Raycaster();
var pGalacticSystem;
var skyBox;
var mouse = new THREE.Vector2();
var count = 30000;

var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.0;

var goldenStars = [];
var isPickGolden = false;

// standard global variables
var container, galaxyScene, galaxyCamera, renderer, galaxycontrols, currentScene, currentCamera;
// custom global variables
var cube;
var glow, glowmap;

function constrain(v, min, max){
  if( v < min )
    v = min;
  else
  if( v > max )
    v = max;
  return v;
}

function random(low, high) {
  if (low >= high) return low;
  var diff = high - low;
  return (Math.random() * diff) + low;
}

function resizeRendererToDisplaySize(renderer) {
    var canvas = renderer.domElement;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    var needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

function generateGalaxy(){

	var loader = new THREE.TextureLoader();
	loader.setCrossOrigin("");
	var bluemap = loader.load( "images/wstar2.png" );
	var pickMat = loader.load( "images/star_preview.png" );
		
	var pMaterial = new THREE.PointsMaterial({
			map: bluemap,
            size: 800,
            transparent: true,
            opacity: 2,
			depthTest: false,
            vertexColors: true,
            sizeAttenuation: true,
            color: 0xffffff
        });	

	pGalaxy = new THREE.BufferGeometry();
    var particlesPos = [];
    var particlesColor = [];

	var numArms = 5;
	var arm = 0;
	var countPerArm = count / numArms;
	var ang = 0;
	var dist = 0;
	for( var i=0; i<count; i++ )
	{
		var x = Math.cos(ang) * dist;
		var y = 0;
		var z = Math.sin(ang) * dist;

		//	scatter
		var sa = 100 - Math.sqrt(dist); //	scatter amt
		if( Math.random() > 0.3)
			sa *= ( 1 + Math.random() ) * 4;
		x += random(-sa, sa);
		z += random(-sa, sa);

		var distanceToCenter = Math.sqrt( x*x + z*z);
		var thickness = constrain( Math.pow( constrain(90-distanceToCenter*0.1,0,100000),2) * 0.02,2,10000) + Math.random() * 120;
		y += random( -thickness, thickness);

		x *= 30;
		y *= 30;
		z *= 30;

		var p = new THREE.Vector3(x,y,z);
		p.size = 200 + constrain( 600/dist,0,32000);	
		if( Math.random() > 0.99 )
			p.size *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * .9;	
		else
			if( Math.random() > 0.7 )
				p.size *= 1 + Math.pow(1 + Math.random(), 2) * .04;

		if( i == 0 ){
			p.size = 100000;
		}
		//pGalaxy.vertices.push( p );
		particlesPos.push(p.x, p.y, p.z);

		var r = constrain(1 - (Math.pow(dist,3)*0.00000002),.3,1) + random(-.1,.1);
		var g = constrain(0.7 - (Math.pow(dist,2)*0.000001),.41,1) + random(-.1,.1);
		var b = constrain(0.1 + dist * 0.004,.3,.6) + random(-.1,.1);	
		var c = new THREE.Color();
		c.r = r; c.g = g; c.b = b;
		
		var c1 = new THREE.Color(colors[Math.floor(Math.random() * colors.length)])
		particlesColor.push(c1.r, c1.g, c1.b);

		ang += 0.0002;	
		dist += .08;

		if( i % countPerArm == 0 ){
			ang = Math.PI * 2 / numArms * arm;
			dist = 0;
			arm++;
		}
	}		

	pGalaxy.setAttribute('position', new THREE.Float32BufferAttribute(particlesPos, 3));
	pGalaxy.setAttribute('color', new THREE.Float32BufferAttribute(particlesColor, 3));
	pGalacticSystem = new THREE.Points(pGalaxy, pMaterial);

	//	make a top down image
	var galacticTopMaterial = new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture('images/galactictop.png'),
		blending: THREE.AdditiveBlending,
		depthTest: false,
		depthWrite: false,
		side: THREE.DoubleSide,
		transparent: true,
	});

	var plane = new THREE.Mesh( new THREE.PlaneGeometry(150000,150000, 30, 30), galacticTopMaterial );
	plane.rotation.x = Math.PI/2;
	plane.material.map.anisotropy = 1;
	pGalacticSystem.add( plane );
  
	pGalacticSystem.rotation.x = 0;
	pGalacticSystem.rotation.y = 0;
	pGalacticSystem.rotation.z = 50;

	return pGalacticSystem;
}

function updateGalaxy()
{
    let i = 0
    const samples = microphone.getSamples();
    const volume = microphone.getVolume();
    while (i < count) {
        var x = random(-3000,3000) * volume;
        var y = random(-3000,3000) * volume;
        var z = random(-3000,3000) * volume;
        pGalaxy.attributes.position.array[i * 3 + 0] += x;
        pGalaxy.attributes.position.array[i * 3 + 1] += y;
        pGalaxy.attributes.position.array[i * 3 + 2] += z;
        i++
    }

    pGalaxy.attributes.position.needsUpdate = true;
}

let galaxyAnimationId;

function initGalaxyVisualizer(mic)
{
    microphone = mic;
	// SCENE
	currentScene = galaxyScene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 60, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 2000000;
	currentCamera = galaxyCamera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	galaxyScene.add(galaxyCamera);
	galaxyCamera.position.set(0,2400,50000);
	galaxyCamera.lookAt(galaxyScene.position);
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true,alpha: true,premultipliedAlpha: true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualizerContainer').appendChild(renderer.domElement);
	// EVENTS
	//THREEx.WindowResize(renderer, galaxyCamera);
	
	var loader = new THREE.TextureLoader();
	
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	galaxyScene.add(light);
	
	pGalacticSystem = generateGalaxy();
	galaxyScene.add(pGalacticSystem);

	glowmap = loader.load("images/glow.png");
	
	var spriteMat = new THREE.SpriteMaterial({
				color: 0xffffff,
				map: glowmap,
				transparent: true,
				blending: THREE.AdditiveBlending,
				opacity: 0.8,
				depthTest: false,
				side: THREE.DoubleSide
			})
	spriteMat.map.minFilter = THREE.NearestFilter;

	var glow1 = new THREE.Sprite( spriteMat );
	glow1.scale.set(60000, 60000, 60000);
	pGalacticSystem.add(glow1);

	glow = new THREE.Sprite( spriteMat );
	glow.scale.set(80000, 30000, 80000);
	glow.position.set(0, 0, 0.1);
	pGalacticSystem.add(glow);

	var skyGeometry = new THREE.BoxGeometry( 2000000, 2000000, 2000000 );
	var materialArray = [];
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_px.jpg"),
			side: THREE.BackSide
		}));
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_nx.jpg"),
			side: THREE.BackSide
		}));
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_py.jpg"),
			side: THREE.BackSide
		}));
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_ny.jpg"),
			side: THREE.BackSide
		}));
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_pz.jpg" ),
			side: THREE.BackSide
		}));
	materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( "images/ss_skybox/s_nz.jpg" ),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	galaxyScene.add( skyBox );

	galaxycontrols = new THREE.TrackballControls( currentCamera, renderer.domElement );
	galaxycontrols.noPan = true;
	//galaxycontrols.enableZoom = false;
	galaxycontrols.minDistance = 100;
	galaxycontrols.maxDistance = 60000;

	window.addEventListener('click', onClick, false );
	window.addEventListener( 'resize', onWindowResize, false );
	
	function onWindowResize()
	{
		currentCamera.aspect = window.innerWidth / window.innerHeight;
		currentCamera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	
	animate();
	
	return {
        stop: function () {
            console.log("Stopping Galaxy visualizer");

            window.cancelAnimationFrame(galaxyAnimationId);
            document.getElementById('visualizerContainer').removeChild(renderer.domElement);
            galaxycontrols.dispose();
            window.removeEventListener('resize', onWindowResize);
        },
    };
	
	function onClick( event )
	{
		event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		isPickGolden = true;
	}
}

function animate() 
{
    galaxysAnimationId = requestAnimationFrame(() => animate());
    //requestAnimationFrame( animate );
	render();
	update();
}

function update()
{
    if (microphone.initialized) {
        updateGalaxy();
    }
	galaxycontrols.update();
}

var x = 0;
function render() 
{
    pGalacticSystem.geometry.__dirtyVertices = true;
    pGalacticSystem.rotation.y = x;
    glow.material.rotation.z = -currentCamera.rotation.z;
    x -= 0.001;
    
    galaxycontrols.minDistance = 100;
    galaxycontrols.maxDistance = 60000;

	renderer.render( currentScene, currentCamera );
}
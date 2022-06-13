import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Player } from '../../libs/Player.js';

class App{
    constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
        this.loadingBar = new LoadingBar();

		//this.assetsPath = './assets/';
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        //this.setEnvironment();
        
        this.workingVec3 = new THREE.Vector3();
        
        this.initScene();
        this.setupXR();
		
		window.addEventListener('resize', this.resize.bind(this));
        
	}
    loadModelA(){
        const loader = new GLTFLoader();
		const self = this;
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`./assets/3d/slime.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				const object = gltf.scene.children[5];
				
				const options = {
					object: object,
					speed: 0.5,
					assetsPath: './assets/3d/',
					loader: loader,
                    animations: gltf.animations,
					clip: gltf.animations[0],
					app: self,
					name: 'slime',
					npc: false
				};
				
				self.slime = new Player(options);
                self.slime.object.visible = false;
				
				self.slime.action = 'animation_0';
				const scale = 0.005;
				self.slime.object.scale.set(scale, scale, scale); 
				
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self) );
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);

			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
    }
    initScene(){
        this.loadModelA();   
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15 ,0.2 ,32 ).rotateX(-Math.PI/2),
            new THREE.MeshBasicMaterial( { color: 0xFFFFFF } )
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
    }
    
    setupXR(){
        
        this.renderer.xr.enabled = true;
        
        const btn = new ARButton( this.renderer, { sessionInit: { requiredFeatures: [ 'hit-test' ], optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
        
        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        function onSelect() {
            
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );  

        // agregas el boton asi pero esto es con la instanciacion de la libreria modificada
        // en caso de que quieras ocupar la libreria original ocupa los siguientes lineas de codigo 
        // document.body.apppendChild(
        //      ARButton.createButton ( this.renderer );   
        // );
        // En este caso ocuparemos la libreria modificada por Nik Lever
        // const btn = new ARButton( this.renderer ); // esta linea (Nik L)
    }

    requestHitTestSource(){
        const self = this;
        const session = this.renderer.xr.getSession();
        session.requestReferenceSpace ('viewer').then(function(referenceSpace){
            session.requestHitTestSource({space: referenceSpace}).then(
                function(source){
                    self.hitTestSource = source;
                })
        });
        session.addEventListener('end',function(){
            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;
        });
        this.hitTestSourceRequested = true;


    }
    
    getHitTestResults( frame ){
        const hitTestResult = frame.getHitTestResults(this.hitTestSource);
        if(hitTestResult.length){
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResult[0];
            const pose = hit.getPose(referenceSpace);
            this.reticle.visible = true;
            this.reticle.matrix.fromArray(pose.transform.matrix);

        }else{
            this.reticle.visible = false;
        }
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
    render( timestamp, frame ) {
        const dt = this.clock.getDelta();
        if (this.slime) this.slime.update(dt);

        const self = this;
        
        if ( frame ) {

            if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

            if ( this.hitTestSource ) this.getHitTestResults( frame );

        }

        this.renderer.render( this.scene, this.camera );
    }
}

export { App };



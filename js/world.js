class World3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        
        this.lights = [];
        this.ambientLight = null;
        this.dirLight = null;
        this.currentEnvironmentGroup = null;
        this.handMeshGroup = null;
        this.flashlight = null;
        this.bobTimer = 0;
        this.hallucinationMesh = null;
        this.keycardMesh = null;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.getElementById('threeCanvasContainer').appendChild(this.renderer.domElement);

        this.scene.background = new THREE.Color(0x1a202c);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        this.dirLight.position.set(5, 10, 5);
        this.scene.add(this.dirLight);

        this.camera.position.set(0, 1.6, 0);

        this.buildHandAndFlashlight();
        this.buildHomeRoom();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    buildHandAndFlashlight() {
        this.handMeshGroup = new THREE.Group();

        const armGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2b3e50, roughness: 0.8 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.rotation.x = Math.PI / 2.5;
        arm.position.set(0.22, -0.22, -0.3);

        const flashlightGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.22, 12);
        const flashlightMat = new THREE.MeshStandardMaterial({ color: 0x111822, metalness: 0.8, roughness: 0.2 });
        const flashlightMesh = new THREE.Mesh(flashlightGeo, flashlightMat);
        flashlightMesh.rotation.x = Math.PI / 2;
        flashlightMesh.position.set(0.22, -0.18, -0.38);

        this.flashlight = new THREE.SpotLight(0xffffff, 2.5, 25, Math.PI / 6, 0.4, 1);
        this.flashlight.position.set(0.22, -0.18, -0.38);
        this.flashlight.target.position.set(0.22, -0.18, -5);

        this.handMeshGroup.add(arm);
        this.handMeshGroup.add(flashlightMesh);
        this.handMeshGroup.add(this.flashlight);
        this.handMeshGroup.add(this.flashlight.target);

        this.camera.add(this.handMeshGroup);
        this.scene.add(this.camera);
        this.handMeshGroup.visible = false;
    }

    buildHomeRoom() {
        if (this.currentEnvironmentGroup) {
            this.scene.remove(this.currentEnvironmentGroup);
        }

        this.currentEnvironmentGroup = new THREE.Group();
        this.scene.background = new THREE.Color(0x1a202c);
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.9;

        const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.4 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xdde5ed, roughness: 0.7 });
        const furnitureMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.5 });

        const floorGeo = new THREE.PlaneGeometry(12, 12);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, 0);
        this.currentEnvironmentGroup.add(floor);

        const wallGeo = new THREE.PlaneGeometry(12, 4);

        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, 2, -6);
        this.currentEnvironmentGroup.add(backWall);

        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-6, 2, 0);
        this.currentEnvironmentGroup.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(6, 2, 0);
        this.currentEnvironmentGroup.add(rightWall);

        const bedGeo = new THREE.BoxGeometry(2.2, 0.6, 3.5);
        const bed = new THREE.Mesh(bedGeo, furnitureMat);
        bed.position.set(-4, 0.3, -4);
        this.currentEnvironmentGroup.add(bed);

        const deskGeo = new THREE.BoxGeometry(3, 1, 1.5);
        const desk = new THREE.Mesh(deskGeo, furnitureMat);
        desk.position.set(3.5, 0.5, -4.5);
        this.currentEnvironmentGroup.add(desk);

        const momGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.6);
        const momMat = new THREE.MeshStandardMaterial({ color: 0xe63946 });
        const momMesh = new THREE.Mesh(momGeo, momMat);
        momMesh.position.set(0, 0.8, -3);
        this.currentEnvironmentGroup.add(momMesh);

        this.scene.add(this.currentEnvironmentGroup);
        this.camera.position.set(0, 1.6, 2);
        this.camera.rotation.set(0, 0, 0);
    }

    buildOperatingRoom() {
        if (this.currentEnvironmentGroup) {
            this.scene.remove(this.currentEnvironmentGroup);
        }

        this.currentEnvironmentGroup = new THREE.Group();
        this.scene.background = new THREE.Color(0x0a121d);
        this.ambientLight.color.setHex(0x90e0ef);
        this.ambientLight.intensity = 0.6;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b3e50, roughness: 0.3 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e2d3b, roughness: 0.2 });

        const roomGeo = new THREE.BoxGeometry(10, 4, 10);
        const room = new THREE.Mesh(roomGeo, wallMat);
        room.position.set(0, 2, 0);
        this.currentEnvironmentGroup.add(room);

        const floorGeo = new THREE.PlaneGeometry(10, 10);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.01, 0);
        this.currentEnvironmentGroup.add(floor);

        const surgLight = new THREE.SpotLight(0xffffff, 3.5);
        surgLight.position.set(0, 3.8, 0);
        surgLight.angle = Math.PI / 3;
        surgLight.penumbra = 0.5;
        this.currentEnvironmentGroup.add(surgLight);

        const docGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7);
        const docMat = new THREE.MeshStandardMaterial({ color: 0x00a896 });
        
        const doc1 = new THREE.Mesh(docGeo, docMat);
        doc1.position.set(-1.2, 0.85, -0.5);
        this.currentEnvironmentGroup.add(doc1);

        const doc2 = new THREE.Mesh(docGeo, docMat);
        doc2.position.set(1.2, 0.85, -0.5);
        this.currentEnvironmentGroup.add(doc2);

        this.scene.add(this.currentEnvironmentGroup);
        this.camera.position.set(0, 0.8, 0.5);
        this.camera.rotation.set(-Math.PI / 4, 0, 0);
        this.handMeshGroup.visible = false;
    }

    switchToCorridor(actLength) {
        if (this.currentEnvironmentGroup) {
            this.scene.remove(this.currentEnvironmentGroup);
        }

        this.currentEnvironmentGroup = new THREE.Group();
        this.scene.background = new THREE.Color(0x05080c);
        this.scene.fog = new THREE.FogExp2(0x05080c, 0.035);
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.7;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x24303e, roughness: 0.6 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f1722, roughness: 0.3 });
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x3a4758, roughness: 0.5 });

        const floorGeo = new THREE.PlaneGeometry(6, actLength);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -actLength / 2);
        this.currentEnvironmentGroup.add(floor);

        const wallGeo = new THREE.PlaneGeometry(actLength, 3.5);

        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-3, 1.75, -actLength / 2);
        this.currentEnvironmentGroup.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(3, 1.75, -actLength / 2);
        this.currentEnvironmentGroup.add(rightWall);

        for (let z = -10; z > -actLength + 20; z -= 15) {
            const doorGeo = new THREE.BoxGeometry(0.1, 2.4, 1.3);
            const leftDoor = new THREE.Mesh(doorGeo, doorMat);
            leftDoor.position.set(-2.95, 1.2, z);
            this.currentEnvironmentGroup.add(leftDoor);

            const light = new THREE.PointLight(0x00ff66, 1.2, 14);
            light.position.set(0, 3.1, z);
            this.currentEnvironmentGroup.add(light);
            this.lights.push(light);
        }

        const keycardGeo = new THREE.BoxGeometry(0.2, 0.02, 0.3);
        const keycardMat = new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 0.5 });
        this.keycardMesh = new THREE.Mesh(keycardGeo, keycardMat);
        this.keycardMesh.position.set(0, 0.8, -45);
        this.currentEnvironmentGroup.add(this.keycardMesh);

        const shadowGeo = new THREE.BoxGeometry(0.8, 1.8, 0.3);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        this.hallucinationMesh = new THREE.Mesh(shadowGeo, shadowMat);
        this.hallucinationMesh.position.set(0, 0.9, -100);
        this.currentEnvironmentGroup.add(this.hallucinationMesh);

        this.scene.add(this.currentEnvironmentGroup);
        this.camera.rotation.set(0, 0, 0);
        this.camera.position.set(0, 1.6, 0);
        this.handMeshGroup.visible = true;
    }

    transformToAct2World() {
        this.scene.fog.color.setHex(0x0b020d);
        this.scene.background.setHex(0x0b020d);
        this.lights.forEach(light => {
            light.color.setHex(0x9d4edd);
            light.intensity = 1.5;
        });
    }

    transformToAct3Collapse() {
        this.scene.fog.color.setHex(0x2b0000);
        this.scene.background.setHex(0x2b0000);
        this.lights.forEach(light => {
            light.color.setHex(0xff0000);
            light.intensity = 2.0;
        });
    }

    triggerBlackout() {
        this.lights.forEach(light => {
            light.color.setHex(0xff1e43);
            light.intensity = 0.2;
        });
        this.scene.fog.color.setHex(0x010102);
        this.scene.background.setHex(0x010102);
    }

    update(playerPos, isMoving, state) {
        if (state === 6) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (playerPos) {
            this.camera.position.x = playerPos.x;
            this.camera.position.z = playerPos.z;
        }

        if (isMoving) {
            this.bobTimer += 0.18;
            this.camera.position.y = 1.6 + Math.sin(this.bobTimer) * 0.05;
            if (this.handMeshGroup) {
                this.handMeshGroup.position.y = Math.sin(this.bobTimer * 2) * 0.02;
                this.handMeshGroup.position.x = Math.cos(this.bobTimer) * 0.02;
            }
        } else {
            this.camera.position.y = 1.6;
            if (this.handMeshGroup) {
                this.handMeshGroup.position.set(0, 0, 0);
            }
        }

        if (this.keycardMesh) {
            this.keycardMesh.rotation.y += 0.02;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
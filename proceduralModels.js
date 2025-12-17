// Procedural 3D Asset Generator - Create player models, stadium elements, and dynamic objects
// Note: THREE is loaded globally via <script> tags in index.html

export class ProceduralModelGenerator {
    /**
     * Create a 3D soccer player model
     * @param {Object} config - Player configuration { height, skinColor, jerseyColor, number }
     */
    static createPlayerModel(config = {}) {
        const {
            height = 1.8,
            skinColor = 0xf4a460,
            jerseyColor = 0xff0000,
            shortsColor = 0x000000,
            socksColor = 0xffffff,
            number = '1'
        } = config;

        const group = new THREE.Group();
        const scale = height / 1.8;

        // Head
        const headGeo = new THREE.SphereGeometry(0.12 * scale, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5 * scale;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        // Body/Jersey
        const bodyGeo = new THREE.BoxGeometry(0.3 * scale, 0.6 * scale, 0.25 * scale);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: jerseyColor,
            roughness: 0.5,
            metalness: 0.0
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9 * scale;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Add number texture to jersey
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, 32, 32);
        const numberTexture = new THREE.CanvasTexture(canvas);
        const numberMat = new THREE.MeshBasicMaterial({ map: numberTexture });
        const numberGeo = new THREE.PlaneGeometry(0.2 * scale, 0.25 * scale);
        const numberPlane = new THREE.Mesh(numberGeo, numberMat);
        numberPlane.position.z = 0.13 * scale;
        numberPlane.position.y = 0.9 * scale;
        group.add(numberPlane);

        // Left Arm
        const leftArmGeo = new THREE.CapsuleGeometry(0.08 * scale, 0.7 * scale, 4, 8);
        const armMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.4
        });
        const leftArm = new THREE.Mesh(leftArmGeo, armMat);
        leftArm.position.x = -0.2 * scale;
        leftArm.position.y = 1.0 * scale;
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        group.add(leftArm);

        // Right Arm
        const rightArm = leftArm.clone();
        rightArm.position.x = 0.2 * scale;
        rightArm.castShadow = true;
        group.add(rightArm);

        // Shorts
        const shortsGeo = new THREE.BoxGeometry(0.3 * scale, 0.25 * scale, 0.25 * scale);
        const shortsMat = new THREE.MeshStandardMaterial({
            color: shortsColor,
            roughness: 0.6
        });
        const shorts = new THREE.Mesh(shortsGeo, shortsMat);
        shorts.position.y = 0.45 * scale;
        shorts.castShadow = true;
        shorts.receiveShadow = true;
        group.add(shorts);

        // Left Leg
        const legGeo = new THREE.CapsuleGeometry(0.07 * scale, 0.75 * scale, 4, 8);
        const legMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.4
        });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.x = -0.12 * scale;
        leftLeg.position.y = 0.1 * scale;
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        group.add(leftLeg);

        // Right Leg
        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 0.12 * scale;
        rightLeg.castShadow = true;
        group.add(rightLeg);

        // Left Sock
        const sockGeo = new THREE.CapsuleGeometry(0.07 * scale, 0.2 * scale, 4, 8);
        const sockMat = new THREE.MeshStandardMaterial({
            color: socksColor,
            roughness: 0.5
        });
        const leftSock = new THREE.Mesh(sockGeo, sockMat);
        leftSock.position.x = -0.12 * scale;
        leftSock.position.y = -0.3 * scale;
        leftSock.castShadow = true;
        leftSock.receiveShadow = true;
        group.add(leftSock);

        // Right Sock
        const rightSock = leftSock.clone();
        rightSock.position.x = 0.12 * scale;
        rightSock.castShadow = true;
        group.add(rightSock);

        // Left Boot
        const bootGeo = new THREE.BoxGeometry(0.12 * scale, 0.15 * scale, 0.25 * scale);
        const bootMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.2
        });
        const leftBoot = new THREE.Mesh(bootGeo, bootMat);
        leftBoot.position.x = -0.12 * scale;
        leftBoot.position.y = -0.5 * scale;
        leftBoot.castShadow = true;
        leftBoot.receiveShadow = true;
        group.add(leftBoot);

        // Right Boot
        const rightBoot = leftBoot.clone();
        rightBoot.position.x = 0.12 * scale;
        rightBoot.castShadow = true;
        group.add(rightBoot);

        group.castShadow = true;
        group.receiveShadow = true;
        
        // Store limb references for animation
        group.userData.limbs = {
            legL: leftLeg,
            legR: rightLeg,
            armL: leftArm,
            armR: rightArm
        };
        group.userData.torso = body;
        
        return group;
    }

    /**
     * Create an enhanced soccer ball
     */
    static createSoccerBall(radius = 0.22) {
        const group = new THREE.Group();

        // Main sphere
        const ballGeo = new THREE.IcosahedronGeometry(radius, 4);
        const ballMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.1,
            map: this.createBallTexture()
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.castShadow = true;
        ball.receiveShadow = true;
        group.add(ball);

        return group;
    }

    /**
     * Create ball texture (pentagon pattern)
     */
    static createBallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // White base
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);

        // Black pentagons
        ctx.fillStyle = '#000000';
        const size = 80;
        const cols = 512 / size;
        const rows = 512 / size;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row + col) % 2 === 0) {
                    const x = col * size + size / 2;
                    const y = row * size + size / 2;
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 72 * Math.PI) / 180;
                        const px = x + (size / 2.5) * Math.cos(angle);
                        const py = y + (size / 2.5) * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Create stadium elements
     */
    static createGoalPost() {
        const group = new THREE.Group();

        // Post geometry
        const postRadius = 0.12;
        const postHeight = 2.44;
        const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
        const postMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.4
        });

        // Left post
        const leftPost = new THREE.Mesh(postGeo, postMat);
        leftPost.position.set(-3.66, postHeight / 2, 0);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        group.add(leftPost);

        // Right post
        const rightPost = new THREE.Mesh(postGeo, postMat);
        rightPost.position.set(3.66, postHeight / 2, 0);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        group.add(rightPost);

        // Crossbar
        const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, 7.32, 16);
        const crossbar = new THREE.Mesh(crossbarGeo, postMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.y = postHeight;
        crossbar.castShadow = true;
        crossbar.receiveShadow = true;
        group.add(crossbar);

        // Net
        this.createGoalNet(group);

        return group;
    }

    /**
     * Create goal net
     */
    static createGoalNet(parentGroup) {
        const netGeo = new THREE.BoxGeometry(7.32, 2.44, 2);
        const netMat = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            wireframe: false,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const net = new THREE.Mesh(netGeo, netMat);
        net.position.z = -1;
        net.position.y = 2.44 / 2;
        net.castShadow = true;
        net.receiveShadow = true;
        parentGroup.add(net);
    }

    /**
     * Create corner flag
     */
    static createCornerFlag() {
        const group = new THREE.Group();

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.6 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.castShadow = true;
        group.add(pole);

        // Flag
        const flagGeo = new THREE.BoxGeometry(0.6, 0.4, 0.02);
        const flagMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0.3, 1.2, 0);
        flag.castShadow = true;
        flag.receiveShadow = true;
        group.add(flag);

        return group;
    }

    /**
     * Create crowd element (simplified)
     */
    static createCrowdSegment(width = 10, depth = 2) {
        const group = new THREE.Group();
        const personSize = 0.3;

        for (let x = 0; x < width; x += personSize * 1.5) {
            for (let z = 0; z < depth; z += personSize * 1.5) {
                const person = this.createSimplePerson();
                person.position.set(x - width / 2, 0, z);
                person.scale.set(0.6, 0.6, 0.6);
                group.add(person);
            }
        }

        return group;
    }

    /**
     * Create simplified person for crowd
     */
    static createSimplePerson() {
        const group = new THREE.Group();
        const color = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00][Math.floor(Math.random() * 4)];

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.1),
            new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
        );
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xf4a460 })
        );
        head.position.y = 0.2;
        head.castShadow = true;
        group.add(head);

        return group;
    }

    /**
     * Create stadium lighting rig
     */
    static createLightingRig() {
        const group = new THREE.Group();

        // Floodlights at corners
        const positions = [
            { x: -50, y: 40, z: -50 },
            { x: 50, y: 40, z: -50 },
            { x: -50, y: 40, z: 50 },
            { x: 50, y: 40, z: 50 }
        ];

        positions.forEach(pos => {
            const light = new THREE.SpotLight(0xffffff, 2, 200, Math.PI / 3, 0.5, 2);
            light.position.set(pos.x, pos.y, pos.z);
            light.target.position.set(0, 0, 0);
            light.castShadow = true;
            group.add(light);
            group.add(light.target);
        });

        return group;
    }
}

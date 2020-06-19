(function ($) {

    $.fn.panorama = function (options) {
        this.each(function () {

            var optionsPresets = {
                fov : 90
            };
            $.extend(optionsPresets, options);

            var data = {
                context : '',
                vShader : '',
                fShader : '',
                pShader : '',
                animationId : 0,
                phi : -90,
                phiOld : 0,
                theta : 0,
                thetaOld : 0,
                mousedown : false,
                mousePosX : 0,
                mousePosY : 0,
                mousePosOldX : 0,
                mousePosOldY : 0,

                texture_left : '',
                texture_right : '',
                texture_down : '',
                texture_up : '',
                texture_front : '',
                texture_back : '',

                img_right : '',
                img_left : '',
                img_up : '',
                img_down : '',
                img_back : '',
                img_front : '',
                options : optionsPresets
            };

            $(this).mousemove(function (evt) {//마우스 움직임
                if (data.mousedown) {
                    data.mousePosX = evt.pageX;//x좌표
                    data.mousePosY = evt.pageY;//y좌표
                    data.phi = data.phiOld + 0.2 * (data.mousePosX - data.mousePosOldX);
                    data.theta = data.thetaOld - 0.2 * (data.mousePosY - data.mousePosOldY);
                    if (data.theta > 90) {data.theta = 90; }
                    if (data.theta < -90) {data.theta = -90; }
                }
            });
            $(this).mousedown(function (evt) {
                data.mousedown = true;
                data.phiOld = data.phi;
                data.thetaOld = data.theta;
                data.mousePosOldX = evt.pageX;
                data.mousePosOldY = evt.pageY;
            });
            $(this).mouseup(function () {
                data.mousedown = false;
            });
            $(this).mouseout(function () {
                data.mousedown = false;
            });

            data.context = this.getContext('experimental-webgl');

            // 그래픽 초기화부분
            initWebGL(data);
            initShaders(data);
            createModel(data);

            // main 루프로 가는단계
            data.animationId = requestAnimationFrame(function () {return draw(data); });

        });
        return this;
    }



    function initWebGL(data) {//초기화 중 initWebGL부분

            var gl = data.context;      
            //6장의 사진 앞~뒤를 모두 초기화
            data.texture_right = gl.createTexture();
            data.img_right = new Image();
//            data.img_right.crossOrigin = "anonymous";//이 부분 모두 동일하게 추가.right~front
            data.img_right.onload = function() { handleTextureLoaded(data, data.img_right, data.texture_right); }
            data.img_right.src = data.options.right;
            
            data.texture_left = gl.createTexture();
            data.img_left = new Image();
            data.img_left.crossOrigin = "anonymous";
            data.img_left.onload = function() { handleTextureLoaded(data, data.img_left, data.texture_left); }
            data.img_left.src = data.options.left;
            
            data.texture_up = gl.createTexture();
            data.img_up = new Image();
            data.img_up.crossOrigin = "anonymous";
            data.img_up.onload = function() { handleTextureLoaded(data, data.img_up, data.texture_up); }
            data.img_up.src = data.options.up;

            data.texture_down = gl.createTexture();
            data.img_down = new Image();
            data.img_down.crossOrigin = "anonymous";
            data.img_down.onload = function() { handleTextureLoaded(data, data.img_down, data.texture_down); }
            data.img_down.src = data.options.down;

            data.texture_back = gl.createTexture();
            data.img_back = new Image();
            data.img_back.crossOrigin = "anonymous";
            data.img_back.onload = function() { handleTextureLoaded(data, data.img_back, data.texture_back); }
            data.img_back.src = data.options.back;

            data.texture_front = gl.createTexture();
            data.img_front = new Image();
            data.img_front.crossOrigin = "anonymous";
            data.img_front.onload = function() { handleTextureLoaded(data, data.img_front, data.texture_front); }
            data.img_front.src = data.options.front;
    }



    // 이미지 오브젝트로 WebGL texture를 생성
    function handleTextureLoaded(data, image, texture) {
        var gl = data.context;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }



    function getVertexShader() {
        return "\
            attribute vec4 aPosition;\
            attribute vec2 aUV;\
            uniform mat4 modelviewMatrix;\
            uniform mat4 projectionMatrix;\
            varying vec2 vUV;\
            void main() {\
                gl_Position = projectionMatrix * modelviewMatrix * aPosition;\
                vUV = aUV;\
            }\
        ";
    }



    function getFragmentShader() {
        return "\
            precision mediump float;\
            varying vec2 vUV;\
            uniform sampler2D uSampler;\
            void main() {\
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\
                gl_FragColor = texture2D(uSampler, vUV);\
            }\
        ";
    }



    // shader 초기화
    function initShaders(data) {
        var gl = data.context;

        data.pShader = gl.createProgram();

        data.vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(data.vShader, getVertexShader());
        gl.compileShader(data.vShader);
        gl.attachShader(data.pShader, data.vShader);

        data.fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(data.fShader, getFragmentShader());
        gl.compileShader(data.fShader);
        gl.attachShader(data.pShader, data.fShader);

        gl.linkProgram(data.pShader);

        gl.useProgram(data.pShader);
    }



    // 큐브모델 생성(사진6장을 보여주기 위함)
    function createModel(data) {

        // (x, y, z, u, v)
        var vertices = new Float32Array([ 
        -1.0, -1.0,  1.0, 0.0, 1.0,
         1.0, -1.0,  1.0, 1.0, 1.0,
         1.0,  1.0,  1.0, 1.0, 0.0,
        -1.0,  1.0,  1.0, 0.0, 0.0,

        -1.0, -1.0, -1.0, 1.0, 1.0,
        -1.0,  1.0, -1.0, 1.0, 0.0,
         1.0,  1.0, -1.0, 0.0, 0.0,
         1.0, -1.0, -1.0, 0.0, 1.0,

        -1.0,  1.0, -1.0, 0.0, 0.0,
        -1.0,  1.0,  1.0, 0.0, 1.0,
         1.0,  1.0,  1.0, 1.0, 1.0,
         1.0,  1.0, -1.0, 1.0, 0.0,

        -1.0, -1.0, -1.0, 0.0, 1.0,
         1.0, -1.0, -1.0, 1.0, 1.0,
         1.0, -1.0,  1.0, 1.0, 0.0,
        -1.0, -1.0,  1.0, 0.0, 0.0,

         1.0, -1.0, -1.0, 1.0, 1.0,
         1.0,  1.0, -1.0, 1.0, 0.0,
         1.0,  1.0,  1.0, 0.0, 0.0,
         1.0, -1.0,  1.0, 0.0, 1.0,

        -1.0, -1.0, -1.0, 0.0, 1.0,
        -1.0, -1.0,  1.0, 1.0, 1.0,
        -1.0,  1.0,  1.0, 1.0, 0.0,
        -1.0,  1.0, -1.0, 0.0, 0.0
        ]);

        // 큐브의 각 점을 정의
        // 한 줄이 하나의 삼각형 의미
        // 두 줄을 합쳐서 큐브의 한 면을 의미
        var indices = new Uint16Array([
            0, 1, 2,
            2, 3, 0,

            4, 5, 6,
            6, 7, 4,

            8, 9, 10,
            10, 11, 8,

            12, 13, 14,
            14, 15, 12,

            16, 17, 18,
            18, 19, 16,

            20, 21, 22,
            22, 23, 20
        ]);

        var gl = data.context;

        // 꼭지점들을 버퍼에 저장
        var vertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // 인덱스 버퍼에 저장
        var indexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // 정점데이터를 찾을 위치를 알려줌
        var vertexAttribLoc = gl.getAttribLocation(data.pShader, "aPosition");
        var vertexAttribLocUV = gl.getAttribLocation(data.pShader, "aUV");
        gl.enableVertexAttribArray(vertexAttribLoc);
        gl.enableVertexAttribArray(vertexAttribLocUV);
        gl.vertexAttribPointer(vertexAttribLoc, 3, gl.FLOAT, false, 5*4, 0);
        gl.vertexAttribPointer(vertexAttribLocUV, 2, gl.FLOAT, false, 5*4, 3*4);
    }



    function draw(data) {
        var gl = data.context;

        // 구면 좌표에서 보는 방향을 계산
        var dirX = Math.cos(Math.PI * data.phi / 180) * Math.cos(Math.PI * data.theta / 180);
        var dirY = Math.sin(Math.PI * data.theta / 180);
        var dirZ = Math.sin(Math.PI * data.phi / 180) * Math.cos(Math.PI * data.theta / 180);
        var viewerDirection = new Vec3(dirX, dirY, dirZ);

        // 카메라 위치 초기화
        var viewerPosition = new Vec3(0.0, 0.0, 0.0);

        // 시야 방향에 따라 카메라 계산
        var modelviewMatrix = new Aff3d();
        modelviewMatrix.lookAt(viewerPosition, viewerPosition.add(viewerDirection), new Vec3(0.0, 1.0, 0.0));

        var projectionMatrix = new Aff3d();
        var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        projectionMatrix.perspective(data.options.fov, aspect, 0.1, 2);

        // clear screen
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // shader에게 파라미터 전달
        gl.uniformMatrix4fv(gl.getUniformLocation(data.pShader, "modelviewMatrix"), false, modelviewMatrix.data());
        gl.uniformMatrix4fv(gl.getUniformLocation(data.pShader, "projectionMatrix"), false, projectionMatrix.data());
        gl.uniform1i(gl.getUniformLocation(data.pShader, "uSampler"), 0);

        // 큐브 맵의 해당 texture로 큐브의 각 면을 그림
        gl.bindTexture(gl.TEXTURE_2D, data.texture_back);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindTexture(gl.TEXTURE_2D, data.texture_front);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6*2);
        gl.bindTexture(gl.TEXTURE_2D, data.texture_up);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12*2);
        gl.bindTexture(gl.TEXTURE_2D, data.texture_down);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 18*2);
        gl.bindTexture(gl.TEXTURE_2D, data.texture_right);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24*2);
        gl.bindTexture(gl.TEXTURE_2D, data.texture_left);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 30*2);

        data.animationId = requestAnimationFrame(function() {return draw(data);});
    }


    function Aff3d() {

        this.values = new Float32Array(16);

        this.setToZero = function() {
            var i;
            for(i=0; i<16; ++i) this.values[i] = 0;
        }

        this.setToIdentity = function() {
            var i;
            for(i=0; i<16; ++i) this.values[i] = 0;
            for(i=0; i< 4; ++i) this.values[4*i+i] = 1;
        }

        // 카메라 matrix계산
        this.lookAt = function(pos, center, up) {
            if(pos.sub(center).norm2() == 0) {
                this.setToIdentity();
            } else {

                var dirNormalized = center.sub(pos).normalize();
                var somehowUpNormalized = up.normalize();
                var thirdDirection = dirNormalized.cross(somehowUpNormalized).normalize();
                var upNormalized = thirdDirection.cross(dirNormalized).normalize();

                this.values[ 0] = thirdDirection.x;
                this.values[ 4] = thirdDirection.y;
                this.values[ 8] = thirdDirection.z;

                this.values[ 1] = upNormalized.x;
                this.values[ 5] = upNormalized.y;
                this.values[ 9] = upNormalized.z;           

                this.values[ 2] = -dirNormalized.x;
                this.values[ 6] = -dirNormalized.y;
                this.values[10] = -dirNormalized.z;

                this.values[ 3] = 0;
                this.values[ 7] = 0;
                this.values[11] = 0;
                this.values[15] = 1;

                this.values[12] = -thirdDirection.dot(pos);
                this.values[13] = -upNormalized.dot(pos);
                this.values[14] =  dirNormalized.dot(pos);  
            }
        }

        // projection matrix 계산
        this.perspective = function(fovy, aspect, near, far) {
            this.setToZero();
            var f = cot(fovy * Math.PI / 360.0);
            this.values[ 0] = f / aspect;
            this.values[ 5] = f;
            this.values[10] = (far + near) / (near - far);
            this.values[11] = -1;
            this.values[14] = (2 * far * near) / (near - far);
        }

        this.data = function() {
            return this.values;
        }
    }



    //3D vectors 클래스
    function Vec3( x, y, z ) {

        this.x = x;
        this.y = y;
        this.z = z;

        this.add = function(vec) {
            return new Vec3(x + vec.x, y + vec.y, z + vec.z);
        }

        this.sub = function(vec) {
            return new Vec3(x - vec.x, y - vec.y, z - vec.z);
        }

        this.dot = function(vec) {
            return x * vec.x + y * vec.y + z * vec.z;
        }

        this.scale = function(s) {
            return new Vec3(x*s, y*s, z*s);
        }

        this.cross = function(vec) {
            return new Vec3(y*vec.z - z*vec.y, z*vec.x - x*vec.z, x*vec.y - y*vec.x);
        }

        this.norm2 = function() {
            return x*x + y*y + z*z;
        }

        this.norm = function() {
            return Math.sqrt( this.norm2() );
        }

        this.normalize = function() {
            var length = this.norm();
            if( length>0 ) {
                return this.scale(1.0 / length);
            } else {
                return this;
            }
        }
    }



    // 코탄젠트 값 계산
    function cot(value) {
        return 1.0 / Math.tan(value);
    }

}(jQuery));

"use strict";

$(function () {
  var dom_textures = {};
  var svg_textures = {};
  var canvas_textures = {};
  var svg_loader = Promise.all($(".svg-texture").toArray().map(function (dom) {
    return new Promise(function (resolve, reject) {
      var svg = $(dom);
      var canvas = $("<canvas></canvas>");
      canvas.attr({
        width: svg.attr("width"),
        height: svg.attr("height")
      });
      //console.log(svg.attr("id"));
      var ctx = canvas.get(0).getContext("2d");

      var img = new Image();
      var svgString = new XMLSerializer().serializeToString(svg[0]);

      img.onload = function () {
        ctx.drawImage(img, 0, 0);
        resolve({
          id: svg.attr("id"),
          dom: dom,
          svg: svg,
          canvas: canvas
        });
      };

      img.setAttribute("src", "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svgString))));
    }).then(function (val) {
      //console.log(`canvas: ${val.id}`);
      var texture = new THREE.Texture(val.canvas[0]);
      texture.needsUpdate = true;
      return Object.assign(val, { texture: texture });
    });
  })).then(function (arr) {
    var ids = [];
    var canvases = {};
    var textures = {};
    for (var i = 0; i < arr.length; i++) {
      ids.push(arr[i].id);
      canvases[arr[i].id] = arr[i].canvas;
      textures[arr[i].id] = arr[i].texture;
    }
    return svg_textures = {
      arr: arr,
      ids: ids,
      canvases: canvases,
      textures: textures
    };
  });
  var canvas_loader = Promise.all($(".canvas-texture").toArray().map(function (dom) {
    return new Promise(function (resolve, reject) {
      var canvas = $(dom);
      //console.log(canvas.attr("id"));
      var texture = new THREE.Texture(val.canvas[0]);

      resolve({
        id: canvas.attr("id"),
        dom: dom,
        canvas: canvas,
        texture: texture
      });
    });
  })).then(function (arr) {
    var ids = [];
    var canvases = {};
    var textures = {};
    for (var i = 0; i < arr.length; i++) {
      ids.push(arr[i].id);
      canvases[arr[i].id] = arr[i].canvas;
      textures[arr[i].id] = arr[i].texture;
    }
    return canvas_textures = {
      arr: arr,
      ids: ids,
      canvases: canvases,
      textures: textures
    };
  });
  Promise.all([svg_loader,canvas_loader]).then(function (arr) {
    var canvases = Object.assign({},svg_textures.canvases,canvas_textures.canvases);
    var textures = Object.assign({},svg_textures.textures,canvas_textures.textures);

    //console.log(Object.keys(canvases));
    //console.log(Object.keys(textures));

    var width = $(window).width();
    var height = $(window).height() - $("#input").height();

    var renderer, scene, camera, cube, target, tan_bed;

    var mouseX = 0;
    var mouseY = 0;
    
    var windowHalfX = width / 2;
    var windowHalfY = height / 2;
    
    var tr = 100, tx = 0, ty = 0, tz = 100;
    var vt = Math.PI / 2, vp = Math.PI / 3;

    function onDocumentMouseMove(event) {
      mouseX = (event.clientX - windowHalfX) / windowHalfX * vt;
      mouseY = (event.clientY - windowHalfY) / windowHalfY * vp;
      ty = target.position.y + tr * Math.sin(mouseY);
      var r = tr * Math.cos(mouseY);
      tx = target.position.x - r * Math.sin(mouseX);
      tz = target.position.z + r * Math.cos(mouseX);
    }
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, width / height, 1, 2000);
    camera.position.z = 100;
    scene.add(camera);
    
    function onWindowResize() {
      var width = $(window).width();
      var height = $(window).height() - $("#input").height();
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      
      windowHalfX = width / 2;
      windowHalfY = height / 2;
    }
    window.addEventListener('resize', onWindowResize, false);

    var bs = 100;
    cube = new THREE.Mesh(new THREE.BoxGeometry(bs, bs, bs), new THREE.MeshToonMaterial({
      color: 0xffffff,
      //reflectivity: 1,
      //specular: 0xaa00ff,
      //shininess: 1,
      map: textures["svg-tex-03"],
      bumpMap: textures["svg-tex-02"],
      bumpScale: 5
    }));
    //scene.add(cube);
    
    var spriteMap = textures["svg-tex-target"];
    var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set( 10, 10, 1.0 );
    scene.add( sprite );

    var ts = 10;
    target = new THREE.Mesh(new THREE.BoxGeometry(ts, ts, ts), new THREE.MeshToonMaterial({
      color: 0,
      reflectivity: 1,
      specular: 0xaa00ff,
      shininess: 1,
    }));
    //scene.add(target);
    
    var wall_mat = new THREE.MeshToonMaterial({
      color: 0xaaaaaa
      //reflectivity: 1,
      //specular: 0xaa00ff,
      //shininess: 1,
    });
    var wb = 1500, ww = 1000, wh = 800, wg = 1;
    var walls = [
      new THREE.Mesh(new THREE.PlaneGeometry(wb, wh, wg, wg), wall_mat),
      new THREE.Mesh(new THREE.PlaneGeometry(wb, wh, wg, wg),  wall_mat),
      new THREE.Mesh(new THREE.PlaneGeometry(ww, wh, wg, wg),  wall_mat),
      new THREE.Mesh(new THREE.PlaneGeometry(ww, wh, wg, wg),  wall_mat)
    ];
    walls[0].position.set(0,0,-ww / 2);
    walls[1].position.set(0,0,ww / 2);
    walls[1].rotation.y = Math.PI;
    walls[2].position.set(-wb / 2,0,0);
    walls[2].rotation.y = Math.PI / 2;
    walls[3].position.set(wb / 2,0,0);
    walls[3].rotation.y = -Math.PI / 2;
    for(var i = 0; i < 4; i++)
      scene.add(walls[i]);
    
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(wb, ww, wg, wg), new THREE.MeshToonMaterial({
      color: 0xaa8844,
      shininess: 0,
      specular: 0x111111
    }));
    floor.position.set(0,-wh / 2,0);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    
    var ciel = new THREE.Mesh(new THREE.PlaneGeometry(wb, ww, wg, wg), new THREE.MeshToonMaterial({
      color: 0x777777,
      shininess: 10,
      specular: 0x111111
    }));
    ciel.position.set(0,wh / 2,0);
    ciel.rotation.x = Math.PI / 2
    scene.add(ciel);
    
    var pw = 500, ph = 250, pg = 1;
    tan_bed = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph, pg, pg), new THREE.MeshToonMaterial({
      color: 0xffffff,
      transparent: true,
      map: textures["svg-tex-tan-bed"]
    }));
    tan_bed.position.set(-(wb-pw) / 2,-(wh-ph)/2,-3*ww/8);
    scene.add(tan_bed);

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(3, 2, 5);
    scene.add(light);
    var ambient = new THREE.AmbientLight( 0x404040 );
    scene.add(ambient);
    
    var delta = 0.05;
    function animate() {
      requestAnimationFrame(animate);
      
      camera.position.x += (tx - camera.position.x) * delta;
      camera.position.y += (ty - camera.position.y) * delta;
      camera.position.z += (tz - camera.position.z) * delta;
      camera.lookAt(target.position);
      //camera.lookAt(cube.position);
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }

    animate();
  });
});
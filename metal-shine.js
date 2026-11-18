(function () {
  var canvas = document.querySelector(".hero--metal .metal-bg__glint");
  if (!canvas || canvas.tagName !== "CANVAS" || !canvas.getContext) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  var plate = new Image();
  var mask = new Image();
  plate.src = "assets/liquid-metal.jpg?v=4";
  mask.src = "assets/liquid-metal-mask.png";

  var ANGLE = (23 * Math.PI) / 180;
  var CYCLE = 9000;
  var frozen = null;
  var params = new URLSearchParams(window.location.search);
  if (params.has("shine")) {
    var n = Number(params.get("shine"));
    if (!isNaN(n)) frozen = Math.max(0, Math.min(1, n));
  }

  var plateLayer = document.createElement("canvas");
  var plateKey = "";
  var shineLayer = document.createElement("canvas");
  var shineCtx = shineLayer.getContext("2d", { alpha: true });

  function drawCover(context, image) {
    var w = context.canvas.width;
    var h = context.canvas.height;
    var scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    var dw = image.naturalWidth * scale;
    var dh = image.naturalHeight * scale;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth;
    var cssH = canvas.clientHeight;
    if (!cssW || !cssH) return false;
    var w = Math.round(cssW * dpr);
    var h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return true;
  }

  function ensurePlate(w, h) {
    var key = w + "x" + h;
    if (plateKey === key) return;
    plateLayer.width = w;
    plateLayer.height = h;
    var pctx = plateLayer.getContext("2d");
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, w, h);
    drawCover(pctx, plate);
    plateKey = key;
  }

  function gray(amount) {
    var v = Math.max(0, Math.min(255, Math.round(amount * 255)));
    return "rgb(" + v + "," + v + "," + v + ")";
  }

  function draw(u, fade) {
    if (!resize() || !plate.naturalWidth || !mask.naturalWidth) return;
    var w = canvas.width;
    var h = canvas.height;
    ensurePlate(w, h);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(plateLayer, 0, 0);
    if (fade < 0.004) return;

    if (shineLayer.width !== w || shineLayer.height !== h) {
      shineLayer.width = w;
      shineLayer.height = h;
    }
    shineCtx.setTransform(1, 0, 0, 1, 0, 0);
    shineCtx.globalCompositeOperation = "source-over";
    shineCtx.clearRect(0, 0, w, h);
    shineCtx.save();
    shineCtx.translate(w / 2, h / 2);
    shineCtx.rotate(ANGLE);
    var reach = Math.hypot(w, h) * 0.62;
    var y = (u - 0.5) * 2 * reach;
    var half = Math.min(w, h) * 0.15;
    var g = shineCtx.createLinearGradient(0, y - half, 0, y + half);
    // Opaque grays. Screen-blended onto the plate, a gray lifts the chrome
    // without painting a flat white bar. The mask then keeps it off the black.
    g.addColorStop(0, gray(0));
    g.addColorStop(0.2, gray(0.04 * fade));
    g.addColorStop(0.38, gray(0.14 * fade));
    g.addColorStop(0.47, gray(0.4 * fade));
    g.addColorStop(0.5, gray(0.82 * fade));
    g.addColorStop(0.53, gray(0.4 * fade));
    g.addColorStop(0.62, gray(0.14 * fade));
    g.addColorStop(0.8, gray(0.04 * fade));
    g.addColorStop(1, gray(0));
    shineCtx.fillStyle = g;
    shineCtx.fillRect(-Math.hypot(w, h), y - half, Math.hypot(w, h) * 2, half * 2);
    shineCtx.restore();
    shineCtx.globalCompositeOperation = "destination-in";
    drawCover(shineCtx, mask);

    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(shineLayer, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    var u = 0.5;
    var fade = 1;
    if (frozen === null) {
      var t = (now % CYCLE) / CYCLE;
      var a0 = 0.08;
      var a1 = 0.7;
      fade = 0;
      u = 0;
      if (t >= a0 && t <= a1) {
        var p = (t - a0) / (a1 - a0);
        u = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var edge = 0.14;
        if (p < edge) fade = p / edge;
        else if (p > 1 - edge) fade = (1 - p) / edge;
        else fade = 1;
        fade = fade * fade * (3 - 2 * fade);
      }
    } else {
      u = frozen;
      fade = frozen <= 0.001 ? 0 : 1;
    }
    draw(u, fade);
    if (frozen === null) requestAnimationFrame(frame);
  }

  var started = false;
  function start() {
    if (started || !plate.naturalWidth || !mask.naturalWidth) return;
    started = true;
    requestAnimationFrame(frame);
  }

  plate.onload = start;
  mask.onload = start;
  if (plate.complete) start();
  if (mask.complete) start();

  window.addEventListener("resize", function () {
    plateKey = "";
    if (frozen !== null) draw(frozen, frozen <= 0.001 ? 0 : 1);
  });
})();

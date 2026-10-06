/* =========================================================
   MANGO — 商品LP(mango.html 専用)
   ========================================================= */
(function () {
  'use strict';

  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };
  var vh = window.innerHeight;

  /* ---------- ローダー ---------- */
  var loaderCount = document.getElementById('loaderCount');
  var loaderBar = document.getElementById('loaderBar');
  var isNarrow = window.matchMedia('(max-width: 720px)').matches;
  var heroImage = isNarrow ? 'images/mango-lp/hero-9x16.jpg' : 'images/mango-lp/hero-16x9.jpg';
  var loaded = false;
  var shown = 0;
  var startedAt = performance.now();

  var preload = new Image();
  preload.onload = preload.onerror = function () { loaded = true; };
  preload.src = heroImage;
  // 画像が遅くても4秒で開く
  setTimeout(function () { loaded = true; }, 4000);

  function tickLoader(now) {
    var minTime = reduceMotion ? 0 : 1400;
    var target = loaded && now - startedAt > minTime ? 100 : Math.min(90, (now - startedAt) / 20);
    shown += (target - shown) * 0.12;
    if (target === 100 && shown > 99.5) shown = 100;
    loaderCount.textContent = Math.round(shown);
    loaderBar.style.transform = 'scaleX(' + shown / 100 + ')';
    if (shown < 100) {
      requestAnimationFrame(tickLoader);
    } else {
      body.classList.remove('is-loading');
      body.classList.add('is-loaded');
      startHeroVideo();
      // 登場ズームが終わったら、スクロール追従を遅延なしに切り替える
      setTimeout(function () { document.getElementById('heroMedia').style.transition = 'none'; }, 2800);
    }
  }
  requestAnimationFrame(tickLoader);

  /* ---------- ヒーロー動画(存在する場合のみ再生) ---------- */
  function startHeroVideo() {
    var video = document.getElementById('heroVideo');
    if (!video || reduceMotion) return;
    var src = isNarrow ? video.dataset.srcTall : video.dataset.srcWide;
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    video.addEventListener('error', function () { video.remove(); });
    video.src = src;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* 自動再生不可・ファイル無し → 背景画像のまま */ });
  }

  /* ---------- 文字分割(ステートメント) ---------- */
  var statement = document.getElementById('statementText');
  var chars = [];
  if (statement) {
    var hotWords = ['マンゴー', '看板メニュー'];
    var text = statement.textContent;
    var hotRanges = [];
    hotWords.forEach(function (w) {
      var idx = text.indexOf(w);
      if (idx > -1) hotRanges.push([idx, idx + w.length]);
    });
    statement.textContent = '';
    Array.prototype.forEach.call(text, function (c, i) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c;
      if (hotRanges.some(function (r) { return i >= r[0] && i < r[1]; })) span.dataset.hot = '1';
      statement.appendChild(span);
      chars.push(span);
    });
  }

  /* ---------- スクロールリビール ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv, .rv-clip, .mg-final__big').forEach(function (el) { io.observe(el); });

  /* ---------- スクロール連動 ---------- */
  var header = document.getElementById('header');
  var progress = document.getElementById('progress');
  var heroMedia = document.getElementById('heroMedia');
  var heroContent = document.getElementById('heroContent');
  var marquee = document.getElementById('marquee');
  var anatomy = document.getElementById('anatomy');
  var product = document.getElementById('product');
  var anatomyWord = document.getElementById('anatomyWord');
  var anatomyMeter = document.getElementById('anatomyMeter');
  var points = document.querySelectorAll('#points li');
  var parallaxEls = document.querySelectorAll('[data-parallax]');

  var lastY = window.scrollY;
  var velocity = 0;
  var marqueeX = 0;
  var marqueeHalf = 0;
  var activePoint = 0;

  function measure() {
    vh = window.innerHeight;
    marqueeHalf = marquee ? marquee.scrollWidth / 2 : 0;
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  function onFrame() {
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - vh;
    velocity += ((y - lastY) - velocity) * 0.15;
    lastY = y;

    // 進捗バー
    progress.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0) + ')';

    // ヘッダー:少し下で背景、下スクロールで隠す
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > vh * 0.8 && velocity > 1.5);

    if (!reduceMotion) {
      // ヒーロー:背景は奥へ、文字は手前へ抜ける
      if (y < vh * 1.2 && body.classList.contains('is-loaded')) {
        var h = y / vh;
        heroMedia.style.transform = 'scale(' + (1 + h * 0.18) + ') translateY(' + h * 8 + '%)';
        heroContent.style.transform = 'translateY(' + h * -28 + '%)';
        heroContent.style.opacity = String(clamp(1 - h * 1.4, 0, 1));
      }

      // マーキー:スクロール速度で加速・逆走
      if (marqueeHalf) {
        marqueeX -= 1.2 + velocity * 0.6;
        if (marqueeX <= -marqueeHalf) marqueeX += marqueeHalf;
        if (marqueeX > 0) marqueeX -= marqueeHalf;
        marquee.style.transform = 'translate3d(' + marqueeX + 'px,0,0) skewX(' + clamp(-velocity * 0.4, -12, 12) + 'deg)';
      }

      // パララックス
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var center = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (-center * parseFloat(el.dataset.parallax)) + 'px,0)';
      });
    }

    // ステートメント:読み進めるように文字が灯る
    if (chars.length) {
      var sr = statement.getBoundingClientRect();
      var sp = clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.35), 0, 1);
      var lit = Math.floor(sp * chars.length);
      for (var i = 0; i < chars.length; i++) {
        var on = i < lit;
        chars[i].classList.toggle('on', on && !chars[i].dataset.hot);
        chars[i].classList.toggle('hot', on && !!chars[i].dataset.hot);
      }
    }

    // アナトミー:固定したまま商品が回転・拡大し、解説が切り替わる
    if (anatomy) {
      var ar = anatomy.getBoundingClientRect();
      var ap = clamp(-ar.top / (ar.height - vh), 0, 1);
      if (!reduceMotion) {
        var scale = 0.78 + Math.sin(ap * Math.PI) * 0.28;
        var rot = (ap - 0.5) * 14;
        var lift = Math.sin(ap * Math.PI * 2) * -3;
        product.style.transform = 'translateY(' + lift + '%) rotate(' + rot + 'deg) scale(' + scale + ')';
        anatomyWord.style.transform = 'translate(calc(-50% + ' + (0.5 - ap) * 40 + 'vw), -50%)';
      }
      anatomyMeter.style.transform = 'scaleX(' + ap + ')';
      var idx = Math.min(points.length - 1, Math.floor(ap * points.length));
      if (idx !== activePoint) {
        points[activePoint].classList.remove('is-active');
        points[idx].classList.add('is-active');
        activePoint = idx;
      }
    }

    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  /* ---------- カーソル・マグネット・チルト(マウス環境のみ) ---------- */
  if (finePointer && !reduceMotion) {
    var cursor = document.getElementById('cursor');
    var mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function follow() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a, button, [data-tilt]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.3 + 'px,' + dy * 0.4 + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.transform = 'rotateY(' + (px - 0.5) * 10 + 'deg) rotateX(' + (0.5 - py) * 10 + 'deg)';
        el.style.setProperty('--mx', px * 100 + '%');
        el.style.setProperty('--my', py * 100 + '%');
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
})();

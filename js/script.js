// 動きを減らす設定・マウス操作の有無を判定
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// data-image属性から背景画像を反映(ヒーロー・想い・メニュー・サービス共通)
document.querySelectorAll("[data-image]").forEach((el) => {
  el.style.backgroundImage = `url("${el.dataset.image}")`;
});

// ヒーロー:画像スライダーの自動切り替え+進行バー
const heroSlides = document.querySelectorAll(".hero-slide");
const heroProgress = document.querySelectorAll("#heroProgress span");
let heroTimer = null;

if (heroSlides.length > 1) {
  let heroSlideIndex = 0;

  heroTimer = setInterval(() => {
    heroSlides[heroSlideIndex].classList.remove("is-active");
    heroProgress[heroSlideIndex]?.classList.remove("is-active");
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    heroSlides[heroSlideIndex].classList.add("is-active");
    heroProgress[heroSlideIndex]?.classList.add("is-active");
  }, 5000);
}

// ヒーロー:data-video があればループ動画背景に切り替え(PC幅・通信節約OFF・動き許可時のみ)
const hero = document.getElementById("hero");
const saveData = navigator.connection && navigator.connection.saveData;

if (hero && hero.dataset.video && !prefersReducedMotion && !saveData && window.innerWidth > 640) {
  const video = document.createElement("video");
  video.className = "hero-video";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute("aria-hidden", "true");
  if (hero.dataset.videoPoster) video.poster = hero.dataset.videoPoster;
  video.src = hero.dataset.video;

  video.addEventListener("canplay", () => {
    video.classList.add("is-ready");
    clearInterval(heroTimer);
    document.getElementById("heroProgress")?.remove();
  }, { once: true });

  // 読み込めない場合はスライダーのまま
  video.addEventListener("error", () => video.remove(), { once: true });

  hero.querySelector(".hero-slider").after(video);
}

// ヒーロー:見出しを1文字ずつに分割して浮き上がらせる
document.querySelectorAll("[data-split]").forEach((heading) => {
  heading.setAttribute("aria-label", heading.textContent.trim());
  let charIndex = 0;

  const splitNode = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        [...child.textContent].forEach((char) => {
          if (char === " ") {
            fragment.append(" ");
            return;
          }
          const span = document.createElement("span");
          span.className = "split-char";
          span.textContent = char;
          span.style.setProperty("--i", charIndex++);
          span.setAttribute("aria-hidden", "true");
          fragment.append(span);
        });
        child.replaceWith(fragment);
      } else {
        splitNode(child);
      }
    });
  };

  splitNode(heading);
});

// メニューカード:クリックで画像全体をライトボックス表示
const menuLightbox = document.getElementById("menuLightbox");
const menuLightboxClose = document.getElementById("menuLightboxClose");
const menuLightboxImg = document.getElementById("menuLightboxImg");

if (menuLightbox && menuLightboxImg) {
  const closeLightbox = () => menuLightbox.classList.remove("is-open");

  document.querySelectorAll(".menu-card .menu-card-image[data-image]").forEach((el) => {
    const title = el.closest(".menu-card").querySelector("h3, h4");

    el.classList.add("is-clickable");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `${title ? title.textContent : "メニュー"}の画像を拡大`);

    const open = () => {
      menuLightboxImg.src = el.dataset.full || el.dataset.image;
      menuLightboxImg.alt = title ? title.textContent : "";
      menuLightbox.classList.add("is-open");
      menuLightboxClose.focus();
    };

    el.addEventListener("click", open);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  menuLightboxClose.addEventListener("click", closeLightbox);

  menuLightbox.addEventListener("click", (event) => {
    if (event.target === menuLightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

// ヘッダー:スクロールで背景を強め、下スクロール時は隠して上スクロールで再表示
const header = document.getElementById("siteHeader");
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 20);

  if (!header.classList.contains("is-nav-open")) {
    header.classList.toggle("is-hidden", y > lastScrollY && y > 240);
  }
  lastScrollY = y;
}, { passive: true });

// ヘッダー:スマホ用ハンバーガーメニューの開閉
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav && header) {
  const closeNav = () => {
    header.classList.remove("is-nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("nav-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-nav-open");
    header.classList.remove("is-hidden");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
    document.body.classList.toggle("nav-open", isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640 && header.classList.contains("is-nav-open")) {
      closeNav();
    }
  });
}

// スクロールで要素をフェードイン表示(同じ並びの要素は少しずつ遅らせる)
const revealTargets = document.querySelectorAll(".reveal");

revealTargets.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((child) => child.classList.contains("reveal"));
  const order = siblings.indexOf(el);
  if (order > 0) el.style.setProperty("--reveal-delay", `${Math.min(order, 4) * 0.09}s`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
        // 表示後はホバー演出に遅延が残らないよう解除
        setTimeout(() => entry.target.style.removeProperty("--reveal-delay"), 1400);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((el) => revealObserver.observe(el));

// パララックス:data-parallax の値に応じてスクロール量の一部だけずらす
const parallaxTargets = document.querySelectorAll("[data-parallax]");

if (parallaxTargets.length && !prefersReducedMotion) {
  let ticking = false;

  const updateParallax = () => {
    const viewCenter = window.innerHeight / 2;
    parallaxTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const raw = (rect.top + rect.height / 2 - viewCenter) * parseFloat(el.dataset.parallax);
      const offset = Math.max(-60, Math.min(60, raw));
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  updateParallax();
}

// カード:マウス位置に合わせて立体的に傾ける(PCのみ)
if (hasFinePointer && !prefersReducedMotion) {
  document.querySelectorAll(".menu-teaser-item, .service-teaser-item, .menu-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

// サイドメニュー:スクロール位置に応じてアクティブ表示を切り替え
const sideMenuLinks = document.querySelectorAll(".side-menu a");
const sideMenuTargets = document.querySelectorAll("#kakigori-menu, #tapioca-drink, #jelly-drink");

if (sideMenuLinks.length && sideMenuTargets.length) {
  const sideMenuObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          sideMenuLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sideMenuTargets.forEach((target) => sideMenuObserver.observe(target));
}

(function () {
  var hero = document.querySelector(".hero");
  if (hero && window.LLS_HERO_A && window.LLS_HERO_B) {
    hero.style.backgroundImage =
      "linear-gradient(90deg, rgba(248,243,234,0.97) 0%, rgba(248,243,234,0.86) 26%, rgba(248,243,234,0.28) 48%, rgba(248,243,234,0.05) 64%), url(\"data:image/jpeg;base64," + LLS_HERO_A + LLS_HERO_B + "\")";
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "right center";
    hero.style.backgroundRepeat = "no-repeat";
  }
  if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches && hero) {
    hero.style.backgroundPosition = "78% 28%";
    hero.style.backgroundImage =
      "linear-gradient(180deg, rgba(248,243,234,0.96) 0%, rgba(248,243,234,0.72) 36%, rgba(248,243,234,0.16) 55%), url(\"data:image/jpeg;base64," + LLS_HERO_A + LLS_HERO_B + "\")";
  }
  if (window.LLS_PORTRAIT) {
    document.querySelectorAll("[data-family-photo]").forEach(function (img) {
      img.src = "data:image/jpeg;base64," + LLS_PORTRAIT;
    });
  }
})();

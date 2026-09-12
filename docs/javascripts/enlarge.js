/* Diagrams are height-capped in stylesheets/extra.css so that no single one
   dominates the page. To make sure nothing is lost by that, every content
   image becomes openable at full size in a new tab.

   Images that are already inside a link are left alone — the two infographics
   link to themselves. */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".md-typeset p > img").forEach(function (img) {
    if (img.parentElement && img.parentElement.tagName === "A") return;
    var link = document.createElement("a");
    link.href = img.currentSrc || img.src;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "Open at full size";
    link.setAttribute("data-enlarge", "");
    img.parentElement.insertBefore(link, img);
    link.appendChild(img);
  });
});

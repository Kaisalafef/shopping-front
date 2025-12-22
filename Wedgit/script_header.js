document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const desktopDropdown = document.getElementById("desktopDropdown");
  const mobileMenu = document.getElementById("mobileMenu");

  // Safety check: Only run if elements exist on the page
  if (!profileBtn || !desktopDropdown || !mobileMenu) return;

  // Toggle Logic
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Stop click from bubbling to document immediately

    if (window.innerWidth > 768) {
      // Desktop: Toggle Dropdown
      const isVisible = desktopDropdown.style.display === "block";
      desktopDropdown.style.display = isVisible ? "none" : "block";
    } else {
      // Mobile: Toggle Sidebar
      mobileMenu.classList.toggle("active");
    }
  });

  // Close menus when clicking anywhere else on the page
  document.addEventListener("click", (e) => {
    // Close Desktop Dropdown if click is outside button and menu
    if (!profileBtn.contains(e.target) && !desktopDropdown.contains(e.target)) {
      desktopDropdown.style.display = "none";
    }

    // Close Mobile Menu if click is outside menu and button
    if (!mobileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
      mobileMenu.classList.remove("active");
    }
  });

  // Optional: Reset views on resize to prevent bugs when rotating screens
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      mobileMenu.classList.remove("active");
    } else {
      desktopDropdown.style.display = "none";
    }
  });
});
let t1 = gsap.timeline();
t1.from(".main-header ", {
  y: -100,
 
  opacity: 0,
  duration: 2,
  ease: "power2.out",
});


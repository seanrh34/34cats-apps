export function smoothScrollToSection(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
) {
  e.preventDefault();
  // Extract the hash from the href (e.g., "/#apps" or "#apps" -> "apps")
  const hash = href.includes('#') ? href.split('#')[1] : '';
  if (hash) {
    const element = document.getElementById(hash);
    if (element) {
      const navbarHeight = 64; // h-16 = 64px
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // 配置参数
  const SCROLL_DEBOUNCE = 100;
  const SCROLL_OFFSET = -10;
  
  // 获取元素引用
  const tocContainer = document.querySelector('.toc-container');
  const tocLinks = Array.from(tocContainer.querySelectorAll('a[href^="#"]')); // 选择所有锚点链接
  
  // 构建标题映射表
  const headingMap = new Map();
  tocLinks.forEach(link => {
    const hash = decodeURIComponent(link.hash);
    if (!hash) return;
    
    const heading = document.querySelector(hash);
    if (heading) {
      headingMap.set(link, {
        element: heading,
        // 偏移量补偿
        offset: SCROLL_OFFSET
      });
    }
  });

  // ====================== 平滑滚动逻辑 ======================
  function smoothScrollTo(targetElement, offset = SCROLL_OFFSET) {
    const targetOffset = targetElement.offsetTop - offset;
    const startPos = window.pageYOffset;
    const distance = targetOffset - startPos;
    const duration = 500;
    let startTime = null;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      window.scrollTo(0, startPos + distance * easeInOutCubic(progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        history.replaceState(null, null, `#${targetElement.id}`);
      }
    }

    requestAnimationFrame(animate);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ====================== 点击事件绑定 ======================
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const data = headingMap.get(link);
      if (!data) return;
      
      smoothScrollTo(data.element, data.offset);
    });
  });

  // ====================== 滚动联动逻辑 ======================
  let lastScrollTime = 0;
  
  function handleScroll() {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_DEBOUNCE) return;
    lastScrollTime = now;

    const activeLink = findActiveLink();
    if (!activeLink) return;

    highlightTOC(activeLink);
    adjustTOCScroll(activeLink);
  }

  function findActiveLink() {
    let activeLink = null;
    let closestDistance = Infinity;

    // 遍历所有映射关系
    headingMap.forEach((data, link) => {
      const rect = data.element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const scrollPosition = window.pageYOffset + data.offset;

      // 计算与视口的距离
      const distance = Math.abs(elementTop - scrollPosition);
      
      if (elementTop <= scrollPosition && distance < closestDistance) {
        closestDistance = distance;
        activeLink = link;
      }
    });

    return activeLink;
  }

  function highlightTOC(activeLink) {
    tocLinks.forEach(link => {
      link.classList.toggle('current', link === activeLink);
    });
  }

  function adjustTOCScroll(activeLink) {
    const linkTop = activeLink.offsetTop;
    const containerHeight = tocContainer.offsetHeight;
    const scrollPos = linkTop - containerHeight / 2;

    tocContainer.scrollTo({
      top: scrollPos,
      behavior: 'smooth'
    });
  }

  // ====================== 初始化 ======================
  window.addEventListener('scroll', handleScroll);
  
  // 初始化高亮状态
  setTimeout(() => {
    const hash = decodeURIComponent(window.location.hash);
    if (hash) {
      const target = document.querySelector(hash);
      if (target) smoothScrollTo(target);
    }
    handleScroll(); // 强制更新初始状态
  }, 100);
});

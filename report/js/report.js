// 웹프로젝트 결과보고서 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 부드러운 스크롤 네비게이션
    initSmoothScrolling();
    
    // 맨 위로 버튼 기능
    initBackToTopButton();
    
    // 스크롤 애니메이션
    initScrollAnimations();
    
    // 추가 기능들
    initScrollSpy();
    initCodeCopyFeature();
    initPrintFeature();
    initKeyboardShortcuts();
    initAccessibilityFeatures();
    
    console.log('웹프로젝트 결과보고서 JavaScript 초기화 완료');
});

/**
 * 부드러운 스크롤 네비게이션 초기화
 */
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.table-of-contents a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 100; // 목차 높이 고려
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // 활성 링크 표시
                updateActiveNavLink(this);
            }
        });
    });
}

/**
 * 활성 네비게이션 링크 업데이트
 */
function updateActiveNavLink(activeLink) {
    const navLinks = document.querySelectorAll('.table-of-contents a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    activeLink.classList.add('active');
}

/**
 * 맨 위로 버튼 기능 초기화
 */
function initBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (!backToTopBtn) return;
    
    // 스크롤 위치에 따라 버튼 표시/숨김
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // 버튼 클릭 시 맨 위로 스크롤
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 스크롤 애니메이션 초기화
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-item, .tech-item, .demo-section, .achievement-item, .improvement-item, .future-plan');
    
    // Intersection Observer를 사용한 스크롤 애니메이션
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 애니메이션 요소들 초기화 및 관찰 시작
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(element);
    });
}

/**
 * 스크롤 위치에 따른 네비게이션 활성화
 */
function initScrollSpy() {
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.table-of-contents a[href^="#"]');
    
    window.addEventListener('scroll', function() {
        let current = '';
        const scrollPosition = window.pageYOffset + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * 코드 복사 기능
 */
function initCodeCopyFeature() {
    const codeBlocks = document.querySelectorAll('.code-block pre code, .code-snippet pre code');
    
    codeBlocks.forEach(codeBlock => {
        const container = codeBlock.closest('.code-block, .code-snippet');
        if (!container) return;
        
        // 복사 버튼 생성
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> 복사';
        copyButton.setAttribute('aria-label', '코드 복사');
        
        // 버튼 스타일
        copyButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 10;
        `;
        
        // 컨테이너에 상대 위치 설정
        container.style.position = 'relative';
        
        // 호버 시 버튼 표시
        container.addEventListener('mouseenter', () => {
            copyButton.style.opacity = '1';
        });
        
        container.addEventListener('mouseleave', () => {
            copyButton.style.opacity = '0';
        });
        
        // 복사 기능
        copyButton.addEventListener('click', async () => {
            try {
                const code = codeBlock.textContent;
                await navigator.clipboard.writeText(code);
                
                // 성공 피드백
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check"></i> 복사됨!';
                copyButton.style.background = '#10b981';
                
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.style.background = 'var(--primary-color)';
                }, 2000);
                
            } catch (err) {
                console.error('코드 복사 실패:', err);
                
                // 실패 피드백
                copyButton.innerHTML = '<i class="fas fa-times"></i> 실패';
                copyButton.style.background = '#ef4444';
                
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> 복사';
                    copyButton.style.background = 'var(--primary-color)';
                }, 2000);
            }
        });
        
        container.appendChild(copyButton);
    });
}

/**
 * 인쇄 기능
 */
function initPrintFeature() {
    // 인쇄 버튼이 있다면 기능 추가
    const printButton = document.getElementById('print-report');
    
    if (printButton) {
        printButton.addEventListener('click', function() {
            // 인쇄 전 스타일 조정
            document.body.classList.add('printing');
            
            window.print();
            
            // 인쇄 후 원래 상태로 복원
            setTimeout(() => {
                document.body.classList.remove('printing');
            }, 1000);
        });
    }
}

/**
 * 키보드 단축키 기능
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + P: 인쇄
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
        
        // Home 키: 맨 위로
        if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // End 키: 맨 아래로
        if (e.key === 'End' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
}

/**
 * 접근성 개선
 */
function initAccessibilityFeatures() {
    // 스킵 링크 추가
    addSkipLink();
    
    // 포커스 관리
    manageFocus();
    
    // ARIA 레이블 추가
    addAriaLabels();
}

/**
 * 스킵 링크 추가
 */
function addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = '본문으로 건너뛰기';
    skipLink.className = 'skip-link';
    
    // 스킵 링크 스타일
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    // 포커스 시 표시
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // 메인 콘텐츠에 ID 추가
    const mainContent = document.querySelector('.report-content');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
    }
}

/**
 * 포커스 관리
 */
function manageFocus() {
    // 네비게이션 링크 클릭 시 해당 섹션으로 포커스 이동
    const navLinks = document.querySelectorAll('.table-of-contents a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                setTimeout(() => {
                    targetElement.focus();
                }, 100);
            }
        });
    });
}

/**
 * ARIA 레이블 추가
 */
function addAriaLabels() {
    // 섹션에 aria-labelledby 추가
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        const heading = section.querySelector('h2');
        if (heading) {
            const headingId = heading.id || `heading-${Math.random().toString(36).substr(2, 9)}`;
            heading.id = headingId;
            section.setAttribute('aria-labelledby', headingId);
        }
    });
    
    // 목차에 nav 역할 추가
    const toc = document.querySelector('.table-of-contents');
    if (toc) {
        toc.setAttribute('role', 'navigation');
        toc.setAttribute('aria-label', '목차');
    }
}

/**
 * 다크 모드 토글 기능 (선택사항)
 */
function initThemeToggle() {
    // 다크 모드 토글 버튼이 있다면 기능 활성화
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) return;
    
    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('report-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 테마 토글 버튼 클릭 이벤트
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('report-theme', newTheme);
        
        // 버튼 아이콘 업데이트
        updateThemeIcon(newTheme);
    });
    
    // 초기 아이콘 설정
    updateThemeIcon(savedTheme);
}

/**
 * 테마 아이콘 업데이트
 */
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}
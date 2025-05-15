/**
 * 패턴 상세 페이지 로더
 * 패턴 데이터 로드 및 렌더링을 관리하는 통합 모듈
 */

// 패턴 페이지 로더 모듈
const PatternPageLoader = (function() {
    // 내부 상태
    let patternData = null;
    let isInitialized = false;
    let loadStartTime = null;
    const dataCache = {}; // 패턴 데이터 캐시
    
    /**
     * URL에서 패턴 ID 추출
     * @returns {string} 패턴 ID 또는 기본값
     */
    function getPatternId() {
        const urlParams = new URLSearchParams(window.location.search);
        const patternId = urlParams.get('id');
        
        // ID가 없으면 URL 경로에서 추출 시도
        if (!patternId) {
            const path = window.location.pathname;
            const match = path.match(/\/patterns\/([^\/]+)\.html$/);
            if (match && match[1]) {
                return match[1];
            }
            // 경로에서도 찾지 못하면 기본값으로 factory 반환
            return 'factory';
        }
        
        return patternId;
    }
    
    /**
     * 패턴 데이터 로드
     * @returns {Promise<Object>} 패턴 데이터
     */
    async function loadPatternData() {
        const patternId = getPatternId();
        
        // 캐시에서 데이터 확인
        if (dataCache[patternId]) {
            console.log(`캐시에서 패턴 데이터 로드: ${patternId}`);
            return dataCache[patternId];
        }
        
        const jsonUrl = `data/detail/${patternId}.json`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
            
            const response = await fetch(jsonUrl, { 
                signal: controller.signal,
                cache: 'no-cache' // 캐시 무시하고 항상 새로 로드
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 캐시에 데이터 저장
            dataCache[patternId] = data;
            
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('패턴 데이터 로드 시간 초과');
                showErrorMessage('데이터 로드 시간이 초과되었습니다. 인터넷 연결을 확인하세요.');
            } else {
                console.error('패턴 데이터를 불러오는 중 오류가 발생했습니다:', error);
                showErrorMessage(error.message);
            }
            throw error;
        }
    }
    
    /**
     * 오류 메시지 표시
     * @param {string} message 오류 메시지
     */
    function showErrorMessage(message) {
        document.getElementById('pattern-content').innerHTML = `
            <div class="content-section">
                <h2>오류 발생</h2>
                <p>패턴 데이터를 불러오는 중 오류가 발생했습니다.</p>
                <p>${message}</p>
                <p><a href="patterns.html">패턴 목록으로 돌아가기</a></p>
            </div>
        `;
    }
    
    /**
     * 로딩 상태 표시
     * @param {boolean} isLoading 로딩 중 여부
     */
    function showLoadingState(isLoading) {
        const titleElement = document.getElementById('pattern-title');
        
        if (isLoading) {
            titleElement.textContent = '패턴 로딩 중...';
            titleElement.classList.add('loading');
        } else {
            titleElement.classList.remove('loading');
        }
    }
    
    /**
     * 패턴 메타 정보 렌더링
     * @param {Object} meta 메타 정보 객체
     */
    function renderPatternMeta(meta) {
        const metaContainer = document.getElementById('pattern-meta');
        metaContainer.innerHTML = '';
        
        Object.entries(meta).forEach(([key, value]) => {
            const span = document.createElement('span');
            span.textContent = value;
            span.classList.add(key.toLowerCase());
            metaContainer.appendChild(span);
        });
    }
    
    /**
     * 단순 목록 렌더링 (문자열 배열)
     * @param {string[]} items 항목 배열
     * @param {string} className CSS 클래스명
     * @param {string} title 제목
     * @returns {string} HTML 문자열
     */
    function renderSimpleList(items, className, title) {
        return `
            <div class="${className}">
                ${title ? `<h3>${title}</h3>` : ''}
                <ul>
                    ${items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    /**
     * 상세 목록 렌더링 (객체 배열)
     * @param {Object[]} items 항목 배열
     * @param {string} className CSS 클래스명
     * @returns {string} HTML 문자열
     */
    function renderDetailedList(items, className) {
        return `
            <div class="${className}">
                ${items.map(item => `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 장단점 렌더링
     * @param {Object[]} items 항목 배열
     * @param {string} title 제목
     * @returns {string} HTML 문자열
     */
    function renderProsCons(items, title) {
        return `
            <div class="pattern-pros-cons">
                ${title ? `<h3>${title}</h3>` : ''}
                <ul>
                    ${items.map(item => `
                        <li>
                            <strong>${item.title}</strong>
                            <p>${item.description}</p>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    /**
     * 코드 링크 렌더링
     * @param {Object[]} links 링크 배열
     * @returns {string} HTML 문자열
     */
    function renderCodeLinks(links) {
        return `
            <div class="code-tabs">
                <div class="code-language-buttons">
                    ${links.map(link => {
                        // 경로 수정 - patterns/ 경로 추가
                        const url = link.url.startsWith('http') ? link.url : `patterns/${link.url}`;
                        return `<a href="${url}" class="code-language-btn">${link.language} 코드 보기 <i class="fas fa-code"></i></a>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 내비게이션 버튼 렌더링
     * @param {Object} navigation 내비게이션 객체
     * @returns {string} HTML 문자열
     */
    function renderNavigationButtons(navigation) {
        let html = '<div class="navigation-buttons">';
        
        if (navigation.back) {
            // back 링크가 상대 경로인 경우 경로 조정
            const backUrl = navigation.back.url.startsWith('http') ? 
                            navigation.back.url : 
                            navigation.back.url.replace('../', '');
            
            html += `
                <a href="${backUrl}" class="back-button">
                    <i class="fas fa-arrow-left"></i> ${navigation.back.text}
                </a>
            `;
        }
        
        if (navigation.next) {
            // next 링크가 상대 경로인 경우 경로 조정
            const nextUrl = navigation.next.url.startsWith('http') ? 
                            navigation.next.url : 
                            `patterns/${navigation.next.url}`;
            
            html += `
                <a href="${nextUrl}" class="next-button">
                    ${navigation.next.text} <i class="fas fa-arrow-right"></i>
                </a>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * 패턴 내용 렌더링
     * @param {Object[]} sections 섹션 배열
     * @param {Object} navigation 내비게이션 객체
     */
    function renderPatternContent(sections, navigation) {
        const contentContainer = document.getElementById('pattern-content');
        const fragment = document.createDocumentFragment(); // Document Fragment 사용
        
        // 각 섹션 렌더링
        sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'content-section';
            sectionElement.id = section.id;
            
            let sectionHTML = `<h2>${section.title}</h2>`;
            
            // 일반 텍스트 내용
            if (section.content) {
                sectionHTML += `<p>${section.content}</p>`;
            }
            
            // 혜택 목록 (benefits)
            if (section.benefits && Array.isArray(section.benefits)) {
                if (section.benefits[0] && typeof section.benefits[0] === 'string') {
                    // 단순 문자열 배열
                    const benefitsTitle = section.id === 'basic-concept' ? '' : '주요 장점';
                    sectionHTML += renderSimpleList(section.benefits, 'pattern-benefits', benefitsTitle);
                } else {
                    // 객체 배열 (제목과 설명이 있는 경우)
                    sectionHTML += renderDetailedList(section.benefits, 'pattern-benefits');
                }
            }
            
            // 사용 사례 목록 (useCases)
            if (section.useCases && Array.isArray(section.useCases)) {
                if (section.useCases[0] && typeof section.useCases[0] === 'string') {
                    // 단순 문자열 배열
                    sectionHTML += renderSimpleList(section.useCases, 'pattern-use-cases', '사용 사례');
                } else {
                    // 객체 배열 (제목과 설명이 있는 경우)
                    sectionHTML += renderDetailedList(section.useCases, 'pattern-use-cases');
                }
            }
            
            // 서브타입 (subtypes)
            if (section.subtypes && Array.isArray(section.subtypes)) {
                sectionHTML += `
                    <div class="pattern-types">
                        ${section.subtypes.map(subtype => `
                            <h3>${subtype.title}</h3>
                            <p>${subtype.description}</p>
                        `).join('')}
                    </div>
                `;
            }
            
            // 코드 링크 (codeLinks)
            if (section.codeLinks && Array.isArray(section.codeLinks)) {
                sectionHTML += renderCodeLinks(section.codeLinks);
            }
            
            // 장점 (pros)
            if (section.pros && Array.isArray(section.pros)) {
                sectionHTML += renderProsCons(section.pros, '장점');
            }
            
            // 단점 (cons)
            if (section.cons && Array.isArray(section.cons)) {
                sectionHTML += renderProsCons(section.cons, '단점');
            }
            
            // 모범 사례 (practices)
            if (section.practices && Array.isArray(section.practices)) {
                sectionHTML += renderProsCons(section.practices);
            }
            
            sectionElement.innerHTML = sectionHTML;
            fragment.appendChild(sectionElement);
        });
        
        // 내용 컨테이너 초기화 후 Fragment 추가
        contentContainer.innerHTML = '';
        contentContainer.appendChild(fragment);
        
        // 내비게이션 버튼 추가
        if (navigation) {
            const navElement = document.createElement('div');
            //navElement.className = 'navigation-buttons';
            navElement.innerHTML = renderNavigationButtons(navigation);
            contentContainer.appendChild(navElement);
        }
        
        // 애니메이션 설정
        setTimeout(() => {
            setupAnimations();
        }, 50);
    }
    
    /**
     * 애니메이션 설정
     */
    function setupAnimations() {
        if ('IntersectionObserver' in window) {
            // 스크롤 시 요소를 나타나게 하는 옵저버 설정
            const options = {
                threshold: 0.1,
                rootMargin: "0px 0px -100px 0px"
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, options);
            
            // 콘텐츠 섹션 요소들을 옵저버에 등록
            document.querySelectorAll('.content-section').forEach(section => {
                observer.observe(section);
            });
        } else {
            // IntersectionObserver가 지원되지 않는 경우 대체 방법
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.add('visible');
            });
        }
    }
    
    /**
     * 패턴 데이터 렌더링
     * @param {Object} data 패턴 데이터
     */
    function renderPatternDetail(data) {
        // 로딩 상태 해제
        showLoadingState(false);
        
        // 데이터 저장
        patternData = data;
        
        // 제목 설정
        document.getElementById('pattern-title').textContent = data.title;
        document.title = `${data.title} - GameDev PatternHub`;
        
        // 메타 정보 렌더링
        renderPatternMeta(data.meta);
        
        // 내용 렌더링
        renderPatternContent(data.sections, data.navigation);
        
        // 로딩 시간 측정
        if (loadStartTime) {
            const loadTime = performance.now() - loadStartTime;
            console.log(`패턴 데이터 로드 및 렌더링 완료 (${loadTime.toFixed(2)}ms)`);
        }
    }
    
    /**
     * 페이지 초기화
     */
    async function initialize() {
        if (isInitialized) return;
        
        loadStartTime = performance.now();
        isInitialized = true;
        
        // 로딩 상태 표시
        showLoadingState(true);
        
        try {
            // 패턴 데이터 로드
            const data = await loadPatternData();
            
            // 페이지 렌더링 (requestAnimationFrame으로 다음 프레임에 렌더링)
            window.requestAnimationFrame(() => {
                renderPatternDetail(data);
            });
        } catch (error) {
            console.error('초기화 중 오류 발생:', error);
        }
    }
    
    // 공개 API
    return {
        initialize: initialize,
        renderPatternDetail: renderPatternDetail
    };
})();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    PatternPageLoader.initialize();
});
